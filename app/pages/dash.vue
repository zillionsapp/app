<template>
  <div class="p-4 md:p-6 space-y-6 text-white min-h-screen">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">Trading Dashboard</h1>
        <p class="opacity-70">Performance Overview</p>
      </div>
      <div class="flex items-center gap-4">
        <div class="badge badge-outline badge-lg">Live</div>
        <select class="select select-bordered select-sm">
          <option>Last 30 Days</option>
          <option>Last 7 Days</option>
          <option>Last 90 Days</option>
        </select>
      </div>
    </div>

    <!-- Top Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <!-- Net P&L -->
      <div class="card bg-base-200 shadow-lg">
        <div class="card-body p-4">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-3 h-3 rounded-full bg-blue-500"></div>
            <span class="text-sm opacity-70">Net P&L</span>
            <div class="ml-auto">
              <div class="dropdown dropdown-end">
                <div tabindex="0" role="button" class="btn btn-ghost btn-xs">ⓘ</div>
                <div class="dropdown-content z-[1] card card-compact p-2 shadow bg-base-100 text-xs">
                  <div class="card-body p-2">
                    <p>Total profit and loss</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <div class="text-2xl font-bold text-success">$248.78</div>
            <div class="w-16 h-8">
              <canvas ref="netPnLChart" class="w-full h-full"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Trade Expectancy -->
      <div class="card bg-base-200 shadow-lg">
        <div class="card-body p-4">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-3 h-3 rounded-full bg-green-500"></div>
            <span class="text-sm opacity-70">Trade Expectancy</span>
            <div class="ml-auto">
              <div class="dropdown dropdown-end">
                <div tabindex="0" role="button" class="btn btn-ghost btn-xs">ⓘ</div>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <div class="text-2xl font-bold">$248.78</div>
            <div class="w-16 h-8">
              <canvas ref="tradeExpectancyChart" class="w-full h-full"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Profit Factor -->
      <div class="card bg-base-200 shadow-lg">
        <div class="card-body p-4">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-3 h-3 rounded-full bg-purple-500"></div>
            <span class="text-sm opacity-70">Profit Factor</span>
            <div class="ml-auto">
              <div class="dropdown dropdown-end">
                <div tabindex="0" role="button" class="btn btn-ghost btn-xs">ⓘ</div>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <div class="text-2xl font-bold">1.24</div>
            <div class="w-16 h-8">
              <canvas ref="profitFactorChart" class="w-full h-full"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Win % -->
      <div class="card bg-base-200 shadow-lg">
        <div class="card-body p-4">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-3 h-3 rounded-full bg-orange-500"></div>
            <span class="text-sm opacity-70">Win %</span>
            <div class="ml-auto">
              <div class="dropdown dropdown-end">
                <div tabindex="0" role="button" class="btn btn-ghost btn-xs">ⓘ</div>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <div class="text-2xl font-bold text-info">39.02%</div>
            <div class="w-16 h-8">
              <canvas ref="winRateChart" class="w-full h-full"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Avg win/loss trade -->
      <div class="card bg-base-200 shadow-lg">
        <div class="card-body p-4">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <span class="text-sm opacity-70">Avg win/loss trade</span>
            <div class="ml-auto">
              <div class="dropdown dropdown-end">
                <div tabindex="0" role="button" class="btn btn-ghost btn-xs">ⓘ</div>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <div class="text-2xl font-bold">
              <span class="text-success">$34.82</span>
              <span class="text-error ml-2">$51.32</span>
            </div>
            <div class="w-16 h-8">
              <canvas ref="avgWinLossChart" class="w-full h-full"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Zella Score -->
      <div class="card bg-base-200 shadow-lg">
        <div class="card-body">
          <h2 class="card-title mb-4">Zella Score</h2>
          <div class="flex items-center justify-center mb-4">
            <div class="relative w-32 h-32">
              <canvas ref="zellaScoreCanvas" class="w-full h-full"></canvas>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="text-2xl font-bold">81</div>
                  <div class="text-xs opacity-70">+1</div>
                </div>
              </div>
            </div>
          </div>
          <div class="text-center text-sm opacity-70">
            <div>Avg win/loss</div>
            <div>Profit factor</div>
            <div class="mt-2 text-xs">Your Zella Score: 81 +1</div>
          </div>
        </div>
      </div>

      <!-- Daily Net Cumulative P&L -->
      <div class="card bg-base-200 shadow-lg">
        <div class="card-body">
          <h2 class="card-title">Daily Net Cumulative P&L</h2>
          <div class="h-48 w-full">
            <canvas ref="cumulativePnLCanvas" class="h-full w-full"></canvas>
          </div>
        </div>
      </div>

      <!-- Net Daily P&L -->
      <div class="card bg-base-200 shadow-lg">
        <div class="card-body">
          <h2 class="card-title">Net Daily P&L</h2>
          <div class="h-48 w-full">
            <canvas ref="dailyPnLCanvas" class="h-full w-full"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Open Positions -->
      <div class="card bg-base-200 shadow-lg">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title">Open Positions</h2>
            <div class="tabs tabs-boxed">
              <a class="tab tab-active">Recent Trades</a>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Open Date</th>
                  <th>Symbol</th>
                  <th class="text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>11-12-2023</td>
                  <td>MRD</td>
                  <td class="text-right text-success">$21.21</td>
                </tr>
                <tr>
                  <td>11-12-2023</td>
                  <td>MRD</td>
                  <td class="text-right text-success">$134.21</td>
                </tr>
                <tr>
                  <td>11-12-2023</td>
                  <td>MRD</td>
                  <td class="text-right text-success">$134.21</td>
                </tr>
                <tr>
                  <td>11-12-2023</td>
                  <td>MRD</td>
                  <td class="text-right text-success">$523.21</td>
                </tr>
                <tr>
                  <td>11-12-2023</td>
                  <td>MRD</td>
                  <td class="text-right text-success">$523.21</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Calendar -->
      <div class="card bg-base-200 shadow-lg">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h2 class="card-title">December 2023</h2>
            <div class="flex gap-2">
              <button class="btn btn-ghost btn-sm">‹</button>
              <button class="btn btn-ghost btn-sm">›</button>
              <div class="dropdown dropdown-end">
                <div tabindex="0" role="button" class="btn btn-ghost btn-sm">ⓘ</div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-7 gap-1 text-center text-sm mb-2">
            <div class="font-semibold opacity-70">Sun</div>
            <div class="font-semibold opacity-70">Mon</div>
            <div class="font-semibold opacity-70">Tue</div>
            <div class="font-semibold opacity-70">Wed</div>
            <div class="font-semibold opacity-70">Thu</div>
            <div class="font-semibold opacity-70">Fri</div>
            <div class="font-semibold opacity-70">Sat</div>
          </div>
          <div class="grid grid-cols-7 gap-1">
            <!-- Empty cells for days before month starts -->
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div class="btn btn-ghost btn-sm">01</div>
            <div class="btn btn-ghost btn-sm">02</div>
          </div>
          <div class="grid grid-cols-7 gap-1">
            <div class="btn btn-ghost btn-sm">03</div>
            <div class="btn btn-ghost btn-sm">04</div>
            <div class="btn btn-ghost btn-sm">05</div>
            <div class="btn btn-ghost btn-sm bg-success text-success-content">06</div>
            <div class="btn btn-ghost btn-sm">07</div>
            <div class="btn btn-ghost btn-sm">08</div>
            <div class="btn btn-ghost btn-sm">09</div>
          </div>
          <div class="grid grid-cols-7 gap-1">
            <div class="btn btn-ghost btn-sm">10</div>
            <div class="btn btn-ghost btn-sm bg-success text-success-content">
              <div>11</div>
              <div class="text-xs">28</div>
              <div class="text-xs">$62.9K</div>
            </div>
            <div class="btn btn-ghost btn-sm">12</div>
            <div class="btn btn-ghost btn-sm">13</div>
            <div class="btn btn-ghost btn-sm">14</div>
            <div class="btn btn-ghost btn-sm">15</div>
            <div class="btn btn-ghost btn-sm">16</div>
          </div>
          <div class="grid grid-cols-7 gap-1">
            <div class="btn btn-ghost btn-sm">17</div>
            <div class="btn btn-ghost btn-sm">18</div>
            <div class="btn btn-ghost btn-sm">19</div>
            <div class="btn btn-ghost btn-sm">20</div>
            <div class="btn btn-ghost btn-sm">21</div>
            <div class="btn btn-ghost btn-sm">22</div>
            <div class="btn btn-ghost btn-sm">23</div>
          </div>
          <div class="grid grid-cols-7 gap-1">
            <div class="btn btn-ghost btn-sm">24</div>
            <div class="btn btn-ghost btn-sm">25</div>
            <div class="btn btn-ghost btn-sm">26</div>
            <div class="btn btn-ghost btn-sm">27</div>
            <div class="btn btn-ghost btn-sm">28</div>
            <div class="btn btn-ghost btn-sm">29</div>
            <div class="btn btn-ghost btn-sm">30</div>
          </div>
          <div class="grid grid-cols-7 gap-1">
            <div class="btn btn-ghost btn-sm">31</div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { SAMPLE_REPORT } from '../data/sampleReport'
