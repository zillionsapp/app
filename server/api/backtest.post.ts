import { H3Event, readBody, setHeaders, setResponseStatus } from 'h3'
import {
  RTBMomentumBreakoutStrategy,
  fetchKlines,
  applyCommission,
  applySlippagePx,
  nowMs,
  days
} from '../services/strategy'

interface BacktestConfig {
  symbol: string
  tf: string
  lookbackDays: number
  limitPerReq: number
  initialCapital: number
  commissionPct: number
  slippagePct: number
  posPct: number
}

// Backtest execution function that uses the new strategy
async function executeBacktest(config: BacktestConfig) {
  // Fetch market data
  const end = nowMs()
  const start = end - days(config.lookbackDays)

  const ltf = await fetchKlines(config.symbol, config.tf, start, end, config.limitPerReq)

  if (ltf.length === 0) {
    throw new Error('No candles returned from Binance')
  }

  // Create strategy instance
  const strategy = new RTBMomentumBreakoutStrategy()

  // State for backtesting
  let cash = config.initialCapital
  let position = 0 // shares held
  let avgPrice = 0
  const trades: any[] = []

  const fee = (notional: number) => notional * (config.commissionPct / 100)

  function markToMarket(px: number) {
    return cash + position * px
  }

  // Process each bar
  for (let i = 0; i < ltf.length; i++) {
    const bar = ltf[i]
    const signal = strategy.generateSignal(bar.open, bar.high, bar.low, bar.close, bar.volume)

    // Handle signals
    if (typeof signal === 'object' && signal.signal !== 0) {
      const px = signal.signal === 1 ?
        applySlippagePx(bar.close, config.slippagePct, "buy") :
        applySlippagePx(bar.close, config.slippagePct, "sell")

      if (signal.signal === 1 && position <= 0) {
        // Enter long
        const equity = markToMarket(px)
        const buyNotional = equity * (config.posPct / 100)
        if (buyNotional <= 0) continue
        const qty = buyNotional / px
        const cost = buyNotional + fee(buyNotional)
        if (cash < cost) continue
        cash -= cost
        position = qty
        avgPrice = px
        trades.push({ time: bar.time, side: "BUY", price: px, qty, note: "entry" })
      } else if (signal.signal === -1 && position >= 0) {
        // Enter short - for now, just close long positions
        if (position > 0) {
          const proceeds = position * px
          cash += applyCommission(proceeds, config.commissionPct)
          trades.push({ time: bar.time, side: "SELL", price: px, qty: position, note: "exit" })
          position = 0
          avgPrice = 0
        }
      } else if (signal.signal === 0 && position !== 0) {
        // Exit position
        const proceeds = position * px
        cash += applyCommission(proceeds, config.commissionPct)
        trades.push({ time: bar.time, side: "SELL", price: px, qty: position, note: "exit" })
        position = 0
        avgPrice = 0
      }
    }
  }

  // Close any remaining position at the end
  if (position !== 0) {
    const px = ltf[ltf.length - 1].close
    const proceeds = position * px
    cash += applyCommission(proceeds, config.commissionPct)
    trades.push({ time: ltf[ltf.length - 1].time, side: "SELL", price: px, qty: position, note: "EOD flatten" })
    position = 0
  }

  const equity = cash
  const retPct = ((equity / config.initialCapital) - 1) * 100

  return {
    equity,
    retPct,
    trades,
    lastPrice: ltf[ltf.length - 1].close,
    bars: ltf.length,
  }
}

// API handler for backtesting
export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody<any>(event)

    // Create simplified config for the new strategy
    const config: BacktestConfig = {
      symbol: body.symbol || "BTCUSDT",
      tf: body.tf || "15m",
      lookbackDays: body.lookbackDays || 120,
      limitPerReq: body.limitPerReq || 1000,
      initialCapital: body.initialCapital || 1000,
      commissionPct: body.commissionPct || 0.05,
      slippagePct: body.slippagePct || 0,
      posPct: body.posPct || 10
    }

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

    // Run backtest using new strategy
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
        htfCandles: 0, // Not used in new strategy
        ltfTimeframe: config.tf,
        htfTimeframe: null
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
