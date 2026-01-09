import { serverSupabaseClient } from '#supabase/server'

// Function to resample chart data to uniform intervals
function resampleChartData(chartData: { timestamp: number; equity: number }[], period: string, startDate: Date, endDate: Date) {
  if (!chartData || chartData.length === 0) return []

  // Sort by timestamp
  chartData.sort((a, b) => a.timestamp - b.timestamp)

  // Determine interval based on period (balanced daily for longer periods)
  let intervalMs: number
  switch (period) {
    case '1d':
      intervalMs = 60 * 60 * 1000 // 1 hour
      break
    case '1w':
    case '1m':
    case '1y':
    case 'all':
    default:
      intervalMs = 24 * 60 * 60 * 1000 // 1 day
      break
  }

  // For 'all' period, start from first data point
  const actualStart = period === 'all' ? new Date(chartData[0].timestamp) : startDate

  // Generate target timestamps
  const targets: number[] = []
  let current = actualStart.getTime()
  const end = endDate.getTime()
  while (current <= end) {
    targets.push(current)
    current += intervalMs
  }

  // Ensure the last data point is included if it's after the last target
  const lastTime = chartData[chartData.length - 1].timestamp
  if (lastTime > targets[targets.length - 1]) {
    targets.push(lastTime)
  }

  // Resample: for each target, interpolate equity linearly between data points
  const resampled: { date: string; equity: number }[] = []

  for (const target of targets) {
    let equity: number

    // Find the data points around the target
    if (target <= chartData[0].timestamp) {
      // Before first point, use first equity
      equity = chartData[0].equity
    } else if (target >= chartData[chartData.length - 1].timestamp) {
      // After last point, use last equity
      equity = chartData[chartData.length - 1].equity
    } else {
      // Find the two points to interpolate between
      let i = 0
      while (i < chartData.length - 1 && chartData[i + 1].timestamp <= target) {
        i++
      }
      const prev = chartData[i]
      const next = chartData[i + 1]

      // Linear interpolation
      const timeDiff = next.timestamp - prev.timestamp
      const valueDiff = next.equity - prev.equity
      const targetDiff = target - prev.timestamp
      equity = prev.equity + (valueDiff * targetDiff) / timeDiff
    }

    resampled.push({
      date: new Date(target).toISOString().split('T')[0],
      equity: equity
    })
  }

  return resampled
}

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const userEmail = user.email!
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
      statusMessage: 'Failed to fetch portfolio snapshots'
    })
  }

  // Get all vault transactions
  const { data: allTransactions, error: txError } = await (supabase as any)
    .from('vault_transactions')
    .select('email, shares, type, timestamp')
    .order('timestamp', { ascending: true })

  if (txError) {
    console.error('Error fetching vault transactions:', txError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch vault transactions'
    })
  }

  // Calculate historical equity
  const chartData: { timestamp: number; equity: number }[] = []

  for (const snapshot of snapshots || []) {
    const snapTime = snapshot.timestamp

    // Calculate total shares up to this snapshot time
    let totalShares = 0
    for (const tx of allTransactions || []) {
      if (tx.timestamp <= snapTime) {
        if (tx.type === 'DEPOSIT') {
          totalShares += Number(tx.shares)
        } else if (tx.type === 'WITHDRAWAL') {
          totalShares -= Number(tx.shares)
        }
      }
    }

  // Calculate user's shares up to this snapshot time
  let userShares = 0
  for (const tx of allTransactions || []) {
    if (tx.timestamp <= snapTime && tx.email === userEmail) {
      if (tx.type === 'DEPOSIT') {
        userShares += Number(tx.shares)
      } else if (tx.type === 'WITHDRAWAL') {
        userShares -= Number(tx.shares)
      }
    }
  }

  // Calculate user's equity using the share-based approach for historical consistency
  const currentEquity = Number(snapshot.currentEquity)
  const userEquity = totalShares > 0 ? (userShares / totalShares) * currentEquity : 0

  chartData.push({
    timestamp: snapTime,
    equity: userEquity
  })
  }

  // Add current equity point
  const { data: latestSnapshots, error: snapError2 } = await (supabase as any)
    .from('portfolio_snapshots')
    .select('currentEquity')
    .order('timestamp', { ascending: false })
    .limit(1)

  const { data: vaultStates, error: vaultError } = await (supabase as any)
    .from('vault_state')
    .select('total_shares')
    .limit(1)

  const latestSnapshot = latestSnapshots?.[0]
  const vaultState = vaultStates?.[0]

  if (!snapError2 && !vaultError && latestSnapshot && vaultState) {
    const currentEquity = Number(latestSnapshot.currentEquity)
    const currentTotalShares = Number(vaultState.total_shares)

    // Calculate current user shares
    let currentUserShares = 0
    for (const tx of allTransactions || []) {
      if (tx.email === userEmail) {
        if (tx.type === 'DEPOSIT') {
          currentUserShares += Number(tx.shares)
        } else if (tx.type === 'WITHDRAWAL') {
          currentUserShares -= Number(tx.shares)
        }
      }
    }

    const currentUserEquity = currentTotalShares > 0 ? (currentUserShares / currentTotalShares) * currentEquity : 0

    // Add current point if different
    const lastPoint = chartData[chartData.length - 1]
    const currentTime = Date.now()

    if (!lastPoint || Math.abs(currentUserEquity - lastPoint.equity) > 0.01) {
      chartData.push({
        timestamp: currentTime,
        equity: currentUserEquity
      })
    }
  }

  // Resample data to uniform intervals for balanced x-axis
  const resampledData = resampleChartData(chartData, period, startDate, now)

  return {
    data: resampledData
  }
})
