import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const query = getQuery(event)
  const limit = parseInt(query.limit as string) || 50
  const offset = parseInt(query.offset as string) || 0

  // Get trades with pagination
  const { data: trades, error: tradesError, count } = await (supabase as any)
    .from('trades')
    .select('*', { count: 'exact' })
    .order('timestamp', { ascending: false })
    .range(offset, offset + limit - 1)

  if (tradesError) {
    console.error('Error fetching trades:', tradesError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch trades'
    })
  }

  // Get unique symbols for price fetching
  const symbols = [...new Set((trades || []).map((trade: any) => trade.symbol))]

  // Fetch current prices for unrealized PnL calculation
  let currentPrices: Record<string, number> = {}
  if (symbols.length > 0) {
    try {
      const pricesResponse = await $fetch(`/api/prices?symbols=${symbols.join(',')}`)
      currentPrices = pricesResponse as Record<string, number>
    } catch (error) {
      console.error('Failed to fetch current prices:', error)
    }
  }

  // Calculate PnL for each trade
  const formattedTrades = (trades || []).map((trade: any) => {
    let pnl = 0
    let pnlPercentage = 0

    if (trade.status === 'CLOSED' && trade.exitPrice) {
      // Calculate realized PnL for closed trades
      const entryPrice = trade.price
      const exitPrice = trade.exitPrice
      const quantity = trade.quantity
      const leverage = trade.leverage || 1

      // Calculate dollar PnL
      const dollarPnL = trade.side === 'BUY'
        ? (exitPrice - entryPrice) * quantity
        : (entryPrice - exitPrice) * quantity

      // Calculate percentage PnL (based on margin used)
      const entryValue = entryPrice * quantity
      const margin = entryValue / leverage
      const percentagePnL = margin !== 0 ? (dollarPnL / margin) * 100 : 0

      pnl = dollarPnL
      pnlPercentage = percentagePnL
    } else if (trade.status === 'OPEN' && currentPrices[trade.symbol]) {
      // Calculate unrealized PnL for open trades
      const entryPrice = trade.price
      const currentPrice = currentPrices[trade.symbol]
      const quantity = trade.quantity
      const leverage = trade.leverage || 1

      // Calculate dollar PnL
      const dollarPnL = trade.side === 'BUY'
        ? (currentPrice - entryPrice) * quantity
        : (entryPrice - currentPrice) * quantity

      // Calculate percentage PnL (based on margin used)
      const entryValue = entryPrice * quantity
      const margin = entryValue / leverage
      const percentagePnL = margin !== 0 ? (dollarPnL / margin) * 100 : 0

      pnl = dollarPnL
      pnlPercentage = percentagePnL
    }

    return {
      id: trade.id,
      status: trade.status,
      strategyName: trade.strategyName || 'MANUAL',
      symbol: trade.symbol,
      timestamp: trade.timestamp,
      exitTimestamp: trade.exitTimestamp,
      side: trade.side,
      leverage: trade.leverage || 1,
      price: trade.price,
      exitPrice: trade.exitPrice,
      stopLossPrice: trade.stopLossPrice,
      takeProfitPrice: trade.takeProfitPrice,
      duration: trade.duration,
      exitReason: trade.exitReason,
      quantity: trade.quantity,
      commission: trade.commission,
      pnl: pnl,
      pnlPercentage: pnlPercentage,
      currentPrice: trade.status === 'OPEN' ? currentPrices[trade.symbol] : undefined
    }
  })

  return {
    trades: formattedTrades,
    total: count || 0,
    limit,
    offset
  }
})
