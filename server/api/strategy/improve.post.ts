import { H3Event, readBody, setHeaders, setResponseStatus } from 'h3'

// Strategy improvement interfaces
interface StrategyImprovementRequest {
  currentConfig: any
  analysis: any
  trades: any[]
}

interface ParameterChange {
  param: string
  oldValue: number
  newValue: number
  reason: string
}

interface StrategyImprovementResponse {
  parameterChanges: ParameterChange[]
  expectedImprovements: string[]
  reasoning: string[]
}

// Default parameter ranges and step sizes for optimization
const PARAMETER_RANGES = {
  trendLen: { min: 20, max: 60, step: 5 },
  upTh: { min: 50, max: 65, step: 1 },
  dnTh: { min: 35, max: 50, step: 1 },
  htfLongTh: { min: 45, max: 60, step: 1 },
  htfShortTh: { min: 40, max: 55, step: 1 },
  obosLen: { min: 8, max: 20, step: 2 },
  adaptLen: { min: 10, max: 20, step: 2 },
  winLen: { min: 15, max: 30, step: 5 },
  needBars: { min: 2, max: 6, step: 1 },
  minSpacing: { min: 2, max: 8, step: 1 },
  tpPct: { min: 4, max: 15, step: 0.5 },
  tpPortion: { min: 30, max: 80, step: 10 },
  trailPct: { min: 2, max: 8, step: 0.5 },
  armTrailPct: { min: 0.5, max: 2.0, step: 0.1 },
  minHoldBars: { min: 1, max: 5, step: 1 },
  posPct: { min: 5, max: 25, step: 1 }
}

