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

  const userEmail = user.email
  console.log('Wallet summary for user:', userEmail)

  // Get user's vault transactions
  const { data: userTransactions, error: userTxError } = await (supabase as any)
    .from('vault_transactions')
    .select('amount, shares, type, timestamp')
    .eq('email', userEmail!)
    .order('timestamp', { ascending: true })

  // Get ALL vault transactions to calculate total shares over time
  const { data: allTransactions, error: allTxError } = await (supabase as any)
    .from('vault_transactions')
    .select('shares, type, timestamp')
    .order('timestamp', { ascending: true })

  if (userTxError || allTxError) {
    console.error('Error fetching vault transactions:', userTxError || allTxError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch vault transactions'
    })
  }

  // Get current vault state
  const { data: vaultStates, error: vaultError } = await (supabase as any)
    .from('vault_state')
    .select('total_assets, total_shares')
    .limit(1)

  if (vaultError) {
    console.error('Error fetching vault state:', vaultError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch vault state'
    })
  }

  const vaultState = vaultStates?.[0] || { total_assets: 0, total_shares: 0 }
  const vaultAssets = Number(vaultState.total_assets)
  const vaultShares = Number(vaultState.total_shares)

  // Calculate user's current shares from all their transactions
  let currentUserShares = 0
  let totalDeposited = 0

  for (const tx of userTransactions || []) {
    if (tx.type === 'DEPOSIT' || tx.type === 'RECEIVE') {
      totalDeposited += Number(tx.amount)
      currentUserShares += Number(tx.shares)
    } else if (tx.type === 'WITHDRAWAL' || tx.type === 'SEND') {
      totalDeposited -= Number(tx.amount)
      currentUserShares -= Number(tx.shares)
    } else if (tx.type === 'COMMISSION_EARNED') {
      totalDeposited += Number(tx.amount)
    } else if (tx.type === 'COMMISSION_PAID') {
      totalDeposited -= Math.abs(Number(tx.amount))
    }
  }

  console.log('Calculated: totalDeposited =', totalDeposited, 'currentUserShares =', currentUserShares)

  // Calculate user's current equity based on share ownership
  // User's share of vault = user_shares / total_shares
  const userOwnership = vaultShares > 0 ? currentUserShares / vaultShares : 0
  const userEquity = vaultAssets > 0 ? userOwnership * vaultAssets : totalDeposited

  console.log('Vault: assets =', vaultAssets, 'shares =', vaultShares)
  console.log('User: ownership =', userOwnership, 'equity =', userEquity)

  // Get historical snapshots to calculate PnL
  const { data: snapshots, error: snapError } = await (supabase as any)
    .from('portfolio_snapshots')
    .select('id, timestamp, pnl, pnlPercentage, initialBalance, currentEquity, walletBalance')
    .order('timestamp', { ascending: true })

  if (snapError) {
    console.error('Error fetching snapshots:', snapError)
  }

  // Calculate user's realized PnL based on historical ownership
  // PnL is the sum of incremental PnL attributed to user at each snapshot
  let userRealizedPnl = 0
  let userPnlPercentage = 0

  if (snapshots && snapshots.length > 0) {
    // Find the user's first deposit timestamp
    const firstDepositTime = userTransactions?.length > 0 
      ? Number(userTransactions[0].timestamp) 
      : 0

    // For each snapshot, calculate user's ownership at that point in time
    let prevTotalVaultShares = 0
    let prevUserShares = 0
    let prevSnapshotPnl = 0

    for (const snapshot of snapshots) {
      const snapshotTime = Number(snapshot.timestamp)

      // Calculate total vault shares up to this snapshot
      let totalVaultSharesAtSnapshot = 0
      for (const tx of allTransactions || []) {
        if (Number(tx.timestamp) <= snapshotTime) {
          if (tx.type === 'DEPOSIT' || tx.type === 'RECEIVE') {
            totalVaultSharesAtSnapshot += Number(tx.shares)
          } else if (tx.type === 'WITHDRAWAL' || tx.type === 'SEND') {
            totalVaultSharesAtSnapshot -= Number(tx.shares)
          }
        } else {
          break
        }
      }

      // Calculate user's shares up to this snapshot
      let userSharesAtSnapshot = 0
      for (const tx of userTransactions || []) {
        if (Number(tx.timestamp) <= snapshotTime) {
          if (tx.type === 'DEPOSIT' || tx.type === 'RECEIVE') {
            userSharesAtSnapshot += Number(tx.shares)
          } else if (tx.type === 'WITHDRAWAL' || tx.type === 'SEND') {
            userSharesAtSnapshot -= Number(tx.shares)
          }
        } else {
          break
        }
      }

      // Only attribute PnL if user had shares at this point
      if (totalVaultSharesAtSnapshot > 0 && userSharesAtSnapshot > 0) {
        const ownershipAtSnapshot = userSharesAtSnapshot / totalVaultSharesAtSnapshot

        // Get the incremental PnL since last snapshot
        const currentSnapshotPnl = Number(snapshot.pnl) || 0
        const incrementalPnl = currentSnapshotPnl - prevSnapshotPnl

        // Attribute incremental PnL to user based on their ownership at that time
        userRealizedPnl += incrementalPnl * ownershipAtSnapshot
      }

      prevTotalVaultShares = totalVaultSharesAtSnapshot
      prevUserShares = userSharesAtSnapshot
      prevSnapshotPnl = Number(snapshot.pnl) || 0
    }
  }

  // Calculate user's PnL percentage based on their equity vs deposited
  userPnlPercentage = totalDeposited > 0 ? (userRealizedPnl / totalDeposited) * 100 : 0

  console.log('User realized PnL:', userRealizedPnl, 'Percentage:', userPnlPercentage)

  // Calculate unrealized PnL from open trades
  let userUnrealizedPnL = 0
  try {
    const { data: openTrades, error: tradesError } = await (supabase as any)
      .from('trades')
      .select('*')
      .eq('status', 'OPEN')

    if (!tradesError && openTrades?.length > 0) {
      const symbols = [...new Set(openTrades.map((trade: any) => trade.symbol))]
      
      try {
        const pricesResponse = await $fetch(`/api/prices?symbols=${symbols.join(',')}`)
        const prices = pricesResponse as Record<string, number>

        if (prices) {
          openTrades.forEach((trade: any) => {
            const currentPrice = prices[trade.symbol]
            if (!currentPrice) return

            const entryPrice = Number(trade.price)
            const quantity = Number(trade.quantity)

            // Calculate dollar PnL for this trade
            const dollarPnL = trade.side === 'BUY'
              ? (currentPrice - entryPrice) * quantity
              : (entryPrice - currentPrice) * quantity

            // User's share of this trade's PnL based on current ownership
            userUnrealizedPnL += dollarPnL * userOwnership
          })
        }
      } catch (pricesError) {
        console.error('Error fetching prices for unrealized PnL:', pricesError)
      }
    }
  } catch (error) {
    console.error('Error calculating user unrealized PnL:', error)
  }

  // User's current equity including unrealized PnL
  const userCurrentEquity = userEquity + userUnrealizedPnL

  // Available balance = deposited + realized PnL (since realized PnL is now part of user's balance)
  const userBalance = totalDeposited + userRealizedPnl

  console.log('Final: equity =', userEquity, 'currentEquity =', userCurrentEquity, 'balance =', userBalance)
  console.log('Realized PnL:', userRealizedPnl, 'Unrealized PnL:', userUnrealizedPnL)

  return {
    totalDeposited,
    balanceLeft: userBalance,
    totalEquity: userEquity,
    currentEquity: userCurrentEquity,
    pnl: userRealizedPnl,
    pnlPercentage: userPnlPercentage,
    currentShares: currentUserShares,
    marginLocked: 0,
    availableForWithdrawal: userBalance,
    unrealizedPnL: userUnrealizedPnL
  }
})
