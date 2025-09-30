<template>
  <section class="mt-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <!-- Total Equity -->
      <div class="stat bg-base-100 rounded-2xl p-4 border border-base-300/60">
        <div class="stat-title text-xs uppercase opacity-70 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M2 12h20" stroke-linecap="round"/>
          </svg>
          <p class="text-white text-left">
            Total Equity
          </p>
        </div>
        <div class="stat-value text-xl font-bold">{{ currency }}{{ formatMoney(equity) }}</div>
        <div class="stat-desc text-xs opacity-70 text-center">Current portfolio value</div>
      </div>

      <!-- Total Deposited -->
      <div class="stat bg-base-100 rounded-2xl p-4 border border-base-300/60">
        <div class="stat-title text-xs uppercase opacity-70 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12h18M3 6h18M3 18h18" stroke-linecap="round"/>
          </svg>
          <p class="text-white text-left">
            Total Deposited
          </p>
        </div>
        <div class="stat-value text-lg">{{ currency }}{{ formatMoney(deposited) }}</div>
        <div class="stat-desc text-xs opacity-70 text-center">Initial investment</div>
      </div>

      <!-- PnL Cash -->
      <div class="stat bg-base-100 rounded-2xl p-4 border border-base-300/60">
        <div class="stat-title text-xs uppercase opacity-70 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20V4m-7 5l7-5 7 5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p class="text-white text-left">
            PnL (Cash)
          </p>
        </div>
        <div class="stat-value text-lg" :class="earningsUsd >= 0 ? 'text-success' : 'text-error'">
          {{ earningsUsd >= 0 ? '+' : ''}}{{ currency }}{{ formatMoney(earningsUsd) }}
        </div>
        <div class="stat-desc text-xs opacity-70 text-center">Profit/Loss in USD</div>
      </div>

      <!-- PnL Percentage -->
      <div class="stat bg-base-100 rounded-2xl p-4 border border-base-300/60">
        <div class="stat-title text-xs uppercase opacity-70 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke-linecap="round"/>
          </svg>
          <p class="text-white text-left">
            PnL (%)
          </p>
        </div>
        <div class="stat-value text-lg font-semibold" :class="earningsPct >= 0 ? 'text-success' : 'text-error'">
          {{ earningsPct >= 0 ? '+' : ''}}{{ earningsPct.toFixed(2) }}%
        </div>
        <div class="stat-desc text-xs opacity-70 text-center">Return on investment</div>
      </div>
    </div>

    <!-- Additional Info Row -->
    <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
      <!-- Investment Date -->
      <div class="bg-base-100/50 rounded-xl p-3 border border-base-300/30">
        <div class="text-xs opacity-70 uppercase tracking-wide">Investment Started</div>
        <div class="text-sm font-medium mt-1">{{ formatDate(depositAt) }}</div>
      </div>

      <!-- Performance Indicator -->
      <div class="bg-base-100/50 rounded-xl p-3 border border-base-300/30">
        <div class="text-xs opacity-70 uppercase tracking-wide">Performance</div>
        <div class="text-sm font-medium mt-1" :class="earningsPct >= 0 ? 'text-success' : 'text-error'">
          {{ earningsPct >= 0 ? 'Profit' : 'Loss' }} of {{ Math.abs(earningsPct).toFixed(2) }}%
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Props {
  currency: string
  deposited: number
  depositAt: string
  earningsUsd: number
  earningsPct: number
  equity?: number
}

const props = withDefaults(defineProps<Props>(), {
  equity: 0
})

/* Utils */
function formatMoney(n: number) {
  const s = Math.abs(n).toFixed(2)
  const parts = s.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const sign = n < 0 ? '-' : ''
  return sign + parts.join('.')
}

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}
</script>
