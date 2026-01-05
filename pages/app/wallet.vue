<script setup lang="ts">
definePageMeta({
  layout: 'app',
  middleware: 'auth'
})

const currentPeriod = ref('1w')

const { data: walletData, pending: summaryPending, refresh: refreshSummary } = await useFetch('/api/wallet/summary')
const { data: chartData, pending: chartPending, refresh: refreshChart } = await useFetch('/api/wallet/chart', {
  query: computed(() => ({ period: currentPeriod.value }))
})

const refreshData = async (period = currentPeriod.value) => {
  currentPeriod.value = period
  // Wait a bit for the query to update, then refresh
  await nextTick()
  await refreshChart()
}

// Chart data for performance
const performanceData = computed(() => {
  if (!chartData.value?.data) return []
  return chartData.value.data.map((point: any) => ({
    date: new Date(point.timestamp).toISOString().split('T')[0],
    equity: point.equity
  }))
})

const equityCategories = computed(() => ({
  equity: {
    name: 'Equity',
    color: (walletData.value?.pnl ?? 0) >= 0 ? '#00ff9d' : '#ff006e', // Green for profit, red for loss
  },
}))

const xFormatter = (tick: number): string => {
  const date = new Date(performanceData.value[tick]?.date || '')
  return date.toLocaleDateString()
}
</script>

<template>
  <!-- stats -->
  <section class="stats stats-vertical col-span-12 w-full xl:stats-horizontal bg-base-100 rounded-box">
    <div class="stat">
      <div class="stat-title text-primary uppercase text-xs font-bold tracking-widest">Total Deposited</div>
      <div class="stat-value text-2xl">${{ (walletData?.totalDeposited ?? 0).toLocaleString() }}</div>
      <div class="stat-desc mt-1">Paper money invested</div>
    </div>
    <div class="stat">
      <div class="stat-title text-secondary uppercase text-xs font-bold tracking-widest">Balance Left</div>
      <div class="stat-value text-2xl">${{ (walletData?.balanceLeft ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
      <div class="stat-desc mt-1">Available to trade</div>
    </div>
    <div class="stat">
      <div class="stat-title text-accent uppercase text-xs font-bold tracking-widest">Total Equity</div>
      <div class="stat-value text-2xl">${{ (walletData?.totalEquity ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
      <div class="stat-desc mt-1">Current portfolio value</div>
    </div>
    <div class="stat">
      <div class="stat-title text-info uppercase text-xs font-bold tracking-widest">Total PnL</div>
      <div class="stat-value text-2xl" :class="(walletData?.pnl ?? 0) >= 0 ? 'text-success' : 'text-error'">
        {{ (walletData?.pnl ?? 0) >= 0 ? '+' : '-' }}${{ Math.abs(walletData?.pnl ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
      </div>
      <div class="stat-desc mt-1" :class="(walletData?.pnl ?? 0) >= 0 ? 'text-success' : 'text-error'">
        {{ (walletData?.pnlPercentage ?? 0) >= 0 ? '+' : '-' }}{{ Math.abs(walletData?.pnlPercentage ?? 0).toFixed(2) }}%
      </div>
    </div>
  </section>

  <!-- Performance Chart -->
  <div class="card bg-base-100 rounded-box col-span-12">
    <div class="card-body">
      <div class="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h2 class="card-title">Portfolio Performance</h2>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="period in ['1d', '1w', '1m', '1y', 'all']"
            :key="period"
            @click="refreshData(period)"
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
        :height="300"
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

  <!-- Additional Info -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 col-span-12">
    <div class="card bg-base-100 rounded-box">
      <div class="card-body">
        <h3 class="card-title">Wallet Overview</h3>
        <div class="space-y-4">
          <div class="flex justify-between">
            <span>Current Shares:</span>
            <span class="font-mono">{{ (walletData?.currentShares ?? 0).toLocaleString() }}</span>
          </div>
          <div class="flex justify-between">
            <span>Portfolio Value:</span>
            <span class="font-mono">${{ (walletData?.totalEquity ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Available Balance:</span>
            <span class="font-mono">${{ (walletData?.balanceLeft ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-base-100 rounded-box">
      <div class="card-body">
        <h3 class="card-title">Quick Actions</h3>
        <div class="space-y-2">
          <button class="btn btn-primary btn-block" disabled>
            <svg data-src="https://unpkg.com/heroicons/20/solid/plus.svg" class="h-5 w-5"></svg>
            Deposit Funds
          </button>
          <button class="btn btn-outline btn-block" disabled>
            <svg data-src="https://unpkg.com/heroicons/20/solid/minus.svg" class="h-5 w-5"></svg>
            Withdraw Funds
          </button>
        </div>
        <p class="text-xs opacity-70 mt-4">
          Deposit and withdrawal features coming soon
        </p>
      </div>
    </div>
  </div>
</template>
