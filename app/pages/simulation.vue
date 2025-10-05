<template>
  <div class="min-h-screen bg-base-200 text-white" data-theme="zillions">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <NuxtLink to="/Wallet" class="btn btn-ghost btn-sm mb-4">
          ← Back to Wallet
        </NuxtLink>
        <h1 class="text-3xl font-bold mb-2">Trading Rules – Mini Simulation</h1>
        <p class="text-white/70">
          Goal: Interactively test how <b>"sell only in profit"</b> + <b>Stop-Loss</b> + <b>Position Sizing</b> with a high hit rate protects capital.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Controls Panel -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Trading Rules: Game Simulation</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Starting Capital</span>
                </label>
                <input
                  v-model.number="state.capital"
                  type="number"
                  class="input input-bordered"
                  min="100"
                  step="100"
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Number of Trades</span>
                </label>
                <input
                  v-model.number="state.trades"
                  type="number"
                  class="input input-bordered"
                  min="1"
                  step="10"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Hit Rate (Win Probability) %</span>
                </label>
                <input
                  v-model.number="state.winrate"
                  type="number"
                  class="input input-bordered"
                  min="1"
                  max="99"
                  step="0.5"
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Random Seed (optional)</span>
                </label>
                <input
                  v-model.number="state.seed"
                  type="number"
                  class="input input-bordered"
                  placeholder="e.g. 42"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Stop-Loss (SL) %</span>
                </label>
                <input
                  v-model.number="state.sl"
                  type="number"
                  class="input input-bordered"
                  min="0.1"
                  step="0.1"
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Take-Profit (TP) %</span>
                </label>
                <input
                  v-model.number="state.tp"
                  type="number"
                  class="input input-bordered"
                  min="0.1"
                  step="0.1"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Risk per Trade (% of Capital)</span>
                </label>
                <input
                  v-model.number="state.risk"
                  type="number"
                  class="input input-bordered"
                  min="0.1"
                  step="0.1"
                />
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text">Max Capital Exposure (% of Capital)</span>
                </label>
                <input
                  v-model.number="state.capPct"
                  type="number"
                  class="input input-bordered"
                  min="1"
                  max="100"
                  step="1"
                />
              </div>
            </div>

            <details class="collapse collapse-arrow bg-base-200">
              <summary class="collapse-title text-sm font-medium">
                What is being simulated?
              </summary>
              <div class="collapse-content">
                <p class="text-sm text-white/70">
                  Position size = (Risk% × Capital) ÷ SL%. Winning trades take TP%, losing trades take SL%.<br>
                  "Sell only in profit" ⇒ There is <i>no</i> voluntary exit in the negative, only SL.
                  This way a single crash cannot wipe out the account as long as position sizing remains disciplined.
                </p>
              </div>
            </details>

            <div class="card-actions justify-center gap-2 flex-wrap">
              <button class="btn btn-primary" @click="runSim(false)">
                Start Simulation
              </button>
              <button class="btn btn-secondary" @click="runMC">
                Monte Carlo × 500
              </button>
              <button class="btn btn-accent" @click="applyPreset">
                84% Proof Preset
              </button>
              <button class="btn btn-ghost" @click="runSim(true)">
                Single Step
              </button>
              <button class="btn btn-outline" @click="resetAll">
                Reset
              </button>
            </div>

            <!-- KPIs -->
            <div class="grid grid-cols-3 gap-4 mt-6">
              <div class="bg-base-200 p-4 rounded-lg">
                <div class="text-xs text-white/60 uppercase tracking-wide">Final Capital</div>
                <div class="text-lg font-bold" :class="kpiClass(finalCapital)">
                  {{ formatCurrency(finalCapital) }}
                </div>
              </div>
              <div class="bg-base-200 p-4 rounded-lg">
                <div class="text-xs text-white/60 uppercase tracking-wide">Max Drawdown</div>
                <div class="text-lg font-bold text-warning">
                  {{ formatPercent(maxDrawdown) }}
                </div>
              </div>
              <div class="bg-base-200 p-4 rounded-lg">
                <div class="text-xs text-white/60 uppercase tracking-wide">Win Rate (Realized)</div>
                <div class="text-lg font-bold" :class="kpiClass(winRate)">
                  {{ formatPercent(winRate) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chart Panel -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-3 h-3 bg-primary rounded-full"></div>
              <span class="text-sm text-white/70">Equity Curve</span>
            </div>

            <div class="relative">
              <canvas
                ref="chartCanvas"
                :width="chartWidth"
                :height="chartHeight"
                class="w-full border border-base-300 rounded-lg"
                @mousemove="handleChartMouseMove"
                @mouseleave="handleChartMouseLeave"
              ></canvas>
              <div
                v-if="tooltip.show"
                class="absolute bg-base-300 text-white text-xs p-2 rounded shadow-lg pointer-events-none z-10"
                :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
              >
                <div>Trade #{{ tooltip.index }}</div>
                <div>Equity: {{ formatCurrency(tooltip.equity) }}</div>
                <div>Δ: <span :class="tooltip.pnl >= 0 ? 'text-success' : 'text-error'">
                  {{ tooltip.pnl >= 0 ? '+' : '' }}{{ formatCurrency(tooltip.pnl) }}
                </span></div>
              </div>
            </div>

            <div class="mt-4">
              <canvas
                ref="histCanvas"
                :width="chartWidth"
                :height="histHeight"
                class="w-full border border-base-300 rounded-lg"
              ></canvas>
              <p v-if="mcSummary" class="text-sm text-white/70 mt-2" v-html="mcSummary"></p>
              <p class="text-xs text-white/50 mt-4">
                Note: This simplified simulation is not financial advice. It serves to mechanically visualize the interplay of <b>Stop-Loss</b>,
                <b>Position Sizing</b> and <b>sell only in profit</b>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Utility: seeded RNG (Mulberry32)
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Reactive state
const state = reactive({
  capital: 10000,
  trades: 200,
  winrate: 84,
  sl: 2,
  tp: 2,
  risk: 1,
  capPct: 100,
  seed: null as number | null,
  history: [] as number[],
  wins: 0,
  losses: 0,
})

// Chart refs and dimensions
const chartCanvas = ref<HTMLCanvasElement>()
const histCanvas = ref<HTMLCanvasElement>()
const chartWidth = 600
const chartHeight = 380
const histHeight = 160

// Tooltip state
const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  index: 0,
  equity: 0,
  pnl: 0
})

