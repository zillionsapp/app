<!-- components/WalletDashboard.vue -->
<template>
  <div class="flex flex-col justify-between bg-base-200/60 text-white min-h-screen" data-theme="zillions">
    <!-- Top bar -->
    <WalletHeader />

    <!-- Balance + Chart -->
    <main class="max-w-3xl mx-auto w-full px-4 lg:px-6 flex-1">
      <WalletBalance
        :currency="currency"
        :display-balance="displayBalance"
        :latest-price="latestPrice"
        :period="period"
        :deposit-at="depositAt"
        :earnings-usd="earningsUsd"
        :earnings-pct="earningsPct"
        :loading="loading"
        :error="error"
        :earnings-loading="earningsLoading"
        :periods="periods"
        :points="points"
        :chart-width="chartWidth"
        :chart-height="chartHeight"
        :area-path="areaPath"
        :line-path="linePath"
        @set-period="(period) => setPeriod(period as Period)"
      />

      <WalletStats
        :currency="currency"
        :deposited="deposited"
        :deposit-at="depositAt"
        :earnings-usd="earningsUsd"
        :earnings-pct="earningsPct"
        :equity="displayBalance"
      />

      <TradingStrategySelector
        :strategies="tradingStrategies"
        :selected-strategies="selectedStrategies"
        :total-allocation="totalAllocation"
        @toggle-strategy="toggleStrategy"
        @update-allocation="updateAllocation"
        @get-max-allocation="getMaxAllocation"
      />
    </main>

    <!-- Action bar -->
    <div class="w-full">
      <div class="max-w-3xl mx-auto px-4 lg:px-6">
        <div class="grid grid-cols-3 gap-3 py-4">
          <button class="flex-1 btn btn-lg rounded-2xl btn-primary gap-2" @click="handleDeposit">
            Deposit
          </button>
          <!-- <button class="flex-1 btn btn-lg rounded-2xl btn-ghost gap-2" @click="handleWithdraw">
            Withdraw
          </button> -->
          <button class="flex-1 btn btn-lg rounded-2xl btn-ghost gap-2" @click="handleSend">
            Send
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSeries, PERIODS, type Period } from '@/composables/useSeries'

type Point = { x: number; y: number }

const emit = defineEmits<{
  (e: 'deposit'): void
  (e: 'withdraw'): void
  (e: 'send'): void
}>()

const props = withDefaults(defineProps<{
  currency?: string
  deposited?: number
  depositAt?: string // NEW: ISO date (YYYY-MM-DD)
}>(), {
  currency: '$',
  deposited: 5000,
  depositAt: '2025-08-01'
})

/* Trading Strategies */
const tradingStrategies = ref([
  {
    id: 'investments',
    name: 'Investments',
    description: 'Long-term store of value strategy - buy & hold',
    risk: 'Low Risk',
    riskClass: 'badge-success',
    timeframe: 'Long-term',
    selected: false,
    allocation: 0
  },
  {
    id: 'trading',
    name: 'Trading',
    description: 'Buy dips and sell peaks',
    risk: 'Mid Risk',
    riskClass: 'badge-warning',
    timeframe: 'Medium-term',
    selected: false,
    allocation: 0
  },
  {
    id: 'sniping',
    name: 'Sniping',
    description: 'Risk invest into new launched coins',
    risk: 'High Risk',
    riskClass: 'badge-error',
    timeframe: 'Short-term',
    selected: false,
    allocation: 0
  }
])

/* Selected strategies computed */
const selectedStrategies = computed(() => {
  return tradingStrategies.value.filter(strategy => strategy.selected)
})

/* Total allocation computed */
const totalAllocation = computed(() => {
  return selectedStrategies.value.reduce((total, strategy) => total + (strategy.allocation || 0), 0)
})

/* Get max allocation for a strategy */
const getMaxAllocation = (strategyId: string) => {
  const currentTotal = selectedStrategies.value.reduce((total, s) =>
    s.id === strategyId ? total : total + (s.allocation || 0), 0
  )
  return Math.max(0, 100 - currentTotal)
}

