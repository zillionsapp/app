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

// Helper function to calculate trade statistics
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

  let totalWins = 0
  let totalLosses = 0
  let winningTrades = 0
  let losingTrades = 0

  // For this analysis, we'll use a simplified approach
  // In a real implementation, you'd need to track entry/exit pairs
  // For now, we'll analyze based on trade notes and patterns
  trades.forEach(trade => {
    const note = trade.note.toLowerCase()
    if (note.includes('tp') || note.includes('trailing stop')) {
      // This is a winning exit (simplified assumption)
      winningTrades++
      totalWins += parseFloat(trade.price) * parseFloat(trade.qty)
    } else if (note.includes('stop') || note.includes('flatten')) {
      // This is a losing exit (simplified assumption)
      losingTrades++
      totalLosses += parseFloat(trade.price) * parseFloat(trade.qty)
    }
  })

  const avgWin = winningTrades > 0 ? totalWins / winningTrades : 0
  const avgLoss = losingTrades > 0 ? Math.abs(totalLosses / losingTrades) : 0
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : winningTrades > 0 ? 999 : 0

  return {
    totalTrades: trades.length,
    winningTrades,
    losingTrades,
    totalWins,
    totalLosses,
    avgWin,
    avgLoss,
    profitFactor
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

    // Calculate win rate
    const winRate = body.trades.length > 0
      ? (stats.winningTrades / body.trades.length) * 100
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
