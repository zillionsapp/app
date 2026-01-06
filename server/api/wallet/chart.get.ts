import { serverSupabaseClient } from '#supabase/server'

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

    // Calculate user's equity
    const currentEquity = Number(snapshot.currentEquity)
    const userEquity = totalShares > 0 ? (userShares / totalShares) * currentEquity : 0

    chartData.push({
      timestamp: snapTime,
      equity: userEquity
    })
  }

  // Add current equity point
  const { data: latestSnapshot, error: snapError2 } = await (supabase as any)
    .from('portfolio_snapshots')
    .select('currentEquity')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  const { data: vaultState, error: vaultError } = await (supabase as any)
    .from('vault_state')
    .select('total_shares')
    .single()

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

  return {
    data: chartData
  }
})
