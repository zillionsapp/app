import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const query = getQuery(event)
  const period = query.period as string || '1w'

  // Calculate date range based on period
  const now = new Date()
  let startDate: Date

  switch (period) {
    case '1d':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case '1w':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '1m':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    case 'all':
    default:
      startDate = new Date(0) // Beginning of time
      break
  }

  // Get portfolio snapshots for trading performance
  let snapshots
  if (period === 'all') {
    // For 'all' period, get all snapshots
    const { data, error } = await (supabase as any)
      .from('portfolio_snapshots')
      .select('timestamp, currentEquity, initialBalance')
      .order('timestamp', { ascending: true })
    snapshots = data
    if (error) {
      console.error('Error fetching portfolio snapshots:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch vault chart data'
      })
    }
  } else {
    // For other periods, get snapshots from startDate, but also include the most recent one
    const { data: periodData, error: periodError } = await (supabase as any)
      .from('portfolio_snapshots')
      .select('timestamp, currentEquity, initialBalance')
      .gte('timestamp', startDate.getTime())
      .order('timestamp', { ascending: true })

    const { data: latestData, error: latestError } = await (supabase as any)
      .from('portfolio_snapshots')
      .select('timestamp, currentEquity, initialBalance')
      .order('timestamp', { descending: true })
      .limit(1)

    if (periodError || latestError) {
      console.error('Error fetching portfolio snapshots:', periodError || latestError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch vault chart data'
      })
    }

    // Combine period data with latest snapshot if it's not already included
    const latest = latestData?.[0]
    const periodSnapshots = periodData || []
    const hasLatest = periodSnapshots.some((s: any) => s.timestamp === latest?.timestamp)

    snapshots = hasLatest ? periodSnapshots : [...periodSnapshots, latest].filter(Boolean)
    snapshots.sort((a: any, b: any) => a.timestamp - b.timestamp)
  }

  // Get vault transactions to calculate capital flows
  const { data: transactions, error: txError } = await (supabase as any)
    .from('vault_transactions')
    .select('amount, type, timestamp')
    .order('timestamp', { ascending: true })

  if (txError) {
    console.error('Error fetching vault transactions:', txError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch vault chart data'
    })
  }

  // Format portfolio snapshots for chart
  // The vault's equity is represented by the portfolio's current equity over time
  const chartData = (snapshots || []).map((snapshot: any) => ({
    date: new Date(snapshot.timestamp).toISOString().split('T')[0],
    equity: snapshot.currentEquity || 0
  }))

  // If no snapshots, return empty array
  if (chartData.length === 0) {
    return { data: [] }
  }

  return {
    data: chartData
  }
})
