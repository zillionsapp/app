import { H3Event, readBody, setHeaders, setResponseStatus } from 'h3'

// Trade analysis interface
interface TradeAnalysisRequest {
  trades: any[]
  config: any
  performance: {
    totalReturn: number
    totalTrades: number
    winRate: number
    finalEquity: number
  }
}

interface TradeAnalysisResponse {
  totalTrades: number
  winRate: number
  avgWin: number
  avgLoss: number
  profitFactor: number
  insights: string[]
  recommendations: string[]
}

// Helper function to calculate round-trip trade statistics (same logic as BacktestResults.vue)
function analyzeTradePerformance(trades: any[]) {
  if (!trades || trades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalWins: 0,
      totalLosses: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0
    }
  }

  // Calculate round-trip trades (same logic as BacktestResults.vue)
  const roundTrips: any[] = []
  let currentPosition: string | null = null
  let entryTrade: any = null
  let totalQuantity = 0
  let totalCost = 0

  for (const trade of trades) {
    if (trade.side === 'BUY' && trade.note === 'entry') {
      // Starting a new position
      if (currentPosition) {
        // Close previous position if exists
        closeCurrentPosition()
      }
      currentPosition = 'long'
      entryTrade = trade
      totalQuantity = parseFloat(trade.qty)
      totalCost = parseFloat(trade.price) * totalQuantity
    } else if (trade.side === 'SELL' && currentPosition === 'long') {
      // Exiting or reducing position
      const sellQuantity = parseFloat(trade.qty)
      const sellValue = parseFloat(trade.price) * sellQuantity

      if (sellQuantity >= totalQuantity) {
        // Full exit
        const pnl = sellValue - (totalCost * (sellQuantity / totalQuantity))
        const pnlPct = (pnl / (totalCost * (sellQuantity / totalQuantity))) * 100

        roundTrips.push({
          entryTime: entryTrade.time,
          exitTime: trade.time,
          duration: calculateDuration(entryTrade.time, trade.time),
          entryPrice: parseFloat(entryTrade.price),
          exitPrice: parseFloat(trade.price),
          quantity: totalQuantity,
          pnl: pnl,
          pnlPct: pnlPct
        })

        currentPosition = null
        entryTrade = null
        totalQuantity = 0
        totalCost = 0
      } else {
        // Partial exit - reduce position
        const exitRatio = sellQuantity / totalQuantity
        const exitCost = totalCost * exitRatio
        const pnl = sellValue - exitCost
        const pnlPct = (pnl / exitCost) * 100

        roundTrips.push({
          entryTime: entryTrade.time,
          exitTime: trade.time,
          duration: calculateDuration(entryTrade.time, trade.time),
          entryPrice: parseFloat(entryTrade.price),
          exitPrice: parseFloat(trade.price),
          quantity: sellQuantity,
          pnl: pnl,
          pnlPct: pnlPct
        })

        // Reduce remaining position
        totalQuantity -= sellQuantity
        totalCost -= exitCost
      }
    }
  }

  // Close any remaining position at EOD
  if (currentPosition && entryTrade) {
    closeCurrentPosition()
  }

  // Calculate statistics from round-trip trades
  let totalWins = 0
  let totalLosses = 0
  let winningTrades = 0
  let losingTrades = 0

  roundTrips.forEach(trade => {
    if (trade.pnl > 0) {
      winningTrades++
      totalWins += trade.pnl
    } else if (trade.pnl < 0) {
      losingTrades++
      totalLosses += Math.abs(trade.pnl)
    }
  })

  const avgWin = winningTrades > 0 ? totalWins / winningTrades : 0
  const avgLoss = losingTrades > 0 ? totalLosses / losingTrades : 0
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : winningTrades > 0 ? 999 : 0

  return {
    totalTrades: roundTrips.length,
    winningTrades,
    losingTrades,
    totalWins,
    totalLosses,
    avgWin,
    avgLoss,
    profitFactor
  }

  function closeCurrentPosition() {
    // Find the last price for EOD close (use the last trade price as fallback)
    const lastPrice = trades.length > 0 ? trades[trades.length - 1].price : entryTrade.price

    const pnl = (parseFloat(lastPrice) * totalQuantity) - totalCost
    const pnlPct = (pnl / totalCost) * 100

    roundTrips.push({
      entryTime: entryTrade.time,
      exitTime: trades[trades.length - 1].time,
      duration: calculateDuration(entryTrade.time, trades[trades.length - 1].time),
      entryPrice: parseFloat(entryTrade.price),
      exitPrice: parseFloat(lastPrice),
      quantity: totalQuantity,
      pnl: pnl,
      pnlPct: pnlPct
    })
  }

  function calculateDuration(entryTime: string, exitTime: string) {
    const entry = new Date(entryTime)
    const exit = new Date(exitTime)
    const diffMs = exit.getTime() - entry.getTime()

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }
}

