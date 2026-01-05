<script setup lang="ts">
definePageMeta({
  layout: 'app',
  middleware: 'auth'
})

// Simple reactive data
const portfolioData = ref(null)
const chartData = ref(null)
const tradesData = ref(null)
const loading = ref(true)

// Load data on mount
onMounted(async () => {
  try {
    const [portfolio, chart, trades] = await Promise.all([
      $fetch('/api/trading/portfolio'),
      $fetch('/api/trading/chart'),
      $fetch('/api/trading/trades')
    ])

    portfolioData.value = portfolio
    chartData.value = chart
    tradesData.value = trades
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="col-span-12">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center min-h-96">
      <div class="text-center">
        <span class="loading loading-spinner loading-lg"></span>
        <p class="mt-4">Loading trading dashboard...</p>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else>
      <!-- Trading Stats -->
      <section class="stats stats-vertical w-full xl:stats-horizontal bg-base-100 rounded-box mb-8">
        <div class="stat">
          <div class="stat-title">Current Balance</div>
          <div class="stat-value">${{ (portfolioData?.currentBalance || 0).toLocaleString() }}</div>
          <div class="stat-desc">Available Cash (USDT)</div>
        </div>

        <div class="stat">
          <div class="stat-title">Current Equity</div>
          <div class="stat-value">${{ (portfolioData?.currentEquity || 0).toLocaleString() }}</div>
          <div class="stat-desc">Total Portfolio Value</div>
        </div>

        <div class="stat">
          <div class="stat-title">Win Rate</div>
          <div class="stat-value">{{ ((portfolioData?.winRate || 0) * 100).toFixed(1) }}%</div>
          <div class="stat-desc">Based on closed trades</div>
        </div>

        <div class="stat">
          <div class="stat-title">Profit Factor</div>
          <div class="stat-value">{{ (portfolioData?.profitFactor || 0).toFixed(2) }}</div>
          <div class="stat-desc">Gross Profit / Gross Loss</div>
        </div>
      </section>

      <!-- Additional Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <h3 class="card-title text-lg">Total PnL</h3>
            <p class="text-3xl font-bold" :class="(portfolioData?.totalPnL || 0) >= 0 ? 'text-success' : 'text-error'">
              {{ (portfolioData?.totalPnL || 0) >= 0 ? '+' : '' }}${{ Math.abs(portfolioData?.totalPnL || 0).toFixed(2) }}
            </p>
            <p class="text-sm opacity-70">
              {{ (portfolioData?.totalPnLPercentage || 0).toFixed(2) }}% realized P&L
            </p>
          </div>
        </div>

        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <h3 class="card-title text-lg">Open Positions</h3>
            <p class="text-3xl font-bold text-info">{{ portfolioData?.openTradesCount || 0 }}</p>
            <p class="text-sm opacity-70">
              ${{ (portfolioData?.totalMarginUsed || 0).toLocaleString() }} margin used
            </p>
          </div>
        </div>

        <div class="card bg-base-100 shadow-lg">
          <div class="card-body">
            <h3 class="card-title text-lg">Closed Trades</h3>
            <p class="text-3xl font-bold text-warning">{{ portfolioData?.closedTrades || 0 }}</p>
            <p class="text-sm opacity-70">
              {{ portfolioData?.winningTrades || 0 }}W / {{ portfolioData?.losingTrades || 0 }}L
            </p>
          </div>
        </div>
      </div>

      <!-- Recent Trades -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Recent Trades</h2>

          <div class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <thead>
                <tr class="bg-base-200">
                  <th>Status</th>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Entry Price</th>
                  <th>Exit Price</th>
                  <th>PnL</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="trade in (tradesData?.trades || []).slice(0, 5)" :key="trade.id">
                  <td>
                    <span :class="trade.status === 'OPEN' ? 'badge badge-warning' : 'badge badge-success'">
                      {{ trade.status }}
                    </span>
                  </td>
                  <td class="font-bold">{{ trade.symbol }}</td>
                  <td>
                    <span :class="trade.side === 'BUY' ? 'badge badge-success' : 'badge badge-error'">
                      {{ trade.side }}
                    </span>
                  </td>
                  <td>${{ trade.price?.toFixed(2) || '0.00' }}</td>
                  <td>
                    <span v-if="trade.exitPrice">${{ trade.exitPrice.toFixed(2) }}</span>
                    <span v-else>-</span>
                  </td>
                  <td :class="trade.pnl >= 0 ? 'text-success' : 'text-error'">
                    <span v-if="trade.pnl !== undefined">
                      {{ trade.pnl >= 0 ? '+' : '' }}{{ trade.pnl.toFixed(2) }}
                    </span>
                    <span v-else>-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="!(tradesData?.trades || []).length" class="text-center py-8 opacity-60">
            <p>No trades yet</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
