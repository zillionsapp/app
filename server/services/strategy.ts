import { H3Event, readBody, setHeaders, setResponseStatus } from 'h3'

// Strategy configuration interface
export interface StrategyConfig {
  // Data
  symbol?: string
  tf?: string
  htf?: string
  lookbackDays?: number
  limitPerReq?: number

  // Trading / costs
  initialCapital?: number
  commissionPct?: number
  slippagePct?: number

  // Position sizing
  posPct?: number

  // Trend / HTF gates
  useTrend?: boolean
  useHTF?: boolean
  trendLen?: number
  upTh?: number
  dnTh?: number
  htfLongTh?: number
  htfShortTh?: number

  // Triangles
  obosLen?: number
  adaptLen?: number
  showOBOS?: boolean

  // Triangle density trigger
  winLen?: number
  needBars?: number
  minSpacing?: number
  enableShorts?: boolean

  // Scale-Out & Trail
  tpPct?: number
  tpPortion?: number
  useTrail?: boolean
  trailPct?: number
  armTrailPct?: number
  minHoldBars?: number

  // Emergency Risk
  useATRstop?: boolean
  atrLen?: number
  atrMult?: number
}

// Default configuration
export const DEFAULT_CONFIG: Required<StrategyConfig> = {
  // Data
  symbol: "BTCUSDT",
  tf: "15m",
  htf: "1h",
  lookbackDays: 120,
  limitPerReq: 1000,

  // Trading / costs
  initialCapital: 1000,
  commissionPct: 0.05,
  slippagePct: 0,

  // Position sizing
  posPct: 10,

  // Trend / HTF gates
  useTrend: true,
  useHTF: true,
  trendLen: 40,
  upTh: 57.0,
  dnTh: 43.0,
  htfLongTh: 53.0,
  htfShortTh: 47.0,

  // Triangles
  obosLen: 12,
  adaptLen: 14,
  showOBOS: true,

  // Triangle density trigger
  winLen: 20,
  needBars: 4,
  minSpacing: 3,
  enableShorts: false,

  // Scale-Out & Trail
  tpPct: 8.0,
  tpPortion: 50.0,
  useTrail: true,
  trailPct: 4.0,
  armTrailPct: 0.8,
  minHoldBars: 2,

  // Emergency Risk
  useATRstop: false,
  atrLen: 14,
  atrMult: 3.0,
}

// Utility functions
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

const INTERVALS = new Set([
  "1m","3m","5m","15m","30m","1h","2h","4h","6h","8h","12h","1d","3d","1w","1M"
])

function nowMs() { return Date.now() }
function days(n: number) { return n * 24*60*60*1000 }

function pct(a: number, b: number) { return (a / b - 1) * 100 }
function pctFrom(a: number, p: number) { return a * (1 + p/100) }
function applyCommission(amount: number, commissionPct: number) {
  return amount * (1 - commissionPct / 100)
}
function applySlippagePx(px: number, slippagePct: number, side: string) {
  if (!slippagePct) return px
  return side === "buy" ? px * (1 + slippagePct/100) : px * (1 - slippagePct/100)
}

// Market data fetching
export async function fetchKlines(symbol: string, interval: string, startTimeMs: number, endTimeMs: number, limitPerReq = 1000) {
  if (!INTERVALS.has(interval)) throw new Error(`Unsupported interval ${interval}`)

  const out = []
  let start = startTimeMs
  let safety = 0

  while (true) {
    const url = new URL("https://api.binance.com/api/v3/klines")
    url.searchParams.set("symbol", symbol)
    url.searchParams.set("interval", interval)
    url.searchParams.set("limit", limitPerReq.toString())
    if (start) url.searchParams.set("startTime", String(start))
    if (endTimeMs) url.searchParams.set("endTime", String(endTimeMs))

    const res = await fetch(url, { headers: { "User-Agent": "paper-bot/1.0" } })
    if (!res.ok) {
      await sleep(350)
      continue
    }
    const raw = await res.json()
    if (!Array.isArray(raw) || raw.length === 0) break

    for (const k of raw) {
      const [t, o, h, l, c, v] = [k[0], k[1], k[2], k[3], k[4], k[5]]
      out.push({
        time: Number(t),
        open: Number(o),
        high: Number(h),
        low:  Number(l),
        close:Number(c),
        volume:Number(v),
      })
    }

    const last = raw[raw.length - 1][0]
    const nextStart = Number(last) + 1
    if (start && nextStart <= start) break
    start = nextStart

    if (raw.length < limitPerReq) break
    if (++safety > 1000) break
    await sleep(50)
  }

  return out
}