// Generate insights based on trade analysis
function generateInsights(stats: any, config: any, performance: any) {
  const insights = []

  // Win rate analysis
  if (stats.winRate < 40) {
    insights.push("Win rate is below 40%, indicating the strategy may need significant refinement")
  } else if (stats.winRate > 60) {
    insights.push("Strong win rate above 60%, strategy shows good entry timing")
  }

  // Profit factor analysis
  if (stats.profitFactor < 1.2) {
    insights.push("Profit factor below 1.2 suggests risk management issues")
  } else if (stats.profitFactor > 2.0) {
    insights.push("Excellent profit factor above 2.0, very efficient use of capital")
  }

  // Trade frequency analysis
  if (stats.totalTrades < 10) {
    insights.push("Low trade frequency may indicate overly strict entry conditions")
  } else if (stats.totalTrades > 50) {
    insights.push("High trade frequency suggests entry conditions may be too loose")
  }

  // Return analysis
  if (performance.totalReturn < 0) {
    insights.push("Negative overall return indicates strategy needs fundamental improvements")
  } else if (performance.totalReturn > performance.totalReturn * 0.5) {
    insights.push("Strong positive returns show strategy has profitable edge")
  }

  // Parameter-specific insights
  if (config.useTrend && stats.winRate < 50) {
    insights.push("Trend filter may be too restrictive, consider adjusting trendLen or thresholds")
  }

  if (config.useHTF && stats.profitFactor < 1.5) {
    insights.push("HTF confirmation may be adding too much lag, consider adjusting htfLongTh/htfShortTh")
  }

  if (config.useTrail && stats.avgWin < stats.avgLoss * 1.5) {
    insights.push("Trailing stops may be too tight, consider increasing trailPct or armTrailPct")
  }

  return insights
}

// Generate recommendations
function generateRecommendations(stats: any, config: any) {
  const recommendations = []

  // Risk management recommendations
  if (stats.profitFactor < 1.5) {
    recommendations.push("Focus on improving risk-reward ratio by adjusting take profit and stop loss levels")
  }

  if (stats.winRate < 45) {
    recommendations.push("Improve entry timing by fine-tuning trend and momentum parameters")
  }

  // Parameter optimization suggestions
  if (config.posPct > 20) {
    recommendations.push("Consider reducing position size to improve risk-adjusted returns")
  }

  if (config.tpPct < 5) {
    recommendations.push("Take profit percentage seems conservative, consider increasing for better returns")
  }

  if (config.trailPct > 8) {
    recommendations.push("Trailing stop percentage may be too wide, consider tightening for better risk management")
  }

  // Strategy component recommendations
  if (!config.useTrend && stats.winRate < 50) {
    recommendations.push("Consider enabling trend filter to improve entry timing")
  }

  if (!config.useHTF && stats.profitFactor < 1.3) {
    recommendations.push("Consider enabling HTF confirmation for better market timing")
  }

  return recommendations
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody<TradeAnalysisRequest>(event)

    if (!body.trades || !Array.isArray(body.trades)) {
      setResponseStatus(event, 400)
      return {
        ok: false,
        error: 'Trades data is required'
      }
    }

    setResponseStatus(event, 200)
    setHeaders(event, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-cache'
    })

    // Analyze trade performance
    const stats = analyzeTradePerformance(body.trades)

    // Calculate win rate based on round-trip trades (same as BacktestResults.vue)
    const winRate = stats.totalTrades > 0
      ? (stats.winningTrades / stats.totalTrades) * 100
      : 0

    // Generate insights and recommendations
    const insights = generateInsights({
      ...stats,
      winRate
    }, body.config, body.performance)

    const recommendations = generateRecommendations({
      ...stats,
      winRate
    }, body.config)

    const response: TradeAnalysisResponse = {
      totalTrades: stats.totalTrades,
      winRate: winRate,
      avgWin: stats.avgWin,
      avgLoss: stats.avgLoss,
      profitFactor: stats.profitFactor,
      insights: insights,
      recommendations: recommendations
    }

    return {
      ok: true,
      analysis: response
    }

  } catch (err: any) {
    setResponseStatus(event, 500)
    return {
      ok: false,
      error: err?.message ?? 'Trade analysis failed'
    }
  }
})
