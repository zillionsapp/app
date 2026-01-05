import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  // Get latest portfolio snapshot
  const { data: snapshot, error: snapError } = await (supabase as any)
    .from('portfolio_snapshots')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (snapError) {
    console.error('Error fetching portfolio snapshot:', snapError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch portfolio data'
    })
  }

  return {
    currentBalance: snapshot.currentBalance || 0,
    currentEquity: snapshot.currentEquity || 0,
    winRate: snapshot.winRate || 0,
    profitFactor: snapshot.profitFactor || 0,
    totalPnL: snapshot.pnl || 0,
    totalPnLPercentage: snapshot.pnlPercentage || 0,
    openTradesCount: snapshot.openTradesCount || 0,
    totalMarginUsed: snapshot.totalMarginUsed || 0,
    closedTrades: (snapshot.winningTrades || 0) + (snapshot.losingTrades || 0),
    winningTrades: snapshot.winningTrades || 0,
    losingTrades: snapshot.losingTrades || 0,
    initialBalance: snapshot.initialBalance || 0
  }
})