/* Update allocation for a strategy */
const updateAllocation = (strategyId: string, value: string) => {
  const newAllocation = parseInt(value, 10) || 0
  const strategy = tradingStrategies.value.find(s => s.id === strategyId)

  if (!strategy) return

  const maxAllowed = getMaxAllocation(strategyId)

  if (newAllocation <= maxAllowed) {
    strategy.allocation = newAllocation
  } else {
    strategy.allocation = Math.max(0, maxAllowed)
  }
}

/* Toggle strategy selection */
const toggleStrategy = (strategyId: string) => {
  const strategy = tradingStrategies.value.find(s => s.id === strategyId)
  if (strategy) {
    strategy.selected = !strategy.selected
    // Reset allocation when deselecting
    if (!strategy.selected) {
      strategy.allocation = 0
    }
  }
}

/* Live SOL series + earnings */
const {
  PERIODS: periodsArr,
  period,
  setPeriod,
  loading,
  error,
  series,      // closes[]
  latestPrice, // number | null

  // earnings
  earningsLoading,
  priceAtDeposit,
  qtySol, currentValueUsd, earningsUsd, earningsPct,
} = useSeries('SOLUSDT', '1M', props.deposited, props.depositAt)

const periods = periodsArr as unknown as string[]

/* Balance headline uses live current value if available */
const currency = computed(() => props.currency)
const deposited = computed(() => props.deposited)
const depositAt = computed(() => props.depositAt)
const displayBalance = computed(() => {
  return currentValueUsd.value > 0 ? currentValueUsd.value : deposited.value
})

/* Chart geometry (unchanged) */
const chartWidth = 600
const chartHeight = 160

const points = computed<Point[]>(() => {
  const data = series.value || []
  if (data.length === 0) return []
  const min = Math.min(...data)
  const max = Math.max(...data)
  const pad = (max - min) * 0.1 || 1
  const lo = min - pad
  const hi = max + pad
  const n = data.length
  return data.map((v, i) => {
    const x = (i / Math.max(n - 1, 1)) * chartWidth
    const y = chartHeight - ((v - lo) / (hi - lo)) * chartHeight
    return { x, y }
  })
})

const linePath = computed(() => {
  if (!points.value?.length) return ''
  return points.value.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
})

const areaPath = computed(() => {
  if (!points.value?.length) return ''
  const first = points.value[0]
  const last = points.value[points.value.length - 1]
  if (!first || !last) return ''
  return [
    `M ${first.x} ${chartHeight}`,
    `L ${first.x} ${first.y}`,
    points.value.slice(1).map(p => `L ${p.x} ${p.y}`).join(' '),
    `L ${last.x} ${chartHeight}`,
    'Z'
  ].join(' ')
})

/* Action handlers */
const handleDeposit = () => {
  console.log('Deposit clicked from main component')
  emit('deposit')
}

const handleWithdraw = () => {
  console.log('Withdraw clicked from main component')
  emit('withdraw')
}

const handleSend = () => {
  console.log('Send clicked from main component')
  emit('send')
}

/* Utils */
function formatMoney(n: number) {
  const s = Math.abs(n).toFixed(2)
  const parts = s.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const sign = n < 0 ? '-' : ''
  return sign + parts.join('.')
}
</script>

<style scoped>
:root[data-theme="zillions"]{
  --p:#122a37; --pc:#e8eae8;
  --a:#0e222d; --ac:#e8eae8;
  --b1:#ffffff; --b2:#f3f5f4; --b3:#d8dcdc;
  --n:#0e222d; --nc:#e8eae8;
}
h1 { letter-spacing: -0.02em; }
.badge-success { background: rgba(54,211,153,.15); color:#16a34a; border-color: transparent; }
.badge-error { background: rgba(248,114,114,.15); color:#dc2626; border-color: transparent; }
</style>
