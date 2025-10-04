import { H3Event, readBody, setHeaders, setResponseStatus } from 'h3'

// Interface for optimal trades generation request
interface OptimalTradesRequest {
  priceData: number[]
  initialCapital: number
  commissionPct: number
}

interface OptimalTrade {
  type: 'BUY' | 'SELL'
  price: number
  quantity: number
  time: string
  value: number
  note: string
}

interface OptimalTradesResponse {
  optimalTrades: OptimalTrade[]
  performance: {
    totalReturn: number
    totalReturnPct: number
    finalValue: number
    totalTrades: number
    buyAndHoldReturn: number
    vsBuyAndHold: number
  }
  opportunities: {
    totalDips: number
    totalPeaks: number
    bestDips: number
    bestPeaks: number
    capturedDips: number
    capturedPeaks: number
  }
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

// Generate optimal trades by buying at best dips and selling at best peaks
function generateOptimalTrades(priceData: number[], initialCapital: number, commissionPct: number) {
  if (!priceData || priceData.length === 0) {
    return {
      optimalTrades: [],
      performance: {
        totalReturn: 0,
        totalReturnPct: 0,
        finalValue: initialCapital,
        totalTrades: 0,
        buyAndHoldReturn: 0,
        vsBuyAndHold: 0
      },
      opportunities: {
        totalDips: 0,
        totalPeaks: 0,
        bestDips: 0,
        bestPeaks: 0,
        capturedDips: 0,
        capturedPeaks: 0
      }
    }
  }

  // Find all significant dips and peaks
  const allDips = findSignificantDips(priceData, 2, 3) // 2% drop, 3 bars minimum spacing
  const allPeaks = findSignificantPeaks(priceData, 2, 3) // 2% rise, 3 bars minimum spacing

  // Find the BEST dips and peaks (largest moves)
  const bestDips = findSignificantDips(priceData, 5, 8) // 5%+ drops for major opportunities
  const bestPeaks = findSignificantPeaks(priceData, 5, 8) // 5%+ rises for major opportunities

  // Calculate buy & hold performance for comparison
  const startPrice = priceData[0]
  const endPrice = priceData[priceData.length - 1]
  const buyAndHoldReturn = ((endPrice - startPrice) / startPrice) * 100

  // Generate optimal trades
  const optimalTrades: OptimalTrade[] = []
  let currentPosition = 0
  let currentValue = initialCapital
  let entryPrice = 0
  let totalCommissions = 0

  // Strategy: Buy at best dips, sell at best peaks
  bestDips.forEach((dip, index) => {
    const dipPrice = dip.price
    const dipIndex = dip.index

    // Find the next peak to sell at
    const nextPeak = bestPeaks.find(peak => peak.index > dipIndex)

    if (nextPeak) {
      const peakPrice = nextPeak.price
      const peakIndex = nextPeak.index

      // Calculate position size (use all available capital)
      const quantity = currentValue / dipPrice
      const commission = (quantity * dipPrice) * (commissionPct / 100)
      totalCommissions += commission

      // Buy at dip
      optimalTrades.push({
        type: 'BUY',
        price: dipPrice,
        quantity: quantity,
        time: `Bar_${dipIndex}`,
        value: quantity * dipPrice,
        note: `Optimal dip entry (${dip.dropPct.toFixed(1)}% drop)`
      })

      currentPosition = quantity
      entryPrice = dipPrice
      currentValue -= commission

      // Sell at next peak
      const sellCommission = (currentPosition * peakPrice) * (commissionPct / 100)
      totalCommissions += sellCommission

      optimalTrades.push({
        type: 'SELL',
        price: peakPrice,
        quantity: currentPosition,
        time: `Bar_${peakIndex}`,
        value: currentPosition * peakPrice,
        note: `Optimal peak exit (${nextPeak.risePct.toFixed(1)}% rise)`
      })

      // Calculate P&L
      const tradeReturn = (peakPrice - dipPrice) * currentPosition
      currentValue += tradeReturn - sellCommission
      currentPosition = 0
    }
  })

  // If still holding position at end, sell at final price
  if (currentPosition > 0) {
    const finalPrice = endPrice
    const sellCommission = (currentPosition * finalPrice) * (commissionPct / 100)
    totalCommissions += sellCommission

    optimalTrades.push({
      type: 'SELL',
      price: finalPrice,
      quantity: currentPosition,
      time: `Bar_${priceData.length - 1}`,
      value: currentPosition * finalPrice,
      note: 'Final exit at EOD'
    })

    const finalReturn = (finalPrice - entryPrice) * currentPosition
    currentValue += finalReturn - sellCommission
  }

  // Calculate performance metrics
  const totalReturn = currentValue - initialCapital
  const totalReturnPct = (totalReturn / initialCapital) * 100

  return {
    optimalTrades,
    performance: {
      totalReturn,
      totalReturnPct,
      finalValue: currentValue,
      totalTrades: optimalTrades.length,
      buyAndHoldReturn,
      vsBuyAndHold: totalReturnPct - buyAndHoldReturn
    },
    opportunities: {
      totalDips: allDips.length,
      totalPeaks: allPeaks.length,
      bestDips: bestDips.length,
      bestPeaks: bestPeaks.length,
      capturedDips: bestDips.length, // We capture all best dips
      capturedPeaks: Math.min(bestPeaks.length, bestDips.length) // We capture peaks that have corresponding dips
    }
  }
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody<OptimalTradesRequest>(event)

    console.log('Generate optimal trades request:', {
      hasPriceData: !!body.priceData,
      priceDataLength: body.priceData?.length || 0,
      initialCapital: body.initialCapital,
      commissionPct: body.commissionPct
    })

    if (!body.priceData || !Array.isArray(body.priceData) || body.priceData.length === 0) {
      setResponseStatus(event, 400)
      return {
        ok: false,
        error: 'Price data is required'
      }
    }

    setResponseStatus(event, 200)
    setHeaders(event, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-cache'
    })

    // Generate optimal trades
    const result = generateOptimalTrades(
      body.priceData,
      body.initialCapital || 1000,
      body.commissionPct || 0.05
    )

    console.log('Optimal trades generated:', {
      tradesCount: result.optimalTrades.length,
      performance: result.performance,
      opportunities: result.opportunities
    })

    return {
      ok: true,
      optimalTrades: result
    }

  } catch (err: any) {
    console.error('Optimal trades generation error:', err)
    setResponseStatus(event, 500)
    return {
      ok: false,
      error: err?.message ?? 'Optimal trades generation failed'
    }
  }
})
