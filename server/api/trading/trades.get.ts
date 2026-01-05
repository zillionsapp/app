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

  // Format trades for display
  const formattedTrades = (trades || []).map((trade: any) => ({
    id: trade.id,
    status: trade.status,
    strategyName: trade.strategyName || 'MANUAL',
    symbol: trade.symbol,
    timestamp: trade.timestamp,
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
    pnl: trade.pnl,
    pnlPercentage: trade.pnlPercentage
  }))

  return {
    trades: formattedTrades,
    total: count || 0,
    limit,
    offset
  }
})