import type { Report, Trade, Market } from '../types/report'
import {
  Chart,
  LineController,
  LineElement,
  BarController,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  DoughnutController,
  ArcElement
} from 'chart.js'

// Register Chart.js components
Chart.register(
  LineController,
  LineElement,
  BarController,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  DoughnutController,
  ArcElement,
)

// Props
const props = defineProps<{
  report?: Report
}>()

// Computed state
const report = computed((): Report => props.report || SAMPLE_REPORT)

// Market data shortcuts
const market = computed((): Market => report.value.markets?.['SOL-PERP'] || {} as Market)
const trades = computed((): Trade[] => (market.value.trades || []).slice().sort((a: Trade, b: Trade) => new Date(a.t).getTime() - new Date(b.t).getTime()))
const strategies = computed(() => market.value.strategies || {} as Market['strategies'])
const router = computed(() => market.value.router || {} as Market['router'])

// Metrics
const equity = computed(() => Number(report.value.cash || 0) + Number(rangeLastMark.value || 0))
const startEquity = computed(() => report.value.meta?.dayStartEquity ?? report.value.deposit ?? 0)
const totalFees = computed(() => Number(market.value.feesPaid || 0))
const totalAbsNotional = computed(() => trades.value.reduce((s: number, t: Trade) => s + Math.abs(Number(t.notional||0)), 0))
const turnoverRatio = computed(() => startEquity.value ? totalAbsNotional.value / startEquity.value : 0)
const feeBpsOfTurnover = computed(() => totalAbsNotional.value ? (totalFees.value / totalAbsNotional.value) * 10000 : 0)
const netPnl = computed(() => Number(report.value.cash || 0) - Number(report.value.deposit || 0))
const netReturnPct = computed(() => startEquity.value ? (netPnl.value / startEquity.value) * 100 : 0)
const netReturnBps = computed(() => startEquity.value ? (netPnl.value / startEquity.value) * 10000 : 0)
const avgAbsNotional = computed(() => trades.value.length ? totalAbsNotional.value / trades.value.length : 0)
const sessionMins = computed(() => {
  if (trades.value.length < 2) return 0
  const first = new Date(trades.value[0].t).getTime()
  const last = new Date(trades.value[trades.value.length-1].t).getTime()
  return (last - first) / 60000
})

