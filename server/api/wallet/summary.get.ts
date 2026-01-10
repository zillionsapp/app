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

  // First, get closed trades to find the latest exit timestamp for baseline calculation
  let maxTradeTimestamp = 0
  try {
    const { data: closedTradesForMax, error: closedTradesError } = await (supabase as any)
      .from('trades')
      .select('exitTimestamp')
      .eq('status', 'CLOSED')

    if (closedTradesError) {
      console.error('Error fetching closed trades for max timestamp:', closedTradesError)
    } else if (closedTradesForMax) {
      maxTradeTimestamp = closedTradesForMax.length > 0 ? Math.max(...closedTradesForMax.map((t: any) => Number(t.exitTimestamp))) : 0
    }
  } catch (error) {
    console.error('Error fetching closed trades for max timestamp:', error)
  }

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

  // Calculate baseline deposited (capital invested up to the last trade)
  let baselineDeposited = 0
  for (const tx of userTransactions || []) {
    if (Number(tx.timestamp) <= maxTradeTimestamp) {
      if (tx.type === 'DEPOSIT' || tx.type === 'RECEIVE') {
        baselineDeposited += Number(tx.amount)
      } else if (tx.type === 'WITHDRAWAL' || tx.type === 'SEND') {
        baselineDeposited -= Number(tx.amount)
      } else if (tx.type === 'COMMISSION_EARNED') {
        baselineDeposited += Number(tx.amount)
      } else if (tx.type === 'COMMISSION_PAID') {
        baselineDeposited -= Math.abs(Number(tx.amount))
      }
    }
  }

  console.log('Calculated: totalDeposited =', totalDeposited, 'currentUserShares =', currentUserShares)

  // Calculate totalDeposited at the time of the most recent closed trade
  // This ensures new deposits/withdrawals after trading don't affect PnL percentage
  let totalDepositedAtLastTrade = 0

  // Calculate user's current equity based on share ownership
  // User's share of vault = user_shares / total_shares
  const userOwnership = vaultShares > 0 ? currentUserShares / vaultShares : 0
  const userEquity = vaultAssets > 0 ? userOwnership * vaultAssets : totalDeposited

  console.log('Vault: assets =', vaultAssets, 'shares =', vaultShares)
  console.log('User: ownership =', userOwnership, 'equity =', userEquity)

  // Get latest snapshot for margin used
  const { data: latestSnapshot, error: latestSnapError } = await (supabase as any)
    .from('portfolio_snapshots')
    .select('totalMarginUsed')
    .order('timestamp', { ascending: false })
    .limit(1)

  // Get historical snapshots to calculate PnL
  const { data: snapshots, error: snapError } = await (supabase as any)
    .from('portfolio_snapshots')
    .select('id, timestamp, pnl, pnlPercentage, initialBalance, currentEquity, walletBalance')
    .order('timestamp', { ascending: true })

  if (snapError) {
    console.error('Error fetching snapshots:', snapError)
  }

  // Helper function to calculate trade PnL
  const calculateTradePnL = (trade: any) => {
    if (!trade.exitPrice) return 0
    const quantity = Number(trade.quantity)
    const entryPrice = Number(trade.price)
    const exitPrice = Number(trade.exitPrice)
    const entryValue = entryPrice * quantity
    const exitValue = exitPrice * quantity
    if (trade.side === 'BUY') {
      return exitValue - entryValue
    } else {
      return entryValue - exitValue
    }
  }

  // Helper function to calculate ownership at a specific timestamp
  const calculateOwnershipAtTimestamp = (timestamp: number) => {
    // Calculate total vault shares up to this timestamp
    let totalVaultShares = 0
    for (const tx of allTransactions || []) {
      if (Number(tx.timestamp) <= timestamp) {
        if (tx.type === 'DEPOSIT' || tx.type === 'RECEIVE') {
          totalVaultShares += Number(tx.shares)
        } else if (tx.type === 'WITHDRAWAL' || tx.type === 'SEND') {
          totalVaultShares -= Number(tx.shares)
        }
      } else {
        break
      }
    }

    // Calculate user's shares up to this timestamp
    let userShares = 0
    for (const tx of userTransactions || []) {
      if (Number(tx.timestamp) <= timestamp) {
        if (tx.type === 'DEPOSIT' || tx.type === 'RECEIVE') {
          userShares += Number(tx.shares)
        } else if (tx.type === 'WITHDRAWAL' || tx.type === 'SEND') {
          userShares -= Number(tx.shares)
        }
      } else {
        break
      }
    }

    return totalVaultShares > 0 ? userShares / totalVaultShares : 0
  }

  // Calculate user's realized PnL from individual closed trades
  let userRealizedPnl = 0
  let userPnlPercentage = 0
  try {

    // Get only closed trades for PnL calculation (only past trades)
    const currentTime = Date.now()
    const { data: closedTrades, error: tradesError } = await (supabase as any)
      .from('trades')
      .select('*')
      .eq('status', 'CLOSED')
      .lte('exitTimestamp', currentTime)

    if (!tradesError && closedTrades) {
      for (const trade of closedTrades) {
        const tradePnL = calculateTradePnL(trade)
        const ownershipAtClose = calculateOwnershipAtTimestamp(Number(trade.exitTimestamp))
        userRealizedPnl += tradePnL * ownershipAtClose
      }
    } else {
      console.error('Error fetching closed trades:', tradesError)
    }
  } catch (error) {
    console.error('Error calculating user realized PnL from trades:', error)
  }

  // Calculate user's PnL percentage based on capital invested up to the last trade
  userPnlPercentage = baselineDeposited > 0 ? (userRealizedPnl / baselineDeposited) * 100 : 0

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
  const userCurrentEquity = userEquity + userUnrealizedPnL + userRealizedPnl

  // Get vault's total margin used (locked by open positions)
  const vaultMarginUsed = Number(latestSnapshot?.[0]?.totalMarginUsed) || 0
  
  // User's proportional share of locked margin (this money is "at work" in the market)
  const userMarginLocked = vaultMarginUsed * userOwnership

  // Available balance = deposited + realized PnL - user's margin locked
  // The margin locked is being used for open positions, so it can't be withdrawn
  const userBalance = totalDeposited + userRealizedPnl - userMarginLocked

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
    marginLocked: userMarginLocked,
    availableForWithdrawal: userBalance,
    unrealizedPnL: userUnrealizedPnL
  }
})
