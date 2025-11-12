<template>
  <section class="mt-6">
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
      <!-- Remaining Cash -->
      <div class="stat bg-base-100 rounded-2xl p-4 border border-base-300/60">
        <div class="stat-title text-xs uppercase opacity-70 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M2 12h20" stroke-linecap="round"/>
          </svg>
          <p class="text-base-content text-left">
            Remaining Cash
          </p>
        </div>
        <div class="stat-value text-xl font-bold">{{ currency }}{{ formatMoney(cash || 0) }}</div>
        <div class="stat-desc text-xs opacity-70 text-center">Available cash balance</div>
      </div>

      <!-- BTC Holding -->
      <div class="stat bg-base-100 rounded-2xl p-4 border border-base-300/60">
        <div class="stat-title text-xs uppercase opacity-70 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 4h12M6 4v16M6 4H4m2 0h2m8 0H6m0 0v16m0-16h12m-6 8h6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p class="text-base-content text-left">
            BTC Holding
          </p>
        </div>
        <div class="stat-value text-lg">{{ (btc || 0).toFixed(8) }} BTC</div>
        <div class="stat-desc text-xs opacity-70 text-center">Bitcoin balance</div>
      </div>

      <!-- Holding Value -->
      <div class="stat bg-base-100 rounded-2xl p-4 border border-base-300/60">
        <div class="stat-title text-xs uppercase opacity-70 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p class="text-base-content text-left">
            Holding Value
          </p>
        </div>
        <div class="stat-value text-lg">{{ currency }}{{ formatMoney((btc || 0) * (btcPrice || 0)) }}</div>
        <div class="stat-desc text-xs opacity-70 text-center">BTC value in USD</div>
      </div>

      <!-- Total Deposited -->
      <div class="stat bg-base-100 rounded-2xl p-4 border border-base-300/60">
        <div class="stat-title text-xs uppercase opacity-70 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12h18M3 6h18M3 18h18" stroke-linecap="round"/>
          </svg>
          <p class="text-base-content text-left">
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
          <p class="text-base-content text-left">
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
          <p class="text-base-content text-left">
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

    <!-- Strategy Performance Section -->
    <div v-if="selectedStrategies && selectedStrategies.length > 0" class="mt-6">
      <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke-linecap="round"/>
        </svg>
        Strategy Performance
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="strategy in selectedStrategies"
          :key="strategy.id"
          class="bg-gradient-to-br from-base-100 to-base-200/30 rounded-xl p-4 border border-base-300/40 hover:shadow-lg transition-all duration-200"
        >
          <!-- Strategy Header -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <h4 class="font-semibold text-sm">{{ strategy.name }}</h4>
              <span class="badge badge-xs" :class="getRiskBadgeClass(strategy.risk)">
                {{ strategy.risk }}
              </span>
            </div>
            <span class="text-xs opacity-70">{{ strategy.allocation }}% allocation</span>
          </div>

          <!-- Performance Metrics -->
          <div class="space-y-3">
            <!-- 24h Return -->
            <div class="flex items-center justify-between">
              <span class="text-xs opacity-70">24h Return:</span>
              <span class="text-sm font-medium" :class="getStrategyReturn(strategy.id, 'daily') >= 0 ? 'text-success' : 'text-error'">
                {{ getStrategyReturn(strategy.id, 'daily') >= 0 ? '+' : ''}}{{ getStrategyReturn(strategy.id, 'daily').toFixed(2) }}%
              </span>
            </div>

            <!-- 7d Return -->
            <div class="flex items-center justify-between">
              <span class="text-xs opacity-70">7d Return:</span>
              <span class="text-sm font-medium" :class="getStrategyReturn(strategy.id, 'weekly') >= 0 ? 'text-success' : 'text-error'">
                {{ getStrategyReturn(strategy.id, 'weekly') >= 0 ? '+' : ''}}{{ getStrategyReturn(strategy.id, 'weekly').toFixed(2) }}%
              </span>
            </div>

            <!-- Strategy PnL -->
            <div class="flex items-center justify-between">
              <span class="text-xs opacity-70">PnL:</span>
              <span class="text-sm font-medium" :class="getStrategyPnL(strategy.id) >= 0 ? 'text-success' : 'text-error'">
                {{ getStrategyPnL(strategy.id) >= 0 ? '+' : ''}}${{ Math.abs(getStrategyPnL(strategy.id)).toFixed(0) }}
              </span>
            </div>

            <!-- Mini Performance Bar -->
            <div class="w-full bg-base-300/50 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-300"
                :class="getStrategyReturn(strategy.id, 'weekly') >= 0 ? 'bg-success' : 'bg-error'"
                :style="{ width: `${Math.min(Math.abs(getStrategyReturn(strategy.id, 'weekly')), 100)}%` }"
              ></div>
            </div>

            <!-- Allocation Value -->
            <div class="text-xs opacity-60 pt-1">
              Value: {{ currency }}{{ formatMoney(getStrategyValue(strategy.id)) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Strategy Summary -->
      <div class="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div class="text-xs opacity-70 uppercase tracking-wide">Active Strategies</div>
            <div class="text-lg font-bold text-primary">{{ selectedStrategies.length }}</div>
          </div>
          <div>
            <div class="text-xs opacity-70 uppercase tracking-wide">Avg Return (24h)</div>
            <div class="text-lg font-bold" :class="getAverageReturn('daily') >= 0 ? 'text-success' : 'text-error'">
              {{ getAverageReturn('daily') >= 0 ? '+' : ''}}{{ getAverageReturn('daily').toFixed(2) }}%
            </div>
          </div>
          <div>
            <div class="text-xs opacity-70 uppercase tracking-wide">Total Allocation</div>
            <div class="text-lg font-bold">{{ getTotalAllocation() }}%</div>
          </div>
          <div>
            <div class="text-xs opacity-70 uppercase tracking-wide">Best Performer</div>
            <div class="text-sm font-medium text-success">{{ getBestPerformer() }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Strategy {
  id: string
  name: string
  allocation: number
  selected: boolean
  risk: string
}

interface Props {
  currency: string
  deposited: number
  depositAt: string
  earningsUsd: number
  earningsPct: number
  cash?: number
  btc?: number
  btcPrice?: number
  strategies?: Strategy[]
  selectedStrategies?: Strategy[]
}

const props = withDefaults(defineProps<Props>(), {
  cash: 0,
  btc: 0
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

/* Strategy Performance Functions */
function getRiskBadgeClass(risk: string) {
  switch (risk.toLowerCase()) {
    case 'low risk': return 'badge-success'
    case 'mid risk': return 'badge-warning'
    case 'high risk': return 'badge-error'
    default: return 'badge-neutral'
  }
}

function getStrategyReturn(strategyId: string, period: 'daily' | 'weekly') {
  // Mock data - in real app this would come from API or calculations
  const mockReturns: Record<string, { daily: number; weekly: number }> = {
    'investments': { daily: 0.5, weekly: 2.1 },
    'trading': { daily: -0.3, weekly: 1.8 },
    'sniping': { daily: 1.2, weekly: -1.5 }
  }
  return mockReturns[strategyId]?.[period] || 0
}

function getStrategyPnL(strategyId: string) {
  // Mock data - in real app this would be calculated based on strategy performance
  const mockPnL: Record<string, number> = {
    'investments': 150,
    'trading': -75,
    'sniping': 320
  }
  return mockPnL[strategyId] || 0
}

function getStrategyValue(strategyId: string) {
  // Calculate value based on allocation percentage of total deposited
  if (!props.selectedStrategies) return 0
  const strategy = props.selectedStrategies.find(s => s.id === strategyId)
  if (!strategy) return 0
  return (props.deposited * strategy.allocation) / 100
}

function getAverageReturn(period: 'daily' | 'weekly') {
  if (!props.selectedStrategies || props.selectedStrategies.length === 0) return 0
  const total = props.selectedStrategies.reduce((sum, strategy) => {
    return sum + getStrategyReturn(strategy.id, period)
  }, 0)
  return total / props.selectedStrategies.length
}

function getTotalAllocation() {
  if (!props.selectedStrategies) return 0
  return props.selectedStrategies.reduce((total, strategy) => total + strategy.allocation, 0)
}

function getBestPerformer() {
  if (!props.selectedStrategies || props.selectedStrategies.length === 0) return 'None'
  const best = props.selectedStrategies.reduce((best, current) => {
    const bestWeekly = getStrategyReturn(best.id, 'weekly')
    const currentWeekly = getStrategyReturn(current.id, 'weekly')
    return currentWeekly > bestWeekly ? current : best
  })
  return best.name
}
</script>
