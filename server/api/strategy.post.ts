import { H3Event, readBody, setHeaders, setResponseStatus } from 'h3'

// Strategy configuration interface
interface StrategyConfig {
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
const DEFAULT_CONFIG: Required<StrategyConfig> = {
  // Data
  symbol: "BTCUSDT",
  tf: "15m",
  htf: "1d",
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
async function fetchKlines(symbol: string, interval: string, startTimeMs: number, endTimeMs: number, limitPerReq = 1000) {
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

// Main backtest engine
function runBacktest(candles: any[], htfCandles: any[], cfg: Required<StrategyConfig>) {
  const times  = candles.map(c => c.time)
  const open   = candles.map(c => c.open)
  const high   = candles.map(c => c.high)
  const low    = candles.map(c => c.low)
  const close  = candles.map(c => c.close)

  const trend = trendScore(close, cfg.trendLen)
  const upTrend = trend.map(x => x > cfg.upTh)
  const downTrend = trend.map(x => x < cfg.dnTh)

  const htfScore = alignHTFtoLTF(times, htfCandles, cfg.trendLen)
  const htfOKLong = htfScore.map(x => x > cfg.htfLongTh)
  const htfOKShrt = htfScore.map(x => x < cfg.htfShortTh)

  const { isOB, isOS } = obosSignals(close, cfg.obosLen, cfg.adaptLen)

  const osBars = rollingCountTrue(isOS, cfg.winLen)
  const obBars = rollingCountTrue(isOB, cfg.winLen)

  const osCross = osBars.map((v, i) => v >= cfg.needBars && (i > 0 ? osBars[i-1] < cfg.needBars : true))
  const obCross = obBars.map((v, i) => v >= cfg.needBars && (i > 0 ? obBars[i-1] < cfg.needBars : true))

  const atrSeries = atr(high, low, close, cfg.atrLen)

  // State
  let cash = cfg.initialCapital
  let position = 0
  let avgPrice = NaN
  let posBars = 0
  let trailActive = false
  let trailStop = NaN
  let trailHighWater = NaN
  let lastEntryBar = -Infinity
  const trades = []

  const fee = (notional: number) => notional * (cfg.commissionPct / 100)

  function markToMarket(px: number) {
    return cash + position * px
  }

  function enterLong(i: number) {
    const px = applySlippagePx(close[i], cfg.slippagePct, "buy")
    const equity = markToMarket(px)
    const buyNotional = equity * (cfg.posPct / 100)
    if (buyNotional <= 0) return
    const qty = buyNotional / px
    const cost = buyNotional + fee(buyNotional)
    if (cash < cost) return
    cash -= cost

    const newQty = position + qty
    avgPrice = (isFinite(avgPrice) && position !== 0)
      ? (avgPrice * position + px * qty) / newQty
      : px
    position = newQty

    trades.push({ time: times[i], side: "BUY", price: px, qty, note: "entry" })
    lastEntryBar = i
  }

  function exitPortionAtTP(i: number, portionPct: number) {
    if (position <= 0) return
    const targetPx = avgPrice * (1 + cfg.tpPct / 100)
    if (high[i] >= targetPx) {
      const qtyToSell = position * (portionPct / 100)
      const px = applySlippagePx(targetPx, cfg.slippagePct, "sell")
      const proceeds = qtyToSell * px
      cash += applyCommission(proceeds, cfg.commissionPct)
      position -= qtyToSell
      trades.push({ time: times[i], side: "SELL", price: px, qty: qtyToSell, note: `partial TP ${portionPct}%` })
    }
  }

  function applyATRstop(i: number) {
    if (!cfg.useATRstop || position <= 0) return
    const stopPx = close[i] - cfg.atrMult * atrSeries[i]
    if (low[i] <= stopPx) {
      const px = applySlippagePx(stopPx, cfg.slippagePct, "sell")
      const proceeds = position * px
      cash += applyCommission(proceeds, cfg.commissionPct)
      trades.push({ time: times[i], side: "SELL", price: px, qty: position, note: "ATR stop" })
      position = 0; avgPrice = NaN; posBars = 0; trailActive = false; trailStop = NaN; trailHighWater = NaN
    }
  }

  function maybeArmTrail(i: number) {
    if (!cfg.useTrail || trailActive || position <= 0) return
    const pnlPct = pct(close[i], avgPrice)
    if (pnlPct >= cfg.armTrailPct && posBars >= cfg.minHoldBars) {
      trailActive = true
      trailHighWater = close[i]
      trailStop = close[i] * (1 - cfg.trailPct / 100)
      trades.push({ time: times[i], side: "INFO", price: close[i], qty: 0, note: "arm trail" })
    }
  }

  function maintainTrail(i: number) {
    if (!trailActive || position <= 0) return
    if (high[i] > trailHighWater) {
      trailHighWater = high[i]
      trailStop = trailHighWater * (1 - cfg.trailPct / 100)
    }
    if (low[i] <= trailStop) {
      const px = applySlippagePx(trailStop, cfg.slippagePct, "sell")
      const proceeds = position * px
      cash += applyCommission(proceeds, cfg.commissionPct)
      trades.push({ time: times[i], side: "SELL", price: px, qty: position, note: "trailing stop" })
      position = 0; avgPrice = NaN; posBars = 0; trailActive = false; trailStop = NaN; trailHighWater = NaN
    }
  }

  function spacingOK(i: number) {
    return (i - lastEntryBar) >= cfg.minSpacing
  }

  for (let i = 0; i < candles.length; i++) {
    posBars = position !== 0 ? posBars + 1 : 0

    const longGate  = (!cfg.useTrend || upTrend[i]) && (!cfg.useHTF || htfOKLong[i])
    const shortGate = (!cfg.useTrend || downTrend[i]) && (!cfg.useHTF || htfOKShrt[i])

    exitPortionAtTP(i, cfg.tpPortion)
    maybeArmTrail(i)
    maintainTrail(i)
    applyATRstop(i)

    if (osCross[i] && spacingOK(i) && longGate) {
      enterLong(i)
    }

    if (cfg.enableShorts && obCross[i] && spacingOK(i) && shortGate) {
      // Short path - stub for future implementation
    }
  }

  if (position !== 0) {
    const px = close[close.length - 1]
    const proceeds = position * px
    cash += applyCommission(proceeds, cfg.commissionPct)
    trades.push({ time: times[times.length - 1], side: "SELL", price: px, qty: position, note: "EOD flatten" })
    position = 0; avgPrice = NaN; trailActive = false
  }

  const equity = cash
  const retPct = ((equity / cfg.initialCapital) - 1) * 100

  return {
    equity,
    retPct,
    trades,
    lastPrice: close[close.length - 1],
    bars: candles.length,
  }
}

// API handler
export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody<StrategyConfig>(event)

    // Merge with defaults
    const config: Required<StrategyConfig> = { ...DEFAULT_CONFIG, ...body }

    // Validate required fields
    if (!config.symbol || !config.tf) {
      setResponseStatus(event, 400)
      return {
        ok: false,
        error: 'Missing required fields: symbol, tf'
      }
    }

    setResponseStatus(event, 200)

    // Set loading headers
    setHeaders(event, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-cache'
    })

    // Fetch market data
    const end = nowMs()
    const start = end - days(config.lookbackDays)

    const ltfPromise = fetchKlines(config.symbol, config.tf, start, end, config.limitPerReq)
    const htfPromise = fetchKlines(config.symbol, config.htf, start - days(5), end, config.limitPerReq)

    const [ltf, htf] = await Promise.all([ltfPromise, htfPromise])

    if (ltf.length === 0) {
      setResponseStatus(event, 502)
      return { ok: false, error: 'No LTF candles returned from Binance' }
    }

    if (htf.length === 0) {
      setResponseStatus(event, 502)
      return { ok: false, error: 'No HTF candles returned from Binance' }
    }

    // Run backtest
    const result = runBacktest(ltf, htf, config)

    // Format trades for response
    const formattedTrades = result.trades.map(trade => ({
      time: new Date(trade.time).toISOString(),
      side: trade.side,
      price: Number(trade.price).toFixed(6),
      qty: Number(trade.qty).toFixed(8),
      note: trade.note
    }))

    return {
      ok: true,
      config: {
        symbol: config.symbol,
        tf: config.tf,
        htf: config.htf,
        lookbackDays: config.lookbackDays,
        initialCapital: config.initialCapital,
        commissionPct: config.commissionPct,
        slippagePct: config.slippagePct,
        posPct: config.posPct,
        useTrend: config.useTrend,
        useHTF: config.useHTF,
        trendLen: config.trendLen,
        upTh: config.upTh,
        dnTh: config.dnTh,
        htfLongTh: config.htfLongTh,
        htfShortTh: config.htfShortTh,
        obosLen: config.obosLen,
        adaptLen: config.adaptLen,
        winLen: config.winLen,
        needBars: config.needBars,
        minSpacing: config.minSpacing,
        enableShorts: config.enableShorts,
        tpPct: config.tpPct,
        tpPortion: config.tpPortion,
        useTrail: config.useTrail,
        trailPct: config.trailPct,
        armTrailPct: config.armTrailPct,
        minHoldBars: config.minHoldBars,
        useATRstop: config.useATRstop,
        atrLen: config.atrLen,
        atrMult: config.atrMult
      },
      result: {
        equity: result.equity,
        retPct: result.retPct,
        bars: result.bars,
        lastPrice: result.lastPrice,
        tradesCount: result.trades.length
      },
      trades: formattedTrades.slice(-20), // Last 20 trades for brevity
      allTrades: formattedTrades, // Full trade history
      data: {
        ltfCandles: ltf.length,
        htfCandles: htf.length,
        ltfTimeframe: config.tf,
        htfTimeframe: config.htf
      }
    }

  } catch (err: any) {
    setResponseStatus(event, 500)
    return {
      ok: false,
      error: err?.message ?? 'Strategy execution failed'
    }
  }
})
