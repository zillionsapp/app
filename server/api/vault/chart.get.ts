import { serverSupabaseClient } from '#supabase/server'

// Function to resample snapshots to uniform intervals
function resampleSnapshots(snapshots: any[], period: string, startDate: Date, endDate: Date) {
  if (!snapshots || snapshots.length === 0) return []

  // Sort snapshots by timestamp
  snapshots.sort((a, b) => a.timestamp - b.timestamp)

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

  // For 'all' period, start from first snapshot
  const actualStart = period === 'all' ? new Date(snapshots[0].timestamp) : startDate

  // Generate target timestamps
  const targets: number[] = []
  let current = actualStart.getTime()
  const end = endDate.getTime()
  while (current <= end) {
    targets.push(current)
    current += intervalMs
  }

  // Ensure the last snapshot is included if it's after the last target
  const lastSnapshotTime = snapshots[snapshots.length - 1].timestamp
  if (lastSnapshotTime > targets[targets.length - 1]) {
    targets.push(lastSnapshotTime)
  }

  // Resample: for each target, interpolate equity linearly between snapshots
  const resampled: { date: string; equity: number }[] = []

  for (const target of targets) {
    let equity: number

    // Find the snapshots around the target
    if (target <= snapshots[0].timestamp) {
      // Before first snapshot, use first equity
      equity = snapshots[0].currentEquity || 0
    } else if (target >= snapshots[snapshots.length - 1].timestamp) {
      // After last snapshot, use last equity
      equity = snapshots[snapshots.length - 1].currentEquity || 0
    } else {
      // Find the two snapshots to interpolate between
      let i = 0
      while (i < snapshots.length - 1 && snapshots[i + 1].timestamp <= target) {
        i++
      }
      const prev = snapshots[i]
      const next = snapshots[i + 1]

      // Linear interpolation
      const timeDiff = next.timestamp - prev.timestamp
      const valueDiff = (next.currentEquity || 0) - (prev.currentEquity || 0)
      const targetDiff = target - prev.timestamp
      equity = (prev.currentEquity || 0) + (valueDiff * targetDiff) / timeDiff
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

  // Get current total deposited balance from vault transactions
  const { data: vaultTransactions, error: vaultTxError } = await (supabase as any)
    .from('vault_transactions')
    .select('amount, type, timestamp')
    .order('timestamp', { ascending: true })

  if (vaultTxError) {
    console.error('Error fetching vault transactions:', vaultTxError)
  }

  // Calculate current total deposited
  let currentTotalDeposited = 0
  if (vaultTransactions) {
    currentTotalDeposited = vaultTransactions.reduce((sum: number, tx: any) => {
      if (tx.type === 'DEPOSIT') return sum + Number(tx.amount)
      if (tx.type === 'WITHDRAWAL') return sum - Number(tx.amount)
      if (tx.type === 'COMMISSION_EARNED') return sum + Number(tx.amount)
      if (tx.type === 'COMMISSION_PAID') return sum + Number(tx.amount)
      return sum
    }, 0)
  }

  // Get current open trades to calculate unrealized PnL
  const { data: openTrades, error: tradesError } = await (supabase as any)
    .from('trades')
    .select('*')
    .eq('status', 'OPEN')

  let currentUnrealizedPnL = 0
  if (!tradesError && openTrades?.length > 0) {
    // Get current prices for unrealized PnL calculation
    const symbols = [...new Set(openTrades.map((trade: any) => trade.symbol))]
    if (symbols.length > 0) {
      try {
        const pricesResponse = await $fetch(`/api/prices?symbols=${symbols.join(',')}`)
        const prices = pricesResponse as Record<string, number>

        if (prices) {
          openTrades.forEach((trade: any) => {
            const currentPrice = prices[trade.symbol]
            if (!currentPrice) return

            const entryPrice = Number(trade.price)
            const quantity = Number(trade.quantity)
            const leverage = trade.leverage || 1

            const dollarPnL = trade.side === 'BUY'
              ? (currentPrice - entryPrice) * quantity
              : (entryPrice - currentPrice) * quantity

            currentUnrealizedPnL += dollarPnL
          })
        }
      } catch (pricesError) {
        console.error('Error fetching prices for unrealized PnL:', pricesError)
      }
    }
  }

  // Resample data to uniform intervals for balanced x-axis
  let resampledData = resampleSnapshots(snapshots || [], period, startDate, now)

  // If no data, return empty array
  if (resampledData.length === 0) {
    return { data: [] }
  }

  // Adjust the latest data point for recent vault changes and current unrealized PnL
  if (resampledData.length > 0) {
    // Get the most recent snapshot
    const latestSnapshot = snapshots?.[0]
    if (latestSnapshot) {
      const snapshotInitialBalance = latestSnapshot.initialBalance || 0
      const snapshotUnrealizedPnL = (latestSnapshot.currentEquity || 0) - (latestSnapshot.walletBalance || 0)

      const depositedAdjustment = currentTotalDeposited - snapshotInitialBalance

      // The snapshot's equity includes unrealized PnL from when it was taken
      // We need to replace it with current unrealized PnL
      const unrealizedPnLAdjustment = currentUnrealizedPnL - snapshotUnrealizedPnL

      // Adjust the most recent equity value
      resampledData[resampledData.length - 1].equity += depositedAdjustment + unrealizedPnLAdjustment
    }
  }

  return {
    data: resampledData
  }
})
