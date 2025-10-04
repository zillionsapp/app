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
  priceData?: number[] // Optional price data for dip/peak analysis
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

// Generate insights based on trade analysis and price pattern analysis
function generateInsights(stats: any, config: any, performance: any, priceAnalysis?: any) {
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

  // Price pattern analysis insights
  if (priceAnalysis) {
    if (priceAnalysis.missedDips > 0) {
      insights.push(`${priceAnalysis.missedDips} significant dips were missed - consider more responsive entry parameters`)
    }

    if (priceAnalysis.missedPeaks > 0) {
      insights.push(`${priceAnalysis.missedPeaks} significant peaks were missed - consider adjusting exit parameters`)
    }

    if (priceAnalysis.optimalEntryRatio < 0.7) {
      insights.push(`Entry timing could be improved - only ${Math.round(priceAnalysis.optimalEntryRatio * 100)}% of entries were near optimal dips`)
    }

    if (priceAnalysis.avgDipRecovery > 10) {
      insights.push(`Dips recover quickly (avg ${priceAnalysis.avgDipRecovery.toFixed(1)} bars) - consider faster entry after dip detection`)
    }

    if (priceAnalysis.bestDipDrop > 8) {
      insights.push(`Strong dip opportunities available (up to ${priceAnalysis.bestDipDrop.toFixed(1)}% drops) - strategy could be more aggressive on dip buying`)
    }
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

// Analyze price patterns to find optimal dip and peak opportunities for strategy optimization
function analyzePricePatterns(priceData: number[], trades: any[]) {
  if (!priceData || priceData.length === 0) {
    return null
  }

  // Find ALL significant dips and peaks with various thresholds
  const allDips = findSignificantDips(priceData, 2, 3) // 2% drop, 3 bars minimum spacing
  const allPeaks = findSignificantPeaks(priceData, 2, 3) // 2% rise, 3 bars minimum spacing

  // Find the BEST dips and peaks (largest moves)
  const bestDips = findSignificantDips(priceData, 5, 8) // 5%+ drops for major opportunities
  const bestPeaks = findSignificantPeaks(priceData, 5, 8) // 5%+ rises for major opportunities

  // Calculate buy & hold performance for comparison
  const startPrice = priceData[0]
  const endPrice = priceData[priceData.length - 1]
  const buyAndHoldReturn = ((endPrice - startPrice) / startPrice) * 100

  // Analyze optimal entry points (best dips that were missed or poorly timed)
  const optimalDipEntries = analyzeOptimalEntries(bestDips, priceData, trades)

  // Analyze optimal exit points (best peaks that were missed or poorly timed)
  const optimalPeakExits = analyzeOptimalExits(bestPeaks, priceData, trades)

  // Calculate strategy performance vs optimal
  const strategyVsOptimal = calculateStrategyVsOptimal(trades, optimalDipEntries, optimalPeakExits, priceData)

  // Calculate key metrics for strategy improvement
  const dipAnalysis = calculateDipAnalysis(allDips, priceData, trades)
  const peakAnalysis = calculatePeakAnalysis(allPeaks, priceData, trades)

  return {
    // Market opportunity analysis
    totalDips: allDips.length,
    totalPeaks: allPeaks.length,
    bestDips: bestDips.length,
    bestPeaks: bestPeaks.length,
    buyAndHoldReturn: buyAndHoldReturn,

    // Optimal entry/exit analysis
    optimalDipEntries,
    optimalPeakExits,
    strategyVsOptimal,

    // Strategy improvement metrics
    dipAnalysis,
    peakAnalysis,

    // Key insights for parameter optimization
    keyInsights: generateKeyInsights(optimalDipEntries, optimalPeakExits, dipAnalysis, peakAnalysis, buyAndHoldReturn)
  }
}

// Analyze optimal entry opportunities (best dips)
function analyzeOptimalEntries(bestDips: any[], priceData: number[], trades: any[]) {
  const opportunities: Array<{
    dipIndex: number
    dipPrice: number
    dropPct: number
    wasCaptured: boolean
    entryTiming: 'perfect' | 'good' | 'poor' | 'missed'
    potentialReturn: number
    actualReturn: number
    barsToRecovery: number
  }> = []

  bestDips.forEach(dip => {
    const dipIndex = dip.index
    const dipPrice = dip.price
    const dropPct = dip.dropPct

    // Find if strategy entered near this dip
    let bestEntry = null
    let bestTiming = 'missed'
    let bestReturn = 0

    // Check for entries within +/- 8 bars of the dip
    for (let i = Math.max(0, dipIndex - 8); i < Math.min(priceData.length, dipIndex + 9); i++) {
      const tradeAtBar = trades.find(trade =>
        trade.side === 'BUY' && trade.note === 'entry' &&
        Math.abs(parseFloat(trade.price) - priceData[i]) / priceData[i] < 0.02 // Within 2% of price
      )

      if (tradeAtBar) {
        const entryPrice = parseFloat(tradeAtBar.price)
        const barsFromDip = i - dipIndex

        // Calculate potential return if held to end
        const endPrice = priceData[priceData.length - 1]
        const potentialReturn = ((endPrice - entryPrice) / entryPrice) * 100

        // Determine timing quality
        let timing: 'perfect' | 'good' | 'poor' | 'missed' = 'poor'
        if (Math.abs(barsFromDip) <= 2) timing = 'perfect'
        else if (Math.abs(barsFromDip) <= 5) timing = 'good'

        if (!bestEntry || Math.abs(barsFromDip) < Math.abs(bestEntry.barOffset)) {
          bestEntry = {
            price: entryPrice,
            barOffset: barsFromDip,
            timing,
            potentialReturn
          }
        }
      }
    }

    // Calculate how long it took for price to recover from this dip
    let recoveryBars = 0
    for (let i = dipIndex + 1; i < priceData.length; i++) {
      recoveryBars++
      if (priceData[i] > dipPrice * 1.05) { // 5% recovery
        break
      }
      if (recoveryBars > 30) break // Don't look too far
    }

    opportunities.push({
      dipIndex,
      dipPrice,
      dropPct,
      wasCaptured: !!bestEntry,
      entryTiming: bestEntry?.timing || 'missed',
      potentialReturn: bestEntry?.potentialReturn || 0,
      actualReturn: bestEntry ? ((priceData[priceData.length - 1] - bestEntry.price) / bestEntry.price) * 100 : 0,
      barsToRecovery: recoveryBars
    })
  })

  return opportunities
}

// Analyze optimal exit opportunities (best peaks)
function analyzeOptimalExits(bestPeaks: any[], priceData: number[], trades: any[]) {
  const opportunities: Array<{
    peakIndex: number
    peakPrice: number
    risePct: number
    wasCaptured: boolean
    exitTiming: 'perfect' | 'good' | 'poor' | 'missed'
    potentialReturn: number
    barsFromEntry: number
  }> = []

  bestPeaks.forEach(peak => {
    const peakIndex = peak.index
    const peakPrice = peak.price
    const risePct = peak.risePct

    // Find if strategy exited near this peak
    let bestExit = null
    let bestTiming = 'missed'

    // Check for exits within +/- 5 bars of the peak
    for (let i = Math.max(0, peakIndex - 5); i < Math.min(priceData.length, peakIndex + 6); i++) {
      const tradeAtBar = trades.find(trade =>
        trade.side === 'SELL' &&
        Math.abs(parseFloat(trade.price) - priceData[i]) / priceData[i] < 0.02 // Within 2% of price
      )

      if (tradeAtBar) {
        const exitPrice = parseFloat(tradeAtBar.price)
        const barsFromPeak = i - peakIndex

        // Determine timing quality
        let timing: 'perfect' | 'good' | 'poor' | 'missed' = 'poor'
        if (Math.abs(barsFromPeak) <= 2) timing = 'perfect'
        else if (Math.abs(barsFromPeak) <= 4) timing = 'good'

        bestExit = {
          price: exitPrice,
          barOffset: barsFromPeak,
          timing
        }
      }
    }

    opportunities.push({
      peakIndex,
      peakPrice,
      risePct,
      wasCaptured: !!bestExit,
      exitTiming: bestExit?.timing || 'missed',
      potentialReturn: bestExit ? ((bestExit.price - priceData[0]) / priceData[0]) * 100 : 0,
      barsFromEntry: peakIndex // Bars from start as proxy for holding period
    })
  })

  return opportunities
}

// Calculate strategy performance vs optimal
function calculateStrategyVsOptimal(trades: any[], optimalEntries: any[], optimalExits: any[], priceData: number[]) {
  const startPrice = priceData[0]
  const endPrice = priceData[priceData.length - 1]

  // Calculate actual strategy return
  let strategyReturn = 0
  if (trades.length > 0) {
    // This is a simplified calculation - in reality you'd need full position tracking
    const finalValue = trades.reduce((acc, trade) => {
      if (trade.side === 'BUY') return acc - parseFloat(trade.price) * parseFloat(trade.qty)
      if (trade.side === 'SELL') return acc + parseFloat(trade.price) * parseFloat(trade.qty)
      return acc
    }, 1000) // Starting with $1000

    strategyReturn = ((finalValue - 1000) / 1000) * 100
  }

  // Calculate optimal strategy return (perfect entry at best dips, perfect exit at best peaks)
  const optimalReturn = ((endPrice - startPrice) / startPrice) * 100

  // Calculate efficiency ratio (how much of optimal return was captured)
  const efficiencyRatio = optimalReturn !== 0 ? strategyReturn / optimalReturn : 0

  return {
    strategyReturn,
    optimalReturn,
    efficiencyRatio,
    vsBuyAndHold: strategyReturn - optimalReturn
  }
}

// Calculate comprehensive dip analysis
function calculateDipAnalysis(dips: any[], priceData: number[], trades: any[]) {
  if (dips.length === 0) return { missedOpportunities: 0, avgRecoveryBars: 0, captureRate: 0 }

  let capturedDips = 0
  let totalRecoveryBars = 0
  let validRecoveries = 0

  dips.forEach(dip => {
    const dipIndex = dip.index
    const dipPrice = dip.price

    // Check if captured (entry within 8 bars)
    const captured = trades.some(trade =>
      trade.side === 'BUY' && trade.note === 'entry' &&
      Math.abs(parseFloat(trade.price) - dipPrice) / dipPrice < 0.05 // Within 5% of dip price
    )

    if (captured) capturedDips++

    // Calculate recovery time
    let recoveryBars = 0
    for (let i = dipIndex + 1; i < priceData.length; i++) {
      recoveryBars++
      if (priceData[i] > dipPrice * 1.03) { // 3% recovery
        break
      }
      if (recoveryBars > 25) break
    }

    if (recoveryBars <= 25) {
      totalRecoveryBars += recoveryBars
      validRecoveries++
    }
  })

  return {
    missedOpportunities: dips.length - capturedDips,
    avgRecoveryBars: validRecoveries > 0 ? totalRecoveryBars / validRecoveries : 0,
    captureRate: (capturedDips / dips.length) * 100
  }
}

// Calculate comprehensive peak analysis
function calculatePeakAnalysis(peaks: any[], priceData: number[], trades: any[]) {
  if (peaks.length === 0) return { missedOpportunities: 0, captureRate: 0 }

  let capturedPeaks = 0

  peaks.forEach(peak => {
    const peakIndex = peak.index
    const peakPrice = peak.price

    // Check if captured (exit within 5 bars)
    const captured = trades.some(trade =>
      trade.side === 'SELL' &&
      Math.abs(parseFloat(trade.price) - peakPrice) / peakPrice < 0.05 // Within 5% of peak price
    )

    if (captured) capturedPeaks++
  })

  return {
    missedOpportunities: peaks.length - capturedPeaks,
    captureRate: (capturedPeaks / peaks.length) * 100
  }
}

// Generate key insights for strategy improvement
function generateKeyInsights(optimalEntries: any[], optimalExits: any[], dipAnalysis: any, peakAnalysis: any, buyAndHoldReturn: number) {
  const insights = []

  // Entry timing analysis
  const perfectEntries = optimalEntries.filter(e => e.entryTiming === 'perfect').length
  const goodEntries = optimalEntries.filter(e => e.entryTiming === 'good').length
  const missedEntries = optimalEntries.filter(e => e.entryTiming === 'missed').length

  if (missedEntries > perfectEntries + goodEntries) {
    insights.push(`Missing ${missedEntries} major dip opportunities - strategy needs faster entry response`)
  }

  if (perfectEntries === 0 && optimalEntries.length > 0) {
    insights.push("No perfect dip entries - consider reducing entry sensitivity parameters")
  }

  // Exit timing analysis
  const perfectExits = optimalExits.filter(e => e.exitTiming === 'perfect').length
  const missedExits = optimalExits.filter(e => e.exitTiming === 'missed').length

  if (missedExits > perfectExits) {
    insights.push(`Missing ${missedExits} major peak exits - consider adjusting exit parameters`)
  }

  // Recovery speed insights
  if (dipAnalysis.avgRecoveryBars < 10 && dipAnalysis.avgRecoveryBars > 0) {
    insights.push(`Dips recover quickly (${dipAnalysis.avgRecoveryBars.toFixed(1)} bars avg) - strategy should enter faster`)
  }

  if (dipAnalysis.avgRecoveryBars > 20) {
    insights.push(`Dips recover slowly (${dipAnalysis.avgRecoveryBars.toFixed(1)} bars avg) - strategy can be more patient`)
  }

  // Performance vs buy & hold
  if (buyAndHoldReturn > 0) {
    insights.push(`Buy & hold returned ${buyAndHoldReturn.toFixed(1)}% - strategy should target 1.5x this return`)
  }

  return insights
}

// Helper function to find significant dips in price data
function findSignificantDips(priceData: number[], minDropPct: number, minBarsBetween: number) {
  const dips: Array<{index: number, price: number, dropPct: number}> = []
  let lastDipIndex = -minBarsBetween

  for (let i = 1; i < priceData.length - 1; i++) {
    const current = priceData[i]
    const prev = priceData[i - 1]
    const next = priceData[i + 1]

    // Check if this is a local minimum
    if (current < prev && current < next) {
      // Calculate drop percentage from recent high
      let highIndex = i - 1
      for (let j = i - 1; j >= 0; j--) {
        if (priceData[j] > priceData[highIndex]) {
          highIndex = j
        }
        if (j === 0 || i - j > 20) break // Don't look too far back
      }

      const highPrice = priceData[highIndex]
      const dropPct = ((highPrice - current) / highPrice) * 100

      // Check if drop is significant enough and we're far enough from last dip
      if (dropPct >= minDropPct && i - lastDipIndex >= minBarsBetween) {
        dips.push({
          index: i,
          price: current,
          dropPct: dropPct
        })
        lastDipIndex = i
      }
    }
  }

  return dips
}

// Helper function to find significant peaks in price data
function findSignificantPeaks(priceData: number[], minRisePct: number, minBarsBetween: number) {
  const peaks: Array<{index: number, price: number, risePct: number}> = []
  let lastPeakIndex = -minBarsBetween

  for (let i = 1; i < priceData.length - 1; i++) {
    const current = priceData[i]
    const prev = priceData[i - 1]
    const next = priceData[i + 1]

    // Check if this is a local maximum
    if (current > prev && current > next) {
      // Calculate rise percentage from recent low
      let lowIndex = i - 1
      for (let j = i - 1; j >= 0; j--) {
        if (priceData[j] < priceData[lowIndex]) {
          lowIndex = j
        }
        if (j === 0 || i - j > 20) break // Don't look too far back
      }

      const lowPrice = priceData[lowIndex]
      const risePct = ((current - lowPrice) / lowPrice) * 100

      // Check if rise is significant enough and we're far enough from last peak
      if (risePct >= minRisePct && i - lastPeakIndex >= minBarsBetween) {
        peaks.push({
          index: i,
          price: current,
          risePct: risePct
        })
        lastPeakIndex = i
      }
    }
  }

  return peaks
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

    // Perform price pattern analysis if price data is provided
    let priceAnalysis = null
    if (body.priceData && body.priceData.length > 0) {
      priceAnalysis = analyzePricePatterns(body.priceData, body.trades)
    }

    // Generate insights and recommendations
    const insights = generateInsights({
      ...stats,
      winRate
    }, body.config, body.performance, priceAnalysis)

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
