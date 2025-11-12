import { H3Event, readBody, setHeaders, setResponseStatus } from 'h3'
import { fetchKlines } from '../../services/strategy'

interface ExportOptimalRequest {
  optimalTrades: any
  symbol: string
  tf: string
  lookbackDays: number
  initialCapital: number
  commissionPct: number
}

interface ExportedTrade {
  timestamp: string
  barIndex: number
  type: 'BUY' | 'SELL'
  price: number
  quantity: number
  value: number
  note: string
  // Market context at trade time
  marketData: {
    open: number
    high: number
    low: number
    close: number
    volume: number
  }
  // Performance metrics
  portfolioValue: number
  unrealizedPnL: number
  realizedPnL: number
}

interface StrategyExportData {
  metadata: {
    symbol: string
    timeframe: string
    lookbackDays: number
    initialCapital: number
    commissionPct: number
    exportTimestamp: string
    totalBars: number
  }
  performance: {
    totalReturn: number
    totalReturnPct: number
    finalValue: number
    totalTrades: number
    buyAndHoldReturn: number
    vsBuyAndHold: number
    winRate: number
    avgWin: number
    avgLoss: number
    profitFactor: number
    maxDrawdown: number
  }
  opportunities: {
    totalDips: number
    totalPeaks: number
    bestDips: number
    bestPeaks: number
    capturedDips: number
    capturedPeaks: number
  }
  trades: ExportedTrade[]
  priceHistory: {
    timestamp: string
    barIndex: number
    open: number
    high: number
    low: number
    close: number
    volume: number
    // Additional indicators for strategy development
    indicators: {
      sma20?: number | null
      sma50?: number | null
      rsi14?: number | null
      macd?: number | null
      macdSignal?: number | null
      macdHistogram?: number | null
      bbUpper?: number | null
      bbMiddle?: number | null
      bbLower?: number | null
      atr14?: number | null
    }
  }[]
  strategyInsights: {
    optimalEntryPoints: string[]
    optimalExitPoints: string[]
    marketConditions: string[]
    riskManagement: string[]
    keyPatterns: string[]
  }
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody<ExportOptimalRequest>(event)

    console.log('Export optimal trades request:', {
      hasOptimalTrades: !!body.optimalTrades,
      symbol: body.symbol,
      tf: body.tf,
      lookbackDays: body.lookbackDays
    })

    if (!body.optimalTrades || !body.symbol || !body.tf) {
      setResponseStatus(event, 400)
      return {
        ok: false,
        error: 'Missing required fields: optimalTrades, symbol, tf'
      }
    }

