<template>
  <div class="flex flex-col bg-base-200/60 text-white" data-theme="zillions">
    <!-- Top bar -->
<!--     <header class="navbar px-4 lg:px-6 py-4 max-w-3xl mx-auto w-full">
      <div class="navbar-start">
        <span class="font-semibold tracking-tight text-lg">Zillions<span class="text-primary"> </span></span>
      </div>
    </header> -->

    <!-- Balance + Chart -->
    <main class="max-w-3xl mx-auto w-full px-4 lg:px-6 flex-1">
      <section class="card">
        <div class="card-body">
          <!-- Balance headline -->
          <div class="flex items-baseline justify-between">
            <div>
              <p class="text-sm opacity-70">Total balance</p>
              <h1 class="text-4xl md:text-5xl font-bold tracking-tight mt-1">
                {{ currency }}{{ formatMoney(totalBalance) }}
              </h1>
            </div>
            <div class="text-right">
              <p class="text-sm opacity-70">All‑time P&L</p>
              <div class="mt-1 inline-flex items-center gap-2">
                <span
                  class="badge"
                  :class="netChange >= 0 ? 'badge-success' : 'badge-error'"
                >
                  {{ netChange >= 0 ? '+' : '' }}{{ (netChangePct).toFixed(2) }}%
                </span>
              </div>
            </div>
          </div>

          <!-- Sparkline / area chart -->
          <div class="mt-6">
            <div class="w-full h-40 md:h-48 rounded-2xl relative overflow-hidden">
              <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="w-full h-full">
                <!-- grid lines -->
                <g opacity="0.15">
                  <line v-for="y in 4" :key="'g'+y"
                        :x1="0" :x2="chartWidth"
                        :y1="(chartHeight/4)*y" :y2="(chartHeight/4)*y"
                        stroke="currentColor" />
                </g>
                <!-- area fill -->
                <path :d="areaPath" fill="currentColor" class="opacity-10" />
                <!-- line -->
                <path :d="linePath" fill="none" stroke="currentColor" stroke-width="2.5" />
                <!-- last point marker -->
                <circle :cx="points[points.length-1].x" :cy="points[points.length-1].y" r="3.5" class="text-primary" fill="currentColor"/>
              </svg>

              <!-- period selector -->
              <div class="absolute top-3 right-3 join">
                <button v-for="p in periods" :key="p"
                        class="btn btn-xs join-item"
                        :class="period === p ? 'btn-primary' : 'btn-ghost'"
                        @click="setPeriod(p)">{{ p }}</button>
              </div>
            </div>
          </div>

          <!-- Mini stats -->
          <div class="mt-6 grid grid-cols-2 md:grid-cols-2 gap-3">
            <div class="stat bg-base-100 rounded-2xl p-4 border border-base-300/60"">
              <div class="stat-title text-xs uppercase opacity-70 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v20M2 12h20" stroke-linecap="round"/>
                </svg>
                Deposited
              </div>
              <div class="stat-value text-xl">{{ currency }}{{ formatMoney(deposited) }}</div>
              <div class="stat-desc text-xs opacity-70">All time</div>
            </div>

            <div class="stat bg-base-100 rounded-2xl p-4 border border-base-300/60">
              <div class="stat-title text-xs uppercase opacity-70 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20V4m-7 5l7-5 7 5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Earnings
              </div>
              <div class="stat-value text-xl" :class="netChange >= 0 ? 'text-success' : 'text-error'">
                {{ currency }}{{ formatMoney(netChange) }}
              </div>
              <div class="stat-desc text-xs opacity-70">{{ netChange >= 0 ? '+' : ''}}{{ netChangePct.toFixed(2) }}%</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Strategy dominance section -->
      <section class="mt-6 card">
        <div class="card-body">
          <h3 class="card-title text-lg">Current market regimes</h3>
          <p class="text-sm opacity-70 mb-4">
            The AI adapts to the dominant strategies visible on-chain:
          </p>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div
              v-for="reg in regimes"
              :key="reg.name"
              class="p-3 rounded-xl border"
              :class="reg.active ? 'border-primary bg-primary/5' : 'border-base-300 bg-base-100'"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <svg v-if="reg.name === 'Momentum'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 20l6-6m4-8l6-2-2 6m-4-4l-6 6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <svg v-if="reg.name === 'Mean Reversion'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 12H4m16 0l-4-4m4 4l-4 4M4 12l4-4M4 12l4 4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <svg v-if="reg.name === 'Liquidity Hunt'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <svg v-if="reg.name === 'Scalpers'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4v16m0-8h8m4 0h4M8 8v8m8-8v8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <svg v-if="reg.name === 'Swing Traders'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 12h4l3-9 6 18 3-9h4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span class="font-medium text-sm">{{ reg.name }}</span>
                </div>
                <span v-if="reg.active" class="badge badge-primary badge-sm">Active</span>
              </div>
              <p class="text-xs opacity-70 mt-1">{{ reg.desc }}</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Action bar -->
    <footer class="sticky bottom-0 left-0 right-0">
      <div class="max-w-3xl mx-auto px-4 lg:px-6">
        <div class="grid grid-cols-3 gap-3 py-4">
          <button class="btn bg-gradient-to-r from-primary via-secondary to-accent animate-gradient text-base-100 border-0 btn-lg rounded-2xl gap-2" @click="emit('deposit')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 4v16m-8-8h16" stroke-linecap="round"/>
            </svg>
            Deposit
          </button>
          <button class="btn btn-lg rounded-2xl btn-ghost gap-2" @click="emit('withdraw')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20V4M6 12l6-6 6 6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Withdraw
          </button>
          <button class="btn btn-lg rounded-2xl btn-ghost gap-2" @click="emit('send')">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Send
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
/**
 * Simple, Revolut‑style preview UI.
 * - Props allow you to feed real numbers; sensible demo defaults included.
 * - SVG sparkline/area chart; no external chart libs needed.
 * - Emits: deposit, withdraw, send.
 */