// Computed values
const finalCapital = computed(() => state.history.length > 0 ? state.history[state.history.length - 1] : 0)
const maxDrawdown = computed(() => calcMaxDD(state.history))
const winRate = computed(() => {
  const total = state.wins + state.losses
  return total > 0 ? (state.wins / total) * 100 : 0
})

// KPI styling
const kpiClass = (value: number) => {
  if (value > state.capital) return 'text-success'
  if (value < state.capital) return 'text-error'
  return 'text-white'
}

// Core simulation (single path)
function simulateOnce(opts: typeof state & { capital: number }) {
  let cap = opts.capital
  let maxCap = cap
  let minCap = cap
  let wins = 0, losses = 0
  const eq = [cap]
  const rng = opts.seed != null ? mulberry32(opts.seed) : Math.random

  for (let i = 0; i < opts.trades; i++) {
    // Risk per trade in currency
    const riskAmt = cap * (opts.risk / 100)
    // Position sizing via stop distance
    const posSize = Math.min((riskAmt / (opts.sl / 100)), cap * (opts.capPct / 100))
    // Outcome based on win probability
    const isWin = rng() < (opts.winrate / 100)
    const pnl = isWin ? (posSize * (opts.tp / 100)) : -(posSize * (opts.sl / 100))
    cap += pnl
    if (isWin) wins++; else losses++
    if (cap > maxCap) maxCap = cap
    if (cap < minCap) minCap = cap
    eq.push(cap)
    if (cap <= 0) break // hard stop if blown
  }

  return {
    equity: eq,
    final: cap,
    wins,
    losses,
    maxDD: calcMaxDD(eq)
  }
}

// Max drawdown calculation
function calcMaxDD(eq: number[]) {
  let peak = eq[0] || 0
  let maxDD = 0
  for (const v of eq) {
    peak = Math.max(peak, v)
    maxDD = Math.max(maxDD, (peak - v) / peak)
  }
  return maxDD
}

// Monte Carlo: multiple runs
function monteCarlo(opts: typeof state, runs = 500) {
  const finals = []
  let best = -Infinity
  let worst = Infinity
  let lossRuns = 0
  let avgDD = 0

  for (let i = 0; i < runs; i++) {
    const seed = (opts.seed != null ? opts.seed : Math.floor(Math.random() * 1e9)) + i * 97
    const r = simulateOnce({ ...opts, seed })
    finals.push(r.final)
    best = Math.max(best, r.final)
    worst = Math.min(worst, r.final)
    if (r.final < opts.capital) lossRuns++
    avgDD += r.maxDD
  }
  avgDD /= runs

  return { finals, best, worst, lossRate: lossRuns / runs, avgDD }
}