// Data integrity check
const realizedPnLField = computed(() => -Number(market.value.realizedPnL || 0)) // Flip sign to match cash-deposit convention
const dataIntegrityWarning = computed(() => {
  // Very light consistency check: realizedPnL should be close to netPnl when position == 0
  const flat = Number(market.value.position || 0) === 0
  const diff = Math.abs(realizedPnLField.value - netPnl.value)
  // Scale tolerance with trading volume (1% of turnover or $1, whichever is larger)
  const tolerance = Math.max(1, totalAbsNotional.value * 0.01)
  return flat && diff > tolerance
})

// Range strategy metrics
const rangeMid = computed(() => strategies.value?.range?.mid ?? null)
const rangeLastMark = computed(() => strategies.value?.range?.lastMark ?? null)
const rangeVolBps = computed(() => strategies.value?.range?.volEwmaBps ?? null)

// Chart refs and instances
const zellaScoreCanvas = ref<HTMLCanvasElement | null>(null)
const cumulativePnLCanvas = ref<HTMLCanvasElement | null>(null)
const dailyPnLCanvas = ref<HTMLCanvasElement | null>(null)
const netPnLChart = ref<HTMLCanvasElement | null>(null)
const tradeExpectancyChart = ref<HTMLCanvasElement | null>(null)
const profitFactorChart = ref<HTMLCanvasElement | null>(null)
const winRateChart = ref<HTMLCanvasElement | null>(null)
const avgWinLossChart = ref<HTMLCanvasElement | null>(null)
let zellaScoreChart: Chart | null = null
let cumulativePnLChart: Chart | null = null
let dailyPnLChart: Chart | null = null
let netPnLMiniChart: Chart | null = null
let tradeExpectancyMiniChart: Chart | null = null
let profitFactorMiniChart: Chart | null = null
let winRateMiniChart: Chart | null = null
let avgWinLossMiniChart: Chart | null = null

