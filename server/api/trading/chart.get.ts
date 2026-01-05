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

  // Get portfolio snapshots in range
  const { data: snapshots, error: snapError } = await (supabase as any)
    .from('portfolio_snapshots')
    .select('timestamp, currentEquity')
    .gte('timestamp', startDate.getTime())
    .order('timestamp', { ascending: true })

  if (snapError) {
    console.error('Error fetching portfolio snapshots:', snapError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch chart data'
    })
  }

  // Format for chart
  const chartData = (snapshots || []).map((snapshot: any) => ({
    date: new Date(snapshot.timestamp).toISOString().split('T')[0],
    equity: snapshot.currentEquity || 0
  }))

  return {
    data: chartData
  }
})
