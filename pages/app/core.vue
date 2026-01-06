<script setup lang="ts">
definePageMeta({
  layout: 'app',
  middleware: 'auth'
})

// Simple reactive data
const portfolioData = ref(null)
const chartData = ref(null)
const tradesData = ref(null)
const currentPrices = ref<Record<string, number>>({})
const loading = ref(true)

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)
const totalTrades = ref(0)

// Load data on mount
onMounted(async () => {
  await refreshData()

  // Set up real-time refresh every 10 seconds
  setInterval(refreshData, 10000)
})

// Refresh all dashboard data
const refreshData = async () => {
  try {
    const [portfolio, chart, trades] = await Promise.all([
      $fetch('/api/trading/portfolio'),
      $fetch('/api/trading/chart'),
      loadTrades()
    ])

    portfolioData.value = portfolio
    chartData.value = chart

    // Fetch current prices for unrealized PnL calculations
    await fetchCurrentPrices()
  } catch (error) {
    console.error('Failed to refresh dashboard data:', error)
  } finally {
    loading.value = false
  }
}

// Fetch current prices from Binance
const fetchCurrentPrices = async () => {
  if (!tradesData.value?.trades?.length) return

  const symbols = [...new Set(tradesData.value.trades.map((trade: any) => trade.symbol))]
  if (symbols.length === 0) return

  try {
    const prices = await $fetch(`/api/prices?symbols=${symbols.join(',')}`)
    currentPrices.value = prices as Record<string, number>
  } catch (error) {
    console.error('Failed to fetch current prices:', error)
  }
}

// Calculate unrealized PnL for a trade
const calculateUnrealizedPnL = (trade: any) => {
  if (trade.status !== 'OPEN' || !currentPrices.value[trade.symbol]) {
    return { dollar: 0, percentage: 0 }
  }

  const entryPrice = trade.price
  const currentPrice = currentPrices.value[trade.symbol]
  const quantity = trade.quantity
  const leverage = trade.leverage || 1

  // Calculate dollar PnL
  const dollarPnL = trade.side === 'BUY'
    ? (currentPrice - entryPrice) * quantity
    : (entryPrice - currentPrice) * quantity

  // Calculate percentage PnL (based on margin used)
  const entryValue = entryPrice * quantity
  const margin = entryValue / leverage
  const percentagePnL = margin !== 0 ? (dollarPnL / margin) * 100 : 0

  return { dollar: dollarPnL, percentage: percentagePnL }
}

// Calculate total unrealized PnL
const totalUnrealizedPnL = computed(() => {
  if (!tradesData.value?.trades?.length) return { dollar: 0, percentage: 0 }

  let totalDollar = 0
  const openTrades = tradesData.value.trades.filter((trade: any) => trade.status === 'OPEN')

  openTrades.forEach((trade: any) => {
    const pnl = calculateUnrealizedPnL(trade)
    totalDollar += pnl.dollar
  })

  const walletBalance = portfolioData.value?.currentBalance || 0
  const percentage = walletBalance > 0 ? (totalDollar / walletBalance) * 100 : 0

  return { dollar: totalDollar, percentage }
})

// Load trades with pagination
const loadTrades = async () => {
  try {
    const response = await $fetch(`/api/trading/trades?limit=${pageSize.value}&offset=${(currentPage.value - 1) * pageSize.value}`)
    tradesData.value = response
    totalTrades.value = response.total || 0
    return response
  } catch (error) {
    console.error('Failed to load trades:', error)
    return null
  }
}

// Pagination methods
const nextPage = async () => {
  if (currentPage.value * pageSize.value < totalTrades.value) {
    currentPage.value++
    await loadTrades()
  }
}

const prevPage = async () => {
  if (currentPage.value > 1) {
    currentPage.value--
    await loadTrades()
  }
}

const goToPage = async (page: number) => {
  currentPage.value = page
  await loadTrades()
}
</script>