// Chart data series
const labels = computed(() => trades.value.map((t: Trade) => toHms(t.t)))
const grossCashflow = computed(() => {
  let c = 0
  return trades.value.map((t: Trade) => { c += Number(t.notional||0); return c })
})
const feesCum = computed(() => {
  const n = trades.value.length
  if (!n) return []
  return trades.value.map((_: Trade, i: number) => totalFees.value * ((i+1)/n)) // simple pro‑rata for visualization only
})
const netSeries = computed(() => grossCashflow.value.map((g: number, i: number) => g - (feesCum.value[i] || 0)))
const priceSeries = computed(() => trades.value.map((t: Trade) => Number(t.px || 0)))
const volSeries = computed(() => trades.value.map((t: Trade) => Math.abs(Number(t.notional || 0))))
const sideColors = computed(() => trades.value.map((t: Trade) => t.side === 'buy' ? '#16a34a' : '#dc2626'))

// Chart lifecycle
onMounted(() => {
  buildCharts()
})

onBeforeUnmount(() => {
  zellaScoreChart?.destroy?.()
  cumulativePnLChart?.destroy?.()
  dailyPnLChart?.destroy?.()
  netPnLMiniChart?.destroy?.()
  tradeExpectancyMiniChart?.destroy?.()
  profitFactorMiniChart?.destroy?.()
  winRateMiniChart?.destroy?.()
  avgWinLossMiniChart?.destroy?.()
})

watch([trades, totalFees], () => {
  rebuildCharts()
})

// Chart building
function rebuildCharts() {
  zellaScoreChart?.destroy?.()
  cumulativePnLChart?.destroy?.()
  dailyPnLChart?.destroy?.()
  netPnLMiniChart?.destroy?.()
  tradeExpectancyMiniChart?.destroy?.()
  profitFactorMiniChart?.destroy?.()
  winRateMiniChart?.destroy?.()
  avgWinLossMiniChart?.destroy?.()
  buildCharts()
}