// Technical indicators
function ema(series: number[], len: number) {
  const out = new Array(series.length).fill(NaN)
  if (len <= 1) return series.slice()
  const k = 2 / (len + 1)
  let prev = series[0]
  out[0] = prev
  for (let i = 1; i < series.length; i++) {
    const v = series[i]
    prev = isFinite(prev) ? prev + k * (v - prev) : v
    out[i] = prev
  }
  return out
}

function rma(series: number[], len: number) {
  const out = new Array(series.length).fill(NaN)
  let avg = series[0]
  out[0] = avg
  const alpha = 1 / len
  for (let i = 1; i < series.length; i++) {
    avg = (avg * (len - 1) + series[i]) / len
    out[i] = avg
  }
  return out
}

function roc(series: number[], len: number) {
  const out = new Array(series.length).fill(NaN)
  for (let i = 0; i < series.length; i++) {
    if (i - len >= 0 && series[i-len] !== 0) {
      out[i] = ((series[i] - series[i-len]) / series[i-len]) * 100
    }
  }
  return out
}

function stdev(series: number[], len: number) {
  const out = new Array(series.length).fill(NaN)
  if (len < 2) return out.map(_ => 1e-10)
  let sum = 0, sumSq = 0
  const q: number[] = []
  for (let i = 0; i < series.length; i++) {
    const v = series[i]
    q.push(v)
    sum += v; sumSq += v*v
    if (q.length > len) {
      const old = q.shift()
      if (old !== undefined) {
        sum -= old; sumSq -= old*old
      }
    }
    if (q.length === len) {
      const mean = sum / len
      const varc = Math.max(0, sumSq/len - mean*mean)
      out[i] = Math.sqrt(varc)
    }
  }
  return out.map(x => isFinite(x) && x > 0 ? x : 1e-10)
}

function rsi(input: number[], len: number) {
  const gains = new Array(input.length).fill(0)
  const losses = new Array(input.length).fill(0)
  for (let i = 1; i < input.length; i++) {
    const ch = input[i] - input[i-1]
    gains[i] = Math.max(0, ch)
    losses[i] = Math.max(0, -ch)
  }
  const avgGain = rma(gains, len)
  const avgLoss = rma(losses, len)
  const out = new Array(input.length).fill(NaN)
  for (let i = 0; i < input.length; i++) {
    const g = avgGain[i], l = avgLoss[i]
    if (l === 0) { out[i] = 100; continue }
    if (!isFinite(g) || !isFinite(l)) continue
    const rs = g / l
    out[i] = 100 - (100 / (1 + rs))
  }
  return out
}

function atr(high: number[], low: number[], close: number[], len: number) {
  const tr = new Array(close.length).fill(NaN)
  for (let i = 0; i < close.length; i++) {
    if (i === 0) { tr[i] = high[i] - low[i]; continue }
    const prevClose = close[i-1]
    const a = high[i] - low[i]
    const b = Math.abs(high[i] - prevClose)
    const c = Math.abs(low[i] - prevClose)
    tr[i] = Math.max(a, b, c)
  }
  return rma(tr, len)
}

function pivotHigh(series: number[], left = 2, right = 2) {
  const out = new Array(series.length).fill(NaN)
  for (let i = left; i < series.length - right; i++) {
    let isPH = true
    for (let l = 1; l <= left; l++) if (series[i] <= series[i - l]) { isPH = false; break }
    for (let r = 1; r <= right && isPH; r++) if (series[i] <= series[i + r]) { isPH = false; break }
    if (isPH) out[i] = series[i]
  }
  return out
}