<template>
  <div class="col-span-12">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center min-h-96">
      <div class="text-center">
        <span class="loading loading-spinner loading-lg"></span>
        <p class="mt-4">{{ $t('app.dashboard.loading') }}</p>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else>
      <!-- Trading Stats -->
      <section class="stats stats-vertical w-full xl:stats-horizontal bg-base-100 rounded-box mb-8">
        <div class="stat">
          <div class="stat-title">{{ $t('app.dashboard.current_balance') }}</div>
          <div class="stat-value">${{ (portfolioData?.currentBalance || 0).toLocaleString() }}</div>
          <div class="stat-desc">{{ $t('app.dashboard.available_cash') }}</div>
        </div>

        <div class="stat">
          <div class="stat-title">{{ $t('app.dashboard.current_equity') }}</div>
          <div class="stat-value">${{ (portfolioData?.currentEquity || 0).toLocaleString() }}</div>
          <div class="stat-desc">
            <span :class="totalUnrealizedPnL.dollar >= 0 ? 'text-success' : 'text-error'">
              {{ totalUnrealizedPnL.dollar >= 0 ? '+' : '-' }}${{ Math.abs(totalUnrealizedPnL.dollar).toFixed(2) }}
              ({{ totalUnrealizedPnL.percentage >= 0 ? '+' : '-' }}{{ Math.abs(totalUnrealizedPnL.percentage).toFixed(2) }}%)
            </span>
            {{ $t('app.dashboard.unrealized_pnl') }}
          </div>
        </div>

        <div class="stat">
          <div class="stat-title">{{ $t('app.dashboard.win_rate') }}</div>
          <div class="stat-value">{{ ((portfolioData?.winRate || 0) * 100).toFixed(1) }}%</div>
          <div class="stat-desc">{{ $t('app.dashboard.based_on_closed_trades') }}</div>
        </div>

        <div class="stat">
          <div class="stat-title">{{ $t('app.dashboard.profit_factor') }}</div>
          <div class="stat-value">{{ (portfolioData?.profitFactor || 0).toFixed(2) }}</div>
          <div class="stat-desc">{{ $t('app.dashboard.gross_profit_gross_loss') }}</div>
        </div>
      </section>

      <!-- Additional Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card bg-base-100">
          <div class="card-body">
            <h3 class="card-title text-lg">{{ $t('app.dashboard.total_pnl') }}</h3>
            <p class="text-3xl font-bold" :class="(portfolioData?.totalPnL || 0) >= 0 ? 'text-success' : 'text-error'">
              {{ (portfolioData?.totalPnL || 0) >= 0 ? '+' : '-' }}${{ Math.abs(portfolioData?.totalPnL || 0).toFixed(2) }}
            </p>
            <p class="text-sm opacity-70">
              {{ (portfolioData?.totalPnLPercentage || 0).toFixed(2) }}% {{ $t('app.dashboard.realized_pnl') }}
            </p>
          </div>
        </div>

        <div class="card bg-base-100">
          <div class="card-body">
            <h3 class="card-title text-lg">{{ $t('app.dashboard.open_positions') }}</h3>
            <p class="text-3xl font-bold text-info">{{ portfolioData?.openTradesCount || 0 }}</p>
            <p class="text-sm opacity-70">
              ${{ (portfolioData?.totalMarginUsed || 0).toLocaleString() }} {{ $t('app.dashboard.margin_used') }}
            </p>
          </div>
        </div>

        <div class="card bg-base-100">
          <div class="card-body">
            <h3 class="card-title text-lg">{{ $t('app.dashboard.closed_trades') }}</h3>
            <p class="text-3xl font-bold text-warning">{{ portfolioData?.closedTrades || 0 }}</p>
            <p class="text-sm opacity-70">
              {{ portfolioData?.winningTrades || 0 }}W / {{ portfolioData?.losingTrades || 0 }}L
            </p>
          </div>
        </div>
      </div>

      <!-- Recent Trades -->
      <div class="card bg-base-100">
        <div class="card-body">
          <h2 class="card-title">{{ $t('app.dashboard.recent_trades') }}</h2>

          <div class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <thead>
                <tr class="bg-base-200">
                  <th>{{ $t('app.dashboard.status') }}</th>
                  <th>{{ $t('app.dashboard.symbol') }}</th>
                  <th>{{ $t('app.dashboard.side') }}</th>
                  <th>{{ $t('app.dashboard.entry_price') }}</th>
                  <th>{{ $t('app.dashboard.exit_price') }}</th>
                  <th>{{ $t('app.dashboard.pnl_dollar') }}</th>
                  <th>{{ $t('app.dashboard.pnl_percentage') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="trade in (tradesData?.trades || [])" :key="trade.id">
                  <td>
                    <span :class="trade.status === 'OPEN' ? 'badge badge-warning' : 'badge badge-success'">
                      {{ trade.status === 'OPEN' ? $t('app.dashboard.open') : $t('app.dashboard.closed') }}
                    </span>
                  </td>
                  <td class="font-bold">{{ trade.symbol }}</td>
                  <td>
                    <span :class="trade.side === 'BUY' ? 'badge badge-success' : 'badge badge-error'">
                      {{ trade.side === 'BUY' ? $t('app.dashboard.buy') : $t('app.dashboard.sell') }}
                    </span>
                  </td>
                  <td>${{ trade.price?.toFixed(2) || '0.00' }}</td>
                  <td>
                    <span v-if="trade.exitPrice">${{ trade.exitPrice.toFixed(2) }}</span>
                    <span v-else>-</span>
                  </td>
                  <td>
                    <span v-if="trade.status === 'CLOSED'" :class="trade.pnl >= 0 ? 'text-success' : 'text-error'">
                      {{ trade.pnl >= 0 ? '+' : '' }}{{ trade.pnl.toFixed(2) }}
                    </span>
                    <span v-else-if="trade.status === 'OPEN'">
                      <span :class="calculateUnrealizedPnL(trade).dollar >= 0 ? 'text-success' : 'text-error'">
                        {{ calculateUnrealizedPnL(trade).dollar >= 0 ? '+' : '' }}{{ calculateUnrealizedPnL(trade).dollar.toFixed(2) }}
                      </span>
                    </span>
                    <span v-else>-</span>
                  </td>
                  <td>
                    <span v-if="trade.status === 'CLOSED'" :class="trade.pnlPercentage >= 0 ? 'text-success' : 'text-error'">
                      {{ trade.pnlPercentage >= 0 ? '+' : '' }}{{ trade.pnlPercentage.toFixed(2) }}%
                    </span>
                    <span v-else-if="trade.status === 'OPEN'">
                      <span :class="calculateUnrealizedPnL(trade).percentage >= 0 ? 'text-success' : 'text-error'">
                        {{ calculateUnrealizedPnL(trade).percentage >= 0 ? '+' : '' }}{{ calculateUnrealizedPnL(trade).percentage.toFixed(2) }}%
                      </span>
                    </span>
                    <span v-else>-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="totalTrades > pageSize" class="flex justify-center mt-6">
            <div class="join">
              <button
                class="join-item btn btn-primary"
                :disabled="currentPage <= 1"
                @click="prevPage"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                {{ $t('app.dashboard.previous') }}
              </button>

              <button class="join-item btn btn-outline btn-active px-6">
                {{ $t('app.dashboard.page') }} {{ currentPage }} {{ $t('app.dashboard.of') }} {{ Math.ceil(totalTrades / pageSize) }}
              </button>

              <button
                class="join-item btn btn-primary"
                :disabled="currentPage >= Math.ceil(totalTrades / pageSize)"
                @click="nextPage"
              >
                {{ $t('app.dashboard.next') }}
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>

          <div v-if="!(tradesData?.trades || []).length" class="text-center py-8 opacity-60">
            <p>{{ $t('app.dashboard.no_trades_yet') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
