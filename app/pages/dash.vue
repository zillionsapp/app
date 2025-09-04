<template>
  <div class="p-4 md:p-6 space-y-6 text-white">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Trading Performance Dashboard</h1>
        <p class="opacity-70">Network: {{ report.meta?.network || "n/a" }} • Day {{ report.meta?.dayStartDate || "n/a" }}</p>
      </div>
      <div class="badge badge-outline">SOL-PERP</div>
    </div>

    <!-- Integrity warning (solution-oriented) -->
    <div v-if="dataIntegrityWarning" class="alert alert-warning">
      <span>
        Heads up: <code>realizedPnL</code> from the report ({{ fmtNumber(realizedPnLField) }}) doesn't reconcile with cash & fees.
        This widget recomputes PnL as <em>cash − deposit</em> for accuracy. If your backend emits realized PnL, consider fixing its sign/aggregation.
      </span>
    </div>

    <!-- Stat cards -->
    <div class="stats stats-vertical lg:stats-horizontal shadow">
      <div class="stat bg-base-200">
        <div class="stat-title text-white/60">Start Equity</div>
        <div class="stat-value">{{ fmtCurrency(startEquity) }}</div>
        <div class="stat-desc text-white/60">Deposit: {{ fmtCurrency(report.deposit) }}</div>
      </div>

      <div class="stat bg-base-200">
        <div class="stat-title text-white/60">Cash</div>
        <div class="stat-value">{{ fmtCurrency(report.cash) }}</div>
        <div class="stat-desc text-white/60">Fees: {{ fmtCurrency(totalFees) }} (≈ {{ feeBpsOfTurnover.toFixed(2) }} bps of turnover)</div>
      </div>

      <div class="stat bg-base-200">
        <div class="stat-title text-white/60">Net PnL</div>
        <div :class="['stat-value', netPnl >= 0 ? 'text-success' : 'text-error']">{{ fmtCurrency(netPnl) }}</div>
        <div class="stat-desc text-white/60">Return: {{ netReturnBps.toFixed(3) }} bps ({{ netReturnPct.toFixed(5) }}%)</div>
      </div>

      <div class="stat bg-base-200">
        <div class="stat-title text-white/60">Turnover</div>
        <div class="stat-value">{{ (turnoverRatio*100).toFixed(2) }}%</div>
        <div class="stat-desc text-white/60">{{ trades.length }} legs • avg ${{ avgAbsNotional.toFixed(2) }} • session {{ sessionMins.toFixed(1) }}m</div>
      </div>

      <div class="stat bg-base-200">
        <div class="stat-title text-white/60">Router</div>
        <div class="stat-value text-white">{{ router?.lastStrategyKey || 'n/a' }}</div>
        <div class="stat-desc text-white/60">Regime: <span class="badge badge-sm text-warning">{{ router?.lastRegime || 'n/a' }}</span></div>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Equity / Cashflow -->
      <div class="card bg-base-200 shadow col-span-1 xl:col-span-2">
        <div class="card-body">
          <h2 class="card-title">Cashflow & PnL (intra-day)</h2>
          <canvas ref="equityCanvas"></canvas>
          <div class="opacity-70 text-xs">Gross = cumulative trade cashflow; Net = Gross − fees (pro‑rated).</div>
        </div>
      </div>

      <!-- Price with markers -->
      <div class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">Execution Price Trace</h2>
          <canvas ref="priceCanvas"></canvas>
          <div class="opacity-70 text-xs">Markers: buy • sell. Mid: {{ fmtNumber(rangeMid) }} • Last: {{ fmtNumber(rangeLastMark) }}</div>
        </div>
      </div>

      <!-- Volume / Notional bars -->
      <div class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">Trade Notional by Leg</h2>
          <canvas ref="volCanvas"></canvas>
          <div class="opacity-70 text-xs">Total turnover: {{ fmtCurrency(totalAbsNotional) }}</div>
        </div>
      </div>

      <!-- Recent trades table -->
      <div class="card bg-base-200 shadow xl:col-span-2">
        <div class="card-body">
          <h2 class="card-title">Recent Trades</h2>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Side</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Price</th>
                  <th class="text-right">Notional</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in trades.slice(-10)" :key="t.t + t.px">
                  <td>{{ toHms(t.t) }}</td>
                  <td>
                    <span :class="['badge', t.side === 'buy' ? 'badge-success' : 'badge-error']">{{ t.side }}</span>
                  </td>
                  <td class="text-right">{{ fmtNumber(t.qty) }}</td>
                  <td class="text-right">{{ fmtNumber(t.px) }}</td>
                  <td class="text-right">{{ fmtCurrency(t.notional) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Strategy / diagnostics -->
      <div class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">Strategy Diagnostics</h2>
          <ul class="list-disc list-inside space-y-1 text-sm">
            <li>Range mid: <b>{{ fmtNumber(rangeMid) }}</b>, last mark: <b>{{ fmtNumber(rangeLastMark) }}</b></li>
            <li>Vol EWMA: <b>{{ fmtNumber(rangeVolBps) }}</b> bps</li>
            <li>Ticks: <b>{{ strategies?.range?.ticks || 0 }}</b> (warm {{ strategies?.range?.warmTicks || 0 }})</li>
          </ul>
          <div class="divider my-2"></div>
          <p class="text-xs opacity-70">
            Tip: If you want win‑rate and per‑round‑trip alpha, supply fills grouped by order or include realized PnL per fill; we'll compute it on‑chain‑accurate.
          </p>
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
  Filler
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
const equityCanvas = ref<HTMLCanvasElement | null>(null)
const priceCanvas = ref<HTMLCanvasElement | null>(null)
const volCanvas = ref<HTMLCanvasElement | null>(null)
let equityChart: Chart | null = null
let priceChart: Chart | null = null
let volChart: Chart | null = null

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
  equityChart?.destroy?.()
  priceChart?.destroy?.()
  volChart?.destroy?.()
})