function pivotLow(series: number[], left = 2, right = 2) {
  const out = new Array(series.length).fill(NaN)
  for (let i = left; i < series.length - right; i++) {
    let isPL = true
    for (let l = 1; l <= left; l++) if (series[i] >= series[i - l]) { isPL = false; break }
    for (let r = 1; r <= right && isPL; r++) if (series[i] >= series[i + r]) { isPL = false; break }
    if (isPL) out[i] = series[i]
  }
  return out
}

// Strategy components
function trendScore(close: number[], len: number) {
  const emaP = ema(close, Math.round(len * 0.5))
  const rocE = roc(emaP, len)
  const rocSm = ema(rocE, Math.round(len * 0.33))
  const zStdev = stdev(rocSm.map(x => (isFinite(x) ? x : 0)), len)
  const out = new Array(close.length).fill(NaN)
  for (let i = 0; i < close.length; i++) {
    const z = (rocSm[i] || 0) / (zStdev[i] || 1e-10)
    const clamped = Math.max(0, Math.min(100, 50 + 10 * z))
    out[i] = clamped
  }
  return out
}

function obosSignals(close: number[], obosLen: number, adaptLen: number) {
  const rocClose = roc(close, obosLen)
  const rsiLen = Math.max(2, Math.round(obosLen * 0.5))
  const momRaw = rsi(rocClose.map(x => (isFinite(x) ? x : 0)), rsiLen)
  const mom = ema(momRaw, Math.max(2, Math.round(obosLen * 0.25)))

  const ph = pivotHigh(mom, 2, 2)
  const pl = pivotLow(mom, 2, 2)

  const upperThr = new Array(close.length).fill(NaN)
  const lowerThr = new Array(close.length).fill(NaN)

  let lastPH = 70.0
  let lastPL = 30.0

  const emaU = { val: undefined as number | undefined, k: 2 / (adaptLen + 1) }
  const emaL = { val: undefined as number | undefined, k: 2 / (adaptLen + 1) }

  for (let i = 0; i < close.length; i++) {
    if (isFinite(ph[i])) lastPH = ph[i] as number
    if (isFinite(pl[i])) lastPL = pl[i] as number
    emaU.val = emaU.val === undefined ? lastPH : emaU.val + emaU.k * (lastPH - emaU.val)
    emaL.val = emaL.val === undefined ? lastPL : emaL.val + emaL.k * (lastPL - emaL.val)
    upperThr[i] = emaU.val
    lowerThr[i] = emaL.val
  }

  const isOB = mom.map((m, i) => m > upperThr[i])
  const isOS = mom.map((m, i) => m < lowerThr[i])

  return { mom, upperThr, lowerThr, isOB, isOS }
}

function rollingCountTrue(boolArr: boolean[], len: number) {
  const out = new Array(boolArr.length).fill(0)
  let count = 0
  const q = []
  for (let i = 0; i < boolArr.length; i++) {
    const v = !!boolArr[i]
    q.push(v)
    if (v) count++
    if (q.length > len) {
      const old = q.shift()
      if (old) count--
    }
    out[i] = count
  }
  return out
}

function alignHTFtoLTF(ltfTimes: number[], htfCandles: any[], trendLen: number) {
  const htfClose = htfCandles.map(c => c.close)
  const htfScore = trendScore(htfClose, trendLen)
  let j = 0
  const out = new Array(ltfTimes.length).fill(NaN)
  for (let i = 0; i < ltfTimes.length; i++) {
    const t = ltfTimes[i]
    while (j + 1 < htfCandles.length && htfCandles[j + 1].time <= t) j++
    out[i] = htfScore[j] ?? NaN
  }
  return out
}

// Export the strategy components for use in backtesting and other APIs
export {
  trendScore,
  obosSignals,
  rollingCountTrue,
  alignHTFtoLTF,
  ema,
  rma,
  roc,
  stdev,
  rsi,
  atr,
  pivotHigh,
  pivotLow,
  pct,
  applyCommission,
  applySlippagePx,
  nowMs,
  days
}