    setResponseStatus(event, 200)
    setHeaders(event, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-cache'
    })

    // Fetch full OHLCV data for the period
    const end = Date.now()
    const start = end - (body.lookbackDays * 24 * 60 * 60 * 1000)
    const candles = await fetchKlines(body.symbol, body.tf, start, end, 1000)

    if (candles.length === 0) {
      throw new Error('No candle data available')
    }

    // Calculate basic indicators for strategy development
    const priceHistory = candles.map((candle, index) => {
      // Simple moving averages
      const sma20 = index >= 19 ? candles.slice(index - 19, index + 1).reduce((sum, c) => sum + c.close, 0) / 20 : null
      const sma50 = index >= 49 ? candles.slice(index - 49, index + 1).reduce((sum, c) => sum + c.close, 0) / 50 : null

      // RSI calculation (simplified)
      let rsi14 = null
      if (index >= 14) {
        const gains = []
        const losses = []
        for (let i = index - 13; i <= index; i++) {
          const change = candles[i].close - candles[i - 1].close
          gains.push(change > 0 ? change : 0)
          losses.push(change < 0 ? Math.abs(change) : 0)
        }
        const avgGain = gains.reduce((sum, g) => sum + g, 0) / 14
        const avgLoss = losses.reduce((sum, l) => sum + l, 0) / 14
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
        rsi14 = 100 - (100 / (1 + rs))
      }

      // ATR calculation (simplified)
      let atr14 = null
      if (index >= 14) {
        const trValues = []
        for (let i = index - 13; i <= index; i++) {
          const high = candles[i].high
          const low = candles[i].low
          const prevClose = i > 0 ? candles[i - 1].close : high
          const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose))
          trValues.push(tr)
        }
        atr14 = trValues.reduce((sum, tr) => sum + tr, 0) / 14
      }

      return {
        timestamp: new Date(candle.time).toISOString(),
        barIndex: index,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        indicators: {
          sma20: sma20 ? Number(sma20.toFixed(6)) : null,
          sma50: sma50 ? Number(sma50.toFixed(6)) : null,
          rsi14: rsi14 ? Number(rsi14.toFixed(2)) : null,
          atr14: atr14 ? Number(atr14.toFixed(6)) : null
        }
      }
    })

    // Convert optimal trades to exported format with full market context
    const exportedTrades: ExportedTrade[] = []
    let portfolioValue = body.initialCapital
    let realizedPnL = 0
    let position = 0
    let entryPrice = 0

    body.optimalTrades.optimalTrades.forEach((trade: any) => {
      // Extract bar index from trade.time (format: "Bar_123")
      const barIndex = parseInt(trade.time.split('_')[1]) || 0
      const candle = candles[barIndex]

      if (!candle) {
        console.warn(`No candle data for bar index ${barIndex}`)
        return
      }

      const tradePrice = trade.price
      const quantity = trade.quantity

      // Calculate P&L for this trade
      let unrealizedPnL = 0
      let tradeRealizedPnL = 0

      if (trade.type === 'BUY') {
        // Buying - update position
        if (position < 0) {
          // Close short position
          tradeRealizedPnL = (entryPrice - tradePrice) * Math.abs(position)
          realizedPnL += tradeRealizedPnL
        }
        position = quantity
        entryPrice = tradePrice
        portfolioValue -= (tradePrice * quantity) * (1 + body.commissionPct / 100)
      } else if (trade.type === 'SELL') {
        // Selling - close position
        if (position > 0) {
          tradeRealizedPnL = (tradePrice - entryPrice) * position
          realizedPnL += tradeRealizedPnL
        }
        position = 0
        entryPrice = 0
        portfolioValue += (tradePrice * quantity) * (1 - body.commissionPct / 100)
      }

      // Calculate unrealized P&L for current position
      if (position !== 0) {
        unrealizedPnL = (candle.close - entryPrice) * position
      }

      exportedTrades.push({
        timestamp: new Date(candle.time).toISOString(),
        barIndex,
        type: trade.type,
        price: trade.price,
        quantity: trade.quantity,
        value: trade.value,
        note: trade.note,
        marketData: {
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume
        },
        portfolioValue: Number(portfolioValue.toFixed(2)),
        unrealizedPnL: Number(unrealizedPnL.toFixed(2)),
        realizedPnL: Number(realizedPnL.toFixed(2))
      })
    })

    // Calculate additional performance metrics
    const performance = body.optimalTrades.performance
    const winningTrades = exportedTrades.filter(t => t.realizedPnL > 0)
    const losingTrades = exportedTrades.filter(t => t.realizedPnL < 0)

    const winRate = exportedTrades.length > 0 ? (winningTrades.length / exportedTrades.length) * 100 : 0
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.realizedPnL, 0) / winningTrades.length : 0
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.realizedPnL, 0) / losingTrades.length) : 0
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 999 : 0

    // Calculate max drawdown (simplified)
    let peak = body.initialCapital
    let maxDrawdown = 0
    exportedTrades.forEach(trade => {
      if (trade.portfolioValue > peak) {
        peak = trade.portfolioValue
      }
      const drawdown = ((peak - trade.portfolioValue) / peak) * 100
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    })

    // Generate strategy insights
    const strategyInsights = {
      optimalEntryPoints: [
        'Buy at significant dips (5%+ drops from recent highs)',
        'Minimum 8 bars spacing between entry points',
        'Use full position size for maximum capital efficiency',
        'Entry timing based on local minima detection'
      ],
      optimalExitPoints: [
        'Sell at significant peaks (5%+ rises from recent lows)',
        'Target next major resistance level after entry',
        'Allow profit taking at optimal peaks',
        'Use trailing stops or time-based exits as backup'
      ],
      marketConditions: [
        'Works best in volatile markets with clear trends',
        'Effective in ranging markets with mean reversion',
        'May underperform in strong unidirectional trends',
        'Requires sufficient liquidity for position sizing'
      ],
      riskManagement: [
        'Position size: 10-20% of capital per trade',
        'Stop loss: Consider 2-3% below entry for risk control',
        'Commission costs factored into position sizing',
        'Regular portfolio rebalancing recommended'
      ],
      keyPatterns: [
        'Dip buying captures oversold conditions',
        'Peak selling captures overbought conditions',
        'Counter-trend strategy in sideways markets',
        'Trend-following elements in strong moves'
      ]
    }

    const exportData: StrategyExportData = {
      metadata: {
        symbol: body.symbol,
        timeframe: body.tf,
        lookbackDays: body.lookbackDays,
        initialCapital: body.initialCapital,
        commissionPct: body.commissionPct,
        exportTimestamp: new Date().toISOString(),
        totalBars: candles.length
      },
      performance: {
        totalReturn: performance.totalReturn,
        totalReturnPct: performance.totalReturnPct,
        finalValue: performance.finalValue,
        totalTrades: performance.totalTrades,
        buyAndHoldReturn: performance.buyAndHoldReturn,
        vsBuyAndHold: performance.vsBuyAndHold,
        winRate,
        avgWin,
        avgLoss,
        profitFactor,
        maxDrawdown
      },
      opportunities: body.optimalTrades.opportunities,
      trades: exportedTrades,
      priceHistory,
      strategyInsights
    }

    console.log('Optimal trades export generated:', {
      tradesCount: exportedTrades.length,
      barsCount: priceHistory.length,
      performance: exportData.performance
    })

    return {
      ok: true,
      exportData
    }

  } catch (err: any) {
    console.error('Optimal trades export error:', err)
    setResponseStatus(event, 500)
    return {
      ok: false,
      error: err?.message ?? 'Optimal trades export failed'
    }
  }
})
