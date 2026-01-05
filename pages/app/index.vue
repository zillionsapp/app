<script setup lang="ts">
definePageMeta({
  layout: 'app',
  middleware: 'auth'
})

// Fetch trading data
const { data: portfolioData, pending: portfolioPending } = await useFetch('/api/trading/portfolio')
const { data: chartData, pending: chartPending } = await useFetch('/api/trading/chart')

// Trades data
const tradesData = ref<any>(null)
const tradesPending = ref(true)

onMounted(async () => {
  try {
    tradesData.value = await $fetch('/api/trading/trades')
  } finally {
    tradesPending.value = false
  }
})

// Current chart period
const currentPeriod = ref('1w')

// Trading stats
const tradingStats = computed(() => [
  {
    title: 'Current Balance',
    value: `$${(portfolioData.value?.currentBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    desc: 'Available Cash (USDT)',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
    color: 'text-primary'
  },
  {
    title: 'Current Equity',
    value: `$${(portfolioData.value?.currentEquity ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    desc: (portfolioData.value?.totalPnLPercentage ?? 0) >= 0
      ? `+${(portfolioData.value?.totalPnLPercentage ?? 0).toFixed(2)}% unrealized P&L`
      : `${(portfolioData.value?.totalPnLPercentage ?? 0).toFixed(2)}% unrealized P&L`,
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2v6',
    color: (portfolioData.value?.totalPnLPercentage ?? 0) >= 0 ? 'text-success' : 'text-error'
  },
  {
    title: 'Win Rate',
    value: `${((portfolioData.value?.winRate ?? 0) * 100).toFixed(1)}%`,
    desc: 'Based on closed trades',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    color: 'text-secondary'
  },
  {
    title: 'Profit Factor',
    value: (portfolioData.value?.profitFactor ?? 0).toFixed(2),
    desc: 'Gross Profit / Gross Loss',
    icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z',
    color: 'text-accent'
  }
])

// Additional metrics
const additionalMetrics = computed(() => [
  {
    title: 'Total PnL',
    value: (portfolioData.value?.totalPnL ?? 0) >= 0
      ? `+$${(portfolioData.value?.totalPnL ?? 0).toFixed(2)}`
      : `-$${Math.abs(portfolioData.value?.totalPnL ?? 0).toFixed(2)}`,
    desc: `${(portfolioData.value?.totalPnLPercentage ?? 0).toFixed(2)}% total realized P&L`,
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
    color: (portfolioData.value?.totalPnL ?? 0) >= 0 ? 'text-success' : 'text-error'
  },
  {
    title: 'Open Positions',
    value: (portfolioData.value?.openTradesCount ?? 0).toString(),
    desc: `$${portfolioData.value?.totalMarginUsed?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} margin used`,
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    color: 'text-info'
  },
  {
    title: 'Closed Trades',
    value: (portfolioData.value?.closedTrades ?? 0).toString(),
    desc: `${portfolioData.value?.winningTrades ?? 0}W / ${(portfolioData.value?.losingTrades ?? 0)}L`,
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color: 'text-warning'
  }
])

// Chart data
const performanceData = computed(() => {
  if (!chartData.value?.data) return []
  return chartData.value.data.map((point: any) => ({
    date: point.date,
    equity: point.equity
  }))
})

const equityCategories = computed(() => ({
  equity: {
    name: 'Portfolio Equity',
    color: '#00ff9d',
  },
}))

const xFormatter = (tick: number): string => {
  const date = new Date(performanceData.value[tick]?.date || '')
  return date.toLocaleDateString()
}

// Refresh chart data
const refreshChart = async (period = currentPeriod.value) => {
  currentPeriod.value = period
  await $fetch(`/api/trading/chart?period=${period}`)
}

// Format duration helper
const formatDuration = (ms: number): string => {
  if (!ms || ms <= 0) return '-'
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}
</script>

<template>
  <!-- Trading Stats Grid -->
  <section class="stats stats-vertical col-span-12 w-full xl:stats-horizontal bg-base-100 rounded-box">
    <div v-for="stat in tradingStats" :key="stat.title" class="stat">
      <div class="stat-figure">
        <svg class="inline-block w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="stat.icon"></path>
        </svg>
      </div>
      <div class="stat-title">{{ stat.title }}</div>
      <div class="stat-value" :class="stat.color">{{ stat.value }}</div>
      <div class="stat-desc">{{ stat.desc }}</div>
    </div>
  </section>

  <!-- Additional Trading Metrics -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 col-span-12 mt-8">
    <div v-for="metric in additionalMetrics" :key="metric.title" class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <div class="flex items-center gap-3">
          <div class="avatar placeholder">
            <div class="bg-neutral text-neutral-content rounded-full w-10">
              <svg class="inline-block w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="metric.icon"></path>
              </svg>
            </div>
          </div>
          <div>
            <h3 class="font-semibold">{{ metric.title }}</h3>
            <p class="text-2xl font-bold" :class="metric.color">{{ metric.value }}</p>
            <p class="text-sm opacity-70">{{ metric.desc }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Performance Chart -->
  <div class="card bg-base-100 shadow-xl col-span-12 mt-8">
    <div class="card-body">
      <div class="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h2 class="card-title">Portfolio Performance</h2>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="period in ['1d', '1w', '1m', '1y', 'all']"
            :key="period"
            @click="refreshChart(period)"
            class="btn btn-xs"
            :class="currentPeriod === period ? 'btn-active btn-primary' : 'btn-outline'"
          >
            {{ period.toUpperCase() }}
          </button>
        </div>
      </div>
      <AreaChart
        v-if="performanceData.length > 0"
        :data="performanceData"
        :height="350"
        :categories="equityCategories"
        :y-grid-line="true"
        :x-formatter="xFormatter"
        :curve-type="CurveType.MonotoneX"
        :legend-position="LegendPosition.BottomCenter"
        :hide-legend="true"
      />
      <div v-else class="flex items-center justify-center h-80 text-base-content/50">
        <div class="text-center">
          <div class="text-4xl mb-2">📈</div>
          <p>No performance data available</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Recent Trades Table -->
  <div class="card bg-base-100 shadow-xl col-span-12 mt-8">
    <div class="card-body">
      <h2 class="card-title">Recent Trades</h2>

      <div class="overflow-x-auto">
        <table class="table table-zebra w-full">
          <thead>
            <tr class="bg-base-200">
              <th class="text-xs font-bold uppercase py-4">Status</th>
              <th class="text-xs font-bold uppercase py-4">Strategy</th>
              <th class="text-xs font-bold uppercase py-4">Symbol</th>
              <th class="text-xs font-bold uppercase py-4">Time</th>
              <th class="text-xs font-bold uppercase py-4">Side</th>
              <th class="text-xs font-bold uppercase py-4">Lv.</th>
              <th class="text-xs font-bold uppercase py-4">Entry</th>
              <th class="text-xs font-bold uppercase py-4">Exit</th>
              <th class="text-xs font-bold uppercase py-4">Duration</th>
              <th class="text-xs font-bold uppercase py-4">Exit Reason</th>
              <th class="text-xs font-bold uppercase py-4 text-right">Qty</th>
              <th class="text-xs font-bold uppercase py-4 text-right">PnL (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="trade in (tradesData.value?.trades || []).slice(0, 10)" :key="trade.id" class="hover">
              <td>
                <span :class="trade.status === 'OPEN' ? 'badge badge-warning' : 'badge badge-success'" class="badge-sm">
                  {{ trade.status }}
                </span>
              </td>
              <td class="font-semibold">{{ trade.strategyName }}</td>
              <td class="font-bold">{{ trade.symbol }}</td>
              <td class="font-mono text-sm">{{ new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</td>
              <td>
                <span :class="trade.side === 'BUY' ? 'badge badge-success' : 'badge badge-error'" class="badge-sm">
                  {{ trade.side }}
                </span>
              </td>
              <td class="font-mono">{{ trade.leverage || 1 }}x</td>
              <td class="font-mono">${{ trade.price?.toFixed(2) || '0.00' }}</td>
              <td class="font-mono">
                <span v-if="trade.exitPrice">${{ trade.exitPrice.toFixed(2) }}</span>
                <span v-else-if="trade.status === 'OPEN'">-</span>
                <span v-else>-</span>
              </td>
              <td class="font-mono text-sm">
                <span v-if="trade.duration">{{ formatDuration(trade.duration) }}</span>
                <span v-else-if="trade.status === 'OPEN'">{{ formatDuration(Date.now() - trade.timestamp) }}</span>
                <span v-else>-</span>
              </td>
              <td class="text-sm">
                <span v-if="trade.exitReason" class="badge badge-outline badge-xs">{{ trade.exitReason.replace(/_/g, ' ') }}</span>
                <span v-else>-</span>
              </td>
              <td class="text-right font-mono">{{ trade.quantity?.toLocaleString() || '0' }}</td>
              <td class="text-right font-mono" :class="trade.pnl >= 0 ? 'text-success' : 'text-error'">
                <span v-if="trade.pnl !== undefined">
                  {{ trade.pnl >= 0 ? '+' : '' }}{{ trade.pnl.toFixed(2) }}
                  ({{ trade.pnlPercentage >= 0 ? '+' : '' }}{{ trade.pnlPercentage?.toFixed(2) || '0.00' }}%)
                </span>
                <span v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!tradesData.value?.trades?.length && !tradesPending" class="text-center py-12 opacity-60">
        <div class="text-4xl mb-2">📊</div>
        <p>No trades yet</p>
        <p class="text-sm opacity-70">Trading activity will appear here</p>
      </div>

      <div v-if="tradesPending" class="text-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
        <p class="mt-4">Loading trades...</p>
      </div>
    </div>
  </div>
</template>
