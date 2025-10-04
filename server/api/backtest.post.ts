import { H3Event, readBody, setHeaders, setResponseStatus } from 'h3'
import {
  StrategyConfig,
  DEFAULT_CONFIG,
  fetchKlines,
  trendScore,
  obosSignals,
  rollingCountTrue,
  alignHTFtoLTF,
  atr,
  pct,
  applyCommission,
  applySlippagePx,
  nowMs,
  days
} from '../services/strategy'

// Backtest execution function that uses strategy components
async function executeBacktest(config: Required<StrategyConfig>) {
  // Fetch market data
  const end = nowMs()
  const start = end - days(config.lookbackDays)

  const ltfPromise = fetchKlines(config.symbol, config.tf, start, end, config.limitPerReq)
  const htfPromise = fetchKlines(config.symbol, config.htf, start - days(5), end, config.limitPerReq)

  const [ltf, htf] = await Promise.all([ltfPromise, htfPromise])

  if (ltf.length === 0) {
    throw new Error('No LTF candles returned from Binance')
  }

  if (htf.length === 0) {
    throw new Error('No HTF candles returned from Binance')
  }

  // Run backtest logic using strategy components
  const times  = ltf.map(c => c.time)
  const open   = ltf.map(c => c.open)
  const high   = ltf.map(c => c.high)
  const low    = ltf.map(c => c.low)
  const close  = ltf.map(c => c.close)

  const trend = trendScore(close, config.trendLen)
  const upTrend = trend.map(x => x > config.upTh)
  const downTrend = trend.map(x => x < config.dnTh)

  const htfScore = alignHTFtoLTF(times, htf, config.trendLen)
  const htfOKLong = htfScore.map(x => x > config.htfLongTh)
  const htfOKShrt = htfScore.map(x => x < config.htfShortTh)

  const { isOB, isOS } = obosSignals(close, config.obosLen, config.adaptLen)

  const osBars = rollingCountTrue(isOS, config.winLen)
  const obBars = rollingCountTrue(isOB, config.winLen)

  const osCross = osBars.map((v, i) => v >= config.needBars && (i > 0 ? osBars[i-1] < config.needBars : true))
  const obCross = obBars.map((v, i) => v >= config.needBars && (i > 0 ? obBars[i-1] < config.needBars : true))

  const atrSeries = atr(high, low, close, config.atrLen)

  // State
  let cash = config.initialCapital
  let position = 0
  let avgPrice = NaN
  let posBars = 0
  let trailActive = false
  let trailStop = NaN
  let trailHighWater = NaN
  let lastEntryBar = -Infinity
  const trades = []

  const fee = (notional: number) => notional * (config.commissionPct / 100)

  function markToMarket(px: number) {
    return cash + position * px
  }

  function enterLong(i: number) {
    const px = applySlippagePx(close[i], config.slippagePct, "buy")
    const equity = markToMarket(px)
    const buyNotional = equity * (config.posPct / 100)
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
    const targetPx = avgPrice * (1 + config.tpPct / 100)
    if (high[i] >= targetPx) {
      const qtyToSell = position * (portionPct / 100)
      const px = applySlippagePx(targetPx, config.slippagePct, "sell")
      const proceeds = qtyToSell * px
      cash += applyCommission(proceeds, config.commissionPct)
      position -= qtyToSell
      trades.push({ time: times[i], side: "SELL", price: px, qty: qtyToSell, note: `partial TP ${portionPct}%` })
    }
  }

  function applyATRstop(i: number) {
    if (!config.useATRstop || position <= 0) return
    const stopPx = close[i] - config.atrMult * atrSeries[i]
    if (low[i] <= stopPx) {
      const px = applySlippagePx(stopPx, config.slippagePct, "sell")
      const proceeds = position * px
      cash += applyCommission(proceeds, config.commissionPct)
      trades.push({ time: times[i], side: "SELL", price: px, qty: position, note: "ATR stop" })
      position = 0; avgPrice = NaN; posBars = 0; trailActive = false; trailStop = NaN; trailHighWater = NaN
    }
  }

  function maybeArmTrail(i: number) {
    if (!config.useTrail || trailActive || position <= 0) return
    const pnlPct = pct(close[i], avgPrice)
    if (pnlPct >= config.armTrailPct && posBars >= config.minHoldBars) {
      trailActive = true
      trailHighWater = close[i]
      trailStop = close[i] * (1 - config.trailPct / 100)
      trades.push({ time: times[i], side: "INFO", price: close[i], qty: 0, note: "arm trail" })
    }
  }

  function maintainTrail(i: number) {
    if (!trailActive || position <= 0) return
    if (high[i] > trailHighWater) {
      trailHighWater = high[i]
      trailStop = trailHighWater * (1 - config.trailPct / 100)
    }
    if (low[i] <= trailStop) {
      const px = applySlippagePx(trailStop, config.slippagePct, "sell")
      const proceeds = position * px
      cash += applyCommission(proceeds, config.commissionPct)
      trades.push({ time: times[i], side: "SELL", price: px, qty: position, note: "trailing stop" })
      position = 0; avgPrice = NaN; posBars = 0; trailActive = false; trailStop = NaN; trailHighWater = NaN
    }
  }

  function spacingOK(i: number) {
    return (i - lastEntryBar) >= config.minSpacing
  }

  for (let i = 0; i < ltf.length; i++) {
    posBars = position !== 0 ? posBars + 1 : 0

    const longGate  = (!config.useTrend || upTrend[i]) && (!config.useHTF || htfOKLong[i])
    const shortGate = (!config.useTrend || downTrend[i]) && (!config.useHTF || htfOKShrt[i])

    exitPortionAtTP(i, config.tpPortion)
    maybeArmTrail(i)
    maintainTrail(i)
    applyATRstop(i)

    if (osCross[i] && spacingOK(i) && longGate) {
      enterLong(i)
    }

    if (config.enableShorts && obCross[i] && spacingOK(i) && shortGate) {
      // Short path - stub for future implementation
    }
  }

  if (position !== 0) {
    const px = close[close.length - 1]
    const proceeds = position * px
    cash += applyCommission(proceeds, config.commissionPct)
    trades.push({ time: times[times.length - 1], side: "SELL", price: px, qty: position, note: "EOD flatten" })
    position = 0; avgPrice = NaN; trailActive = false
  }

  const equity = cash
  const retPct = ((equity / config.initialCapital) - 1) * 100

  return {
    equity,
    retPct,
    trades,
    lastPrice: close[close.length - 1],
    bars: ltf.length,
  }
}