import { computed, ref } from 'vue'

type Point = { x: number; y: number }

const emit = defineEmits<{
  (e: 'deposit'): void
  (e: 'withdraw'): void
  (e: 'send'): void
}>()

const props = withDefaults(defineProps<{
  currency?: string
  deposited?: number
  totalBalance?: number
  earnings?: number
  series?: number[] // chronological equity values for chart (current period)
}>(), {
  currency: '$',
  deposited: 5000,
  totalBalance: 6740.23,
  earnings: 1740.23,
  series: () => [5100, 5050, 5200, 5250, 5400, 5380, 5600, 5850, 6100, 6020, 6400, 6740],
})

/* Period selector */
const periods = ['1W', '1M', '3M', '1Y']
const period = ref<'1W'|'1M'|'3M'|'1Y'>('1M')

function setPeriod(p: typeof period.value) {
  period.value = p
  // In a real app you'd fetch / recompute series here
}

const regimes = ref([
  { name: 'Momentum', desc: 'Breakouts persist', active: true },
  { name: 'Mean Reversion', desc: 'Tight spreads & fades', active: false },
  { name: 'Liquidity Hunt', desc: 'Stop-runs, imbalances', active: false },
  { name: 'Scalpers', desc: 'Micro-mean reverts', active: false },
  { name: 'Swing Traders', desc: 'Bigger intraday ranges', active: false },
])

/* Derived figures */
const currency = computed(() => props.currency)
const deposited = computed(() => props.deposited)
const totalBalance = computed(() => props.totalBalance)
const earnings = computed(() => props.earnings)

/* P&L overall */
const netChange = computed(() => totalBalance.value - deposited.value)
const netChangePct = computed(() => deposited.value ? (netChange.value / deposited.value) * 100 : 0)

/* Period change (from first to last of visible series) */
const periodChange = computed(() => {
  const s = props.series || []
  if (s.length < 2) return 0
  return s[s.length - 1] - s[0]
})
const periodChangePct = computed(() => {
  const s = props.series || []
  if (s.length < 2 || s[0] === 0) return 0
  return ((s[s.length - 1] - s[0]) / s[0]) * 100
})

/* Chart: lightweight sparkline with area */
const chartWidth = 600
const chartHeight = 160

const points = computed<Point[]>(() => {
  const data = props.series || []
  if (data.length === 0) return []
  
  const min = Math.min(...data)
  const max = Math.max(...data)
  const pad = (max - min) * 0.1 || 1
  const lo = min - pad
  const hi = max + pad
  const n = data.length
  return data.map((v, i) => {
    const x = (i / (n - 1)) * chartWidth
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
/* Minimal brand theme (reuse your landing theme tokens if already set) */
:root[data-theme="zillions"]{
  --p:#122a37; --pc:#e8eae8;
  --a:#0e222d; --ac:#e8eae8;
  --b1:#ffffff; --b2:#f3f5f4; --b3:#d8dcdc;
  --n:#0e222d; --nc:#e8eae8;
}

/* Keep things airy & crisp */
h1 { letter-spacing: -0.02em; }
.badge-success { background: rgba(54,211,153,.15); color:#16a34a; border-color: transparent; }
.badge-error { background: rgba(248,114,114,.15); color:#dc2626; border-color: transparent; }
</style>