function buildCharts() {
  // Zella Score Gauge Chart - Custom triangular gauge
  if (zellaScoreCanvas.value) {
    const ctx = zellaScoreCanvas.value.getContext('2d')!
    zellaScoreChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: [81, 19],
            backgroundColor: [
              '#22C55E',
              '#E5E7EB',
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        rotation: -90,
        circumference: 180,
        cutout: '75%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
      },
    })

    // Draw the triangular pointer
    const centerX = zellaScoreCanvas.value.width / 2
    const centerY = zellaScoreCanvas.value.height / 2
    const outerRadius = 120

    // Draw triangular pointer at score position (81/100 * 180 degrees = 145.8 degrees)
    const pointerAngle = (81 / 100) * 180 * (Math.PI / 180) - Math.PI / 2

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(pointerAngle)
    ctx.beginPath()
    ctx.moveTo(0, -5)
    ctx.lineTo(-10, 10)
    ctx.lineTo(10, 10)
    ctx.closePath()
    ctx.fillStyle = '#22C55E'
    ctx.fill()
    ctx.restore()
  }

  // Daily Net Cumulative P&L Chart
  if (cumulativePnLCanvas.value) {
    const ctx = cumulativePnLCanvas.value.getContext('2d')!
    cumulativePnLChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['12/09/2022', '12/09/2022', '12/09/2022', '12/09/2022', '12/09/2022'],
        datasets: [
          {
            label: 'Cumulative P&L',
            data: [200, 150, 50, -50, -200],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            fill: true,
            tension: 0.1,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#9CA3AF', font: { size: 10 } },
          },
          y: {
            grid: { color: 'rgba(156, 163, 175, 0.2)' },
            ticks: {
              color: '#9CA3AF',
              callback: (v) => `$${Number(v)}`,
              font: { size: 10 }
            },
          },
        },
        elements: {
          point: {
            radius: 0,
          },
        },
      },
    })
  }

  // Net Daily P&L Chart
  if (dailyPnLCanvas.value) {
    const ctx = dailyPnLCanvas.value.getContext('2d')!
    dailyPnLChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['12/09/2022', '12/09/2022', '12/09/2022', '12/09/2022', '12/09/2022'],
        datasets: [
          {
            label: 'Daily P&L',
            data: [100, 80, -60, 120, -40],
            backgroundColor: [
              '#10B981',
              '#10B981',
              '#EF4444',
              '#10B981',
              '#EF4444',
            ],
            borderRadius: 2,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#9CA3AF', font: { size: 10 } },
          },
          y: {
            grid: { color: 'rgba(156, 163, 175, 0.2)' },
            ticks: {
              color: '#9CA3AF',
              callback: (v) => `$${Number(v)}`,
              font: { size: 10 }
            },
          },
        },
      },
    })
  }

  // Mini Charts for Stats Cards
  // Net P&L Mini Chart
  if (netPnLChart.value) {
    const ctx = netPnLChart.value.getContext('2d')!
    netPnLMiniChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['', '', '', '', ''],
        datasets: [
          {
            data: [10, 25, 15, 30, 20],
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false },
        },
        elements: { point: { radius: 0 } },
      },
    })
  }

  // Trade Expectancy Mini Chart
  if (tradeExpectancyChart.value) {
    const ctx = tradeExpectancyChart.value.getContext('2d')!
    tradeExpectancyMiniChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['', '', '', '', ''],
        datasets: [
          {
            data: [20, 35, 25, 40, 30],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false },
        },
        elements: { point: { radius: 0 } },
      },
    })
  }

  // Profit Factor Mini Chart
  if (profitFactorChart.value) {
    const ctx = profitFactorChart.value.getContext('2d')!
    profitFactorMiniChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['', '', '', '', ''],
        datasets: [
          {
            data: [1.2, 1.8, 1.4, 2.0, 1.6],
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false },
        },
        elements: { point: { radius: 0 } },
      },
    })
  }

  // Win Rate Mini Chart
  if (winRateChart.value) {
    const ctx = winRateChart.value.getContext('2d')!
    winRateMiniChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['', '', '', '', ''],
        datasets: [
          {
            data: [35, 45, 40, 50, 42],
            borderColor: '#F97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false },
        },
        elements: { point: { radius: 0 } },
      },
    })
  }

  // Avg Win/Loss Mini Chart
  if (avgWinLossChart.value) {
    const ctx = avgWinLossChart.value.getContext('2d')!
    avgWinLossMiniChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['', '', '', '', ''],
        datasets: [
          {
            data: [30, 45, 35, 55, 40],
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false },
        },
        elements: { point: { radius: 0 } },
      },
    })
  }
}

// Utility functions
function toHms(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2,'0')
  const mm = String(d.getMinutes()).padStart(2,'0')
  const ss = String(d.getSeconds()).padStart(2,'0')
  return `${hh}:${mm}:${ss}`
}

function fmtCurrency(v: number | null | undefined): string {
  const n = Number(v||0)
  const sign = n < 0 ? '-' : ''
  return `${sign}$${Math.abs(n).toFixed(2)}`
}

function fmtNumber(v: number | null | undefined): string {
  const n = Number(v||0)
  return Number.isInteger(n) ? n.toString() : n.toFixed(6)
}
</script>

<style scoped>
</style>