// API handler for backtesting
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

    // Run backtest using strategy service components
    const result = await executeBacktest(config)

    // Format trades for response
    const formattedTrades = result.trades.map((trade: any) => ({
      time: new Date(trade.time).toISOString(),
      side: trade.side,
      price: Number(trade.price).toFixed(6),
      qty: Number(trade.qty).toFixed(8),
      note: trade.note
    }))

    // Generate price data for charting
    const ltfCandles = await fetchKlines(config.symbol, config.tf,
      Date.now() - days(config.lookbackDays), Date.now(), config.limitPerReq)

    const priceData = ltfCandles
      .filter((_, index) => index % Math.ceil(ltfCandles.length / 100) === 0)
      .map(candle => ({
        time: candle.time,
        price: candle.close
      }))

    return {
      ok: true,
      config,
      result: {
        equity: result.equity,
        retPct: result.retPct,
        bars: result.bars,
        lastPrice: result.lastPrice,
        tradesCount: result.trades.length
      },
      trades: formattedTrades.slice(-20),
      allTrades: formattedTrades,
      priceData: priceData,
      data: {
        ltfCandles: ltfCandles.length,
        htfCandles: await fetchKlines(config.symbol, config.htf,
          Date.now() - days(config.lookbackDays + 5), Date.now(), config.limitPerReq).then(c => c.length),
        ltfTimeframe: config.tf,
        htfTimeframe: config.htf
      }
    }

  } catch (err: any) {
    setResponseStatus(event, 500)
    return {
      ok: false,
      error: err?.message ?? 'Backtest execution failed'
    }
  }
})