// Simple line chart (canvas)
function drawLine(canvas: HTMLCanvasElement, series: number[], color = '#8fb6ff') {
  const ctx = canvas.getContext('2d')!
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  // Grid
  ctx.strokeStyle = 'var(--bo)'
  ctx.lineWidth = 1
  for (let y = 0; y <= 5; y++) {
    const yy = y * (h / 5)
    ctx.beginPath()
    ctx.moveTo(0, yy)
    ctx.lineTo(w, yy)
    ctx.stroke()
  }
  for (let x = 0; x <= 10; x++) {
    const xx = x * (w / 10)
    ctx.beginPath()
    ctx.moveTo(xx, 0)
    ctx.lineTo(xx, h)
    ctx.stroke()
  }

  if (series.length < 2) return { yMin: 0, yMax: 1, stepX: 1, min: 0, max: 1 }

  const min = Math.min(...series)
  const max = Math.max(...series)
  const pad = (max - min) * 0.08 || 1
  const yMin = min - pad
  const yMax = max + pad
  const stepX = w / (series.length - 1)

  // Axis labels
  const fmt = (v: number) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(v)
  ctx.fillStyle = 'var(--bc)'
  ctx.font = '12px system-ui'
  ctx.fillText(fmt(yMax), 6, 12)
  ctx.fillText(fmt(yMin), 6, h - 6)

  // Line
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  series.forEach((v, i) => {
    const x = i * stepX
    const y = h - ((v - yMin) / (yMax - yMin)) * h
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()

  return { yMin, yMax, stepX, min, max }
}

// Simple histogram
function drawHist(canvas: HTMLCanvasElement, data: number[]) {
  const ctx = canvas.getContext('2d')!
  const w = canvas.width
  const h = canvas.height
  ctx.clearRect(0, 0, w, h)

  if (!data || data.length === 0) return

  const min = Math.min(...data)
  const max = Math.max(...data)
  const bins = Math.max(8, Math.min(32, Math.round(Math.sqrt(data.length))))
  const step = (max - min) / bins || 1
  const counts = Array(bins).fill(0)

  data.forEach(v => {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / step)))
    counts[idx]++
  })

  const maxC = Math.max(...counts)

  // Grid
  ctx.strokeStyle = 'var(--bo)'
  ctx.lineWidth = 1
  for (let y = 0; y <= 4; y++) {
    const yy = y * (h / 4)
    ctx.beginPath()
    ctx.moveTo(0, yy)
    ctx.lineTo(w, yy)
    ctx.stroke()
  }

  // Bars
  const bw = w / bins
  ctx.fillStyle = '#8fb6ff'
  counts.forEach((c, i) => {
    const x = i * bw + 1
    const barH = (c / maxC) * (h - 16)
    ctx.fillRect(x, h - barH - 4, bw - 2, barH)
  })

  // Axis labels
  const fmt = (v: number) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(v)
  ctx.fillStyle = 'var(--bc)'
  ctx.font = '12px system-ui'
  ctx.fillText(fmt(max), w - 80, 12)
  ctx.fillText(fmt(min), 8, h - 6)
}

// Chart interactions
function handleChartMouseMove(event: MouseEvent) {
  if (!state.history.length || !chartCanvas.value) return

  const rect = chartCanvas.value.getBoundingClientRect()
  const x = (event.clientX - rect.left) * (chartWidth / rect.width)
  const idx = Math.round(x / (chartWidth / (state.history.length - 1)))

  if (idx >= 0 && idx < state.history.length) {
    const equity = state.history[idx]
    const pnl = idx > 0 ? (equity - state.history[idx - 1]) : 0

    tooltip.value = {
      show: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      index: idx,
      equity: equity || 0,
      pnl: pnl || 0
    }
  }
}

function handleChartMouseLeave() {
  tooltip.value.show = false
}

// Formatters
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

const formatPercent = (value: number) => {
  return (value * 100).toFixed(1) + '%'
}

// MC Summary
const mcSummary = ref('')

// Actions
function runSim(stepMode = false) {
  if (stepMode && state.history.length && (state.history.length - 1) < state.trades) {
    // continue one step with same seed progression
    const baseSeed = state.seed ?? Math.floor(Math.random() * 1e9)
    const r = simulateOnce({
      ...state,
      capital: state.history[state.history.length - 1],
      trades: 1,
      seed: baseSeed + state.history.length
    })
    state.wins += r.wins
    state.losses += r.losses
    state.history = state.history.concat(r.equity.slice(1))

    if (chartCanvas.value) {
      drawLine(chartCanvas.value, state.history)
    }
    return
  }

  const res = simulateOnce(state)
  state.history = res.equity
  state.wins = res.wins
  state.losses = res.losses

  if (chartCanvas.value) {
    drawLine(chartCanvas.value, res.equity)
  }

  if (histCanvas.value) {
    drawHist(histCanvas.value, [])
  }

  mcSummary.value = ''
}

function runMC() {
  const r = monteCarlo(state, 500)

  if (histCanvas.value) {
    drawHist(histCanvas.value, r.finals)
  }

  const pctLoss = (r.lossRate * 100).toFixed(1)
  const avg = r.finals.reduce((a, b) => a + b, 0) / r.finals.length

  mcSummary.value = `Monte‑Carlo (500 Läufe): <span class="text-success">Ø Endkapital ${formatCurrency(avg)}</span> · Beste ${formatCurrency(r.best)} · Schlechteste ${formatCurrency(r.worst)} · Läufe mit Verlust ggü. Start: <span class="${r.lossRate > 0 ? 'text-error' : 'text-success'}">${pctLoss}%</span> · Ø MaxDD ${formatPercent(r.avgDD)}`
}

function applyPreset() {
  state.winrate = 84
  state.sl = 2
  state.tp = 2
  state.risk = 1
  state.trades = 200
  state.capital = 10000
  state.capPct = 100
  runSim(false)
}

function resetAll() {
  state.history = []
  state.wins = 0
  state.losses = 0

  if (chartCanvas.value) {
    drawLine(chartCanvas.value, [])
  }

  if (histCanvas.value) {
    drawHist(histCanvas.value, [])
  }

  mcSummary.value = ''
}

// Initialize
onMounted(() => {
  applyPreset()
})
</script>