watch([trades, totalFees], () => {
  rebuildCharts()
})

// Chart building
function rebuildCharts() {
  equityChart?.destroy?.()
  priceChart?.destroy?.()
  volChart?.destroy?.()
  buildCharts()
}

function buildCharts() {
  if (equityCanvas.value) {
    equityChart = new Chart(equityCanvas.value.getContext('2d')!, {
      type: 'line',
      data: {
        labels: labels.value,
        datasets: [
          {
            label: 'Gross cashflow',
            data: grossCashflow.value,
            borderWidth: 2,
            fill: false,
            tension: 0.2,
          },
          {
            label: 'Fees (cum.)',
            data: feesCum.value.map(v => -v), // show fees as negative area
            borderWidth: 1,
            borderDash: [4,4],
            pointRadius: 0,
            tension: 0,
          },
          {
            label: 'Net PnL',
            data: netSeries.value,
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0.2,
          },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        plugins: { legend: { position: 'bottom' }, tooltip: { intersect: false } },
        scales: {
          x: { display: true, grid: { display: false } },
          y: { display: true, ticks: { callback: v => `$${Number(v).toFixed(2)}` } },
        }
      }
    })
  }

  if (priceCanvas.value) {
    priceChart = new Chart(priceCanvas.value.getContext('2d')!, {
      type: 'line',
      data: {
        labels: labels.value,
        datasets: [
          {
            label: 'Price',
            data: priceSeries.value,
            borderWidth: 2,
            tension: 0.2,
            pointRadius: 4,
            pointHoverRadius: 5,
            pointBackgroundColor: sideColors.value,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `Price $${Number(ctx.parsed.y).toFixed(4)}` } } },
        scales: { x: { grid: { display: false } }, y: { ticks: { callback: v => Number(v).toFixed(2) } } }
      }
    })
  }

  if (volCanvas.value) {
    volChart = new Chart(volCanvas.value.getContext('2d')!, {
      type: 'bar',
      data: {
        labels: labels.value,
        datasets: [
          {
            label: 'Abs notional',
            data: volSeries.value,
            borderWidth: 0,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { ticks: { callback: v => `$${Number(v).toFixed(0)}` } } }
      }
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