// Generate parameter improvements based on analysis and price pattern analysis
function generateParameterImprovements(currentConfig: any, analysis: any, priceAnalysis?: any): ParameterChange[] {
  const changes: ParameterChange[] = []

  // Win rate improvements
  if (analysis.winRate < 45) {
    // Try to improve win rate by adjusting entry sensitivity
    if (currentConfig.needBars > 3) {
      changes.push({
        param: 'needBars',
        oldValue: currentConfig.needBars,
        newValue: Math.max(2, currentConfig.needBars - 1),
        reason: 'Reducing entry sensitivity to capture more opportunities'
      })
    }

    if (currentConfig.winLen > 20) {
      changes.push({
        param: 'winLen',
        oldValue: currentConfig.winLen,
        newValue: Math.max(15, currentConfig.winLen - 5),
        reason: 'Reducing lookback window for more responsive entries'
      })
    }

    if (currentConfig.upTh > 55) {
      changes.push({
        param: 'upTh',
        oldValue: currentConfig.upTh,
        newValue: currentConfig.upTh - 2,
        reason: 'Lowering trend threshold for more long entries'
      })
    }
  }

  // Price pattern based improvements
  if (priceAnalysis) {
    // If missing many dips, make entry conditions less strict
    if (priceAnalysis.dipAnalysis && priceAnalysis.dipAnalysis.missedOpportunities > 0 && priceAnalysis.dipAnalysis.missedOpportunities > priceAnalysis.totalDips * 0.3) {
      if (currentConfig.needBars > 2) {
        changes.push({
          param: 'needBars',
          oldValue: currentConfig.needBars,
          newValue: currentConfig.needBars - 1,
          reason: `Missing ${priceAnalysis.dipAnalysis.missedOpportunities} significant dips - reducing entry requirements for better dip capture`
        })
      }

      if (currentConfig.winLen > 18) {
        changes.push({
          param: 'winLen',
          oldValue: currentConfig.winLen,
          newValue: Math.max(15, currentConfig.winLen - 3),
          reason: 'Reducing lookback window to be more responsive to dip opportunities'
        })
      }
    }

    // If optimal entry ratio is low, improve entry timing
    if (priceAnalysis.dipAnalysis && priceAnalysis.dipAnalysis.captureRate < 60) {
      if (currentConfig.minSpacing > 2) {
        changes.push({
          param: 'minSpacing',
          oldValue: currentConfig.minSpacing,
          newValue: currentConfig.minSpacing - 1,
          reason: `Only ${priceAnalysis.dipAnalysis.captureRate.toFixed(1)}% dip capture rate - reducing minimum spacing to allow more frequent dip entries`
        })
      }

      if (currentConfig.upTh > 52) {
        changes.push({
          param: 'upTh',
          oldValue: currentConfig.upTh,
          newValue: currentConfig.upTh - 1,
          reason: 'Lowering trend threshold to capture more dip buying opportunities'
        })
      }
    }

    // If dips recover quickly, make entries more responsive
    if (priceAnalysis.dipAnalysis && priceAnalysis.dipAnalysis.avgRecoveryBars < 8 && priceAnalysis.dipAnalysis.avgRecoveryBars > 0) {
      if (currentConfig.needBars > 3) {
        changes.push({
          param: 'needBars',
          oldValue: currentConfig.needBars,
          newValue: currentConfig.needBars - 1,
          reason: `Dips recover quickly (avg ${priceAnalysis.dipAnalysis.avgRecoveryBars.toFixed(1)} bars) - reducing entry delay`
        })
      }

      if (currentConfig.winLen > 20) {
        changes.push({
          param: 'winLen',
          oldValue: currentConfig.winLen,
          newValue: Math.max(15, currentConfig.winLen - 4),
          reason: 'Shortening lookback window for faster response to quick dip recoveries'
        })
      }
    }

    // If strong dip opportunities exist, be more aggressive
    if (priceAnalysis.bestDipDrop > 10) {
      if (currentConfig.posPct < 15) {
        changes.push({
          param: 'posPct',
          oldValue: currentConfig.posPct,
          newValue: Math.min(20, currentConfig.posPct + 2),
          reason: `Strong dip opportunities (${priceAnalysis.bestDipDrop.toFixed(1)}% drops) - increasing position size`
        })
      }

      if (currentConfig.tpPct < 12) {
        changes.push({
          param: 'tpPct',
          oldValue: currentConfig.tpPct,
          newValue: currentConfig.tpPct + 1,
          reason: 'Increasing take profit target to capture full dip recovery potential'
        })
      }
    }

    // If missing peaks, adjust exit parameters
    if (priceAnalysis.missedPeaks > 0 && priceAnalysis.missedPeaks > priceAnalysis.totalPeaks * 0.4) {
      if (currentConfig.trailPct < 6) {
        changes.push({
          param: 'trailPct',
          oldValue: currentConfig.trailPct,
          newValue: currentConfig.trailPct + 0.5,
          reason: `Missing ${priceAnalysis.missedPeaks} significant peaks - tightening trailing stop for better exits`
        })
      }

      if (currentConfig.armTrailPct > 0.8) {
        changes.push({
          param: 'armTrailPct',
          oldValue: currentConfig.armTrailPct,
          newValue: currentConfig.armTrailPct - 0.2,
          reason: 'Lowering trail arming threshold for earlier profit protection'
        })
      }
    }
  }

  // Profit factor improvements
  if (analysis.profitFactor < 1.5) {
    // Improve risk-reward ratio
    if (currentConfig.tpPct < 10) {
      changes.push({
        param: 'tpPct',
        oldValue: currentConfig.tpPct,
        newValue: currentConfig.tpPct + 1.0,
        reason: 'Increasing take profit target for better reward potential'
      })
    }

    if (currentConfig.trailPct > 5) {
      changes.push({
        param: 'trailPct',
        oldValue: currentConfig.trailPct,
        newValue: currentConfig.trailPct - 0.5,
        reason: 'Tightening trailing stop for better risk management'
      })
    }

    if (currentConfig.posPct > 15) {
      changes.push({
        param: 'posPct',
        oldValue: currentConfig.posPct,
        newValue: Math.max(10, currentConfig.posPct - 3),
        reason: 'Reducing position size to improve risk-adjusted returns'
      })
    }
  }

  // Trade frequency optimization
  if (analysis.totalTrades < 8) {
    // Too few trades - make entry conditions less strict
    if (currentConfig.needBars > 2) {
      changes.push({
        param: 'needBars',
        oldValue: currentConfig.needBars,
        newValue: currentConfig.needBars - 1,
        reason: 'Reducing entry requirements to increase trade frequency'
      })
    }

    if (currentConfig.minSpacing > 2) {
      changes.push({
        param: 'minSpacing',
        oldValue: currentConfig.minSpacing,
        newValue: currentConfig.minSpacing - 1,
        reason: 'Reducing minimum spacing between trades'
      })
    }
  } else if (analysis.totalTrades > 40) {
    // Too many trades - make entry conditions more strict
    changes.push({
      param: 'needBars',
      oldValue: currentConfig.needBars,
      newValue: Math.min(6, currentConfig.needBars + 1),
      reason: 'Increasing entry requirements to reduce trade frequency'
    })

    if (currentConfig.winLen < 25) {
      changes.push({
        param: 'winLen',
        oldValue: currentConfig.winLen,
        newValue: currentConfig.winLen + 3,
        reason: 'Increasing lookback window for more selective entries'
      })
    }
  }

  // Trend filter optimization
  if (currentConfig.useTrend && analysis.winRate < 50) {
    if (currentConfig.trendLen > 35) {
      changes.push({
        param: 'trendLen',
        oldValue: currentConfig.trendLen,
        newValue: Math.max(25, currentConfig.trendLen - 5),
        reason: 'Shortening trend length for more responsive trend detection'
      })
    }

    if (currentConfig.upTh > 55) {
      changes.push({
        param: 'upTh',
        oldValue: currentConfig.upTh,
        newValue: currentConfig.upTh - 1,
        reason: 'Lowering uptrend threshold for more long opportunities'
      })
    }
  }

  // HTF filter optimization
  if (currentConfig.useHTF && analysis.profitFactor < 1.3) {
    if (currentConfig.htfLongTh < 55) {
      changes.push({
        param: 'htfLongTh',
        oldValue: currentConfig.htfLongTh,
        newValue: currentConfig.htfLongTh + 2,
        reason: 'Increasing HTF confirmation threshold for better entries'
      })
    }
  }

  // Trailing stop optimization
  if (currentConfig.useTrail && analysis.avgWin < analysis.avgLoss * 1.8) {
    if (currentConfig.armTrailPct < 1.5) {
      changes.push({
        param: 'armTrailPct',
        oldValue: currentConfig.armTrailPct,
        newValue: currentConfig.armTrailPct + 0.2,
        reason: 'Increasing trail arming threshold for better profit protection'
      })
    }

    if (currentConfig.trailPct > 3) {
      changes.push({
        param: 'trailPct',
        oldValue: currentConfig.trailPct,
        newValue: currentConfig.trailPct - 0.3,
        reason: 'Tightening trailing stop for better profit retention'
      })
    }
  }

  return changes
}

// Generate expected improvements based on parameter changes
function generateExpectedImprovements(changes: ParameterChange[], analysis: any): string[] {
  const improvements = []

  const hasWinRateImprovement = changes.some(c =>
    c.param === 'needBars' || c.param === 'winLen' || c.param === 'upTh'
  )

  const hasRiskRewardImprovement = changes.some(c =>
    c.param === 'tpPct' || c.param === 'trailPct' || c.param === 'posPct'
  )

  const hasFrequencyImprovement = changes.some(c =>
    c.param === 'needBars' || c.param === 'minSpacing'
  )

  if (hasWinRateImprovement && analysis.winRate < 50) {
    improvements.push("Expected improvement in win rate due to more responsive entry conditions")
  }

  if (hasRiskRewardImprovement && analysis.profitFactor < 1.5) {
    improvements.push("Expected improvement in profit factor through better risk-reward ratio")
  }

  if (hasFrequencyImprovement && analysis.totalTrades < 8) {
    improvements.push("Expected increase in trade frequency for better capital utilization")
  }

  if (changes.some(c => c.param === 'trailPct' || c.param === 'armTrailPct')) {
    improvements.push("Better profit protection through optimized trailing stop parameters")
  }

  if (changes.some(c => c.param === 'posPct')) {
    improvements.push("Improved risk-adjusted returns through position size optimization")
  }

  if (changes.length === 0) {
    improvements.push("Strategy parameters are already well-optimized for current market conditions")
  }

  return improvements
}

// Generate reasoning for the improvements
function generateReasoning(changes: ParameterChange[], analysis: any): string[] {
  const reasoning = []

  if (analysis.winRate < 45) {
    reasoning.push("Low win rate suggests entry conditions may be too strict or poorly timed")
  }

  if (analysis.profitFactor < 1.5) {
    reasoning.push("Low profit factor indicates risk-reward ratio needs improvement")
  }

  if (analysis.totalTrades < 8) {
    reasoning.push("Low trade frequency suggests capital is underutilized")
  }

  if (analysis.totalTrades > 40) {
    reasoning.push("High trade frequency may indicate overtrading and poor selectivity")
  }

  if (changes.some(c => c.param.includes('Th'))) {
    reasoning.push("Threshold adjustments help balance between accuracy and opportunity capture")
  }

  if (changes.some(c => c.param === 'tpPct' || c.param === 'trailPct')) {
    reasoning.push("Risk management parameters directly impact profit retention and loss limitation")
  }

  return reasoning
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody<StrategyImprovementRequest>(event)

    if (!body.currentConfig || !body.analysis) {
      setResponseStatus(event, 400)
      return {
        ok: false,
        error: 'Current config and analysis data are required'
      }
    }

    setResponseStatus(event, 200)
    setHeaders(event, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-cache'
    })

    // Generate parameter improvements
    const parameterChanges = generateParameterImprovements(body.currentConfig, body.analysis)

    // Generate expected improvements
    const expectedImprovements = generateExpectedImprovements(parameterChanges, body.analysis)

    // Generate reasoning
    const reasoning = generateReasoning(parameterChanges, body.analysis)

    const response: StrategyImprovementResponse = {
      parameterChanges,
      expectedImprovements,
      reasoning
    }

    return {
      ok: true,
      improvements: response
    }

  } catch (err: any) {
    setResponseStatus(event, 500)
    return {
      ok: false,
      error: err?.message ?? 'Strategy improvement generation failed'
    }
  }
})
