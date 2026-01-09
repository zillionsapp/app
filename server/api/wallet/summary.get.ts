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

  // Get ALL vault transactions to calculate total shares
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

  // Calculate total deposited and current user shares
  let totalDeposited = 0
  let currentUserShares = 0

  for (const tx of userTransactions || []) {
    if (tx.type === 'DEPOSIT' || tx.type === 'RECEIVE') {
      totalDeposited += Number(tx.amount)
      currentUserShares += Number(tx.shares)
    } else if (tx.type === 'WITHDRAWAL' || tx.type === 'SEND') {
      totalDeposited -= Number(tx.amount) // Withdrawals and sends reduce deposited amount
      currentUserShares -= Number(tx.shares)
    } else if (tx.type === 'COMMISSION_EARNED') {
      totalDeposited += Number(tx.amount) // Commission earnings increase deposited amount
    } else if (tx.type === 'COMMISSION_PAID') {
      totalDeposited -= Math.abs(Number(tx.amount)) // Commission payments decrease deposited amount
    }
  }

  console.log('Calculated: totalDeposited =', totalDeposited, 'currentUserShares =', currentUserShares)

  // Get latest portfolio snapshot for trading performance data
  const { data: snapshots, error: snapError } = await (supabase as any)
    .from('portfolio_snapshots')
    .select('currentEquity, walletBalance, currentBalance, initialBalance, totalMarginUsed, pnl, pnlPercentage')
    .order('timestamp', { ascending: false })
    .limit(1)

  // Get current vault state for accurate asset tracking
  const { data: vaultStates, error: vaultError } = await (supabase as any)
    .from('vault_state')
    .select('total_assets, total_shares')
    .limit(1)

  if (snapError || vaultError) {
    console.error('Error fetching data:', snapError || vaultError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch vault data'
    })
  }

  // Handle cases where data might not exist yet
  const snapshot = snapshots?.[0]
  const vaultState = vaultStates?.[0] || { total_assets: 0, total_shares: 0 }

  const currentEquity = snapshot ? Number(snapshot.currentEquity) : 0
  const walletBalance = snapshot ? Number(snapshot.walletBalance) : 0
  const currentBalance = snapshot ? Number(snapshot.currentBalance) : 0
  const initialBalance = snapshot ? Number(snapshot.initialBalance) : 0
  const totalMarginUsed = snapshot ? Number(snapshot.totalMarginUsed) : 0
  const vaultPnl = snapshot ? Number(snapshot.pnl) : 0
  const vaultPnlPercentage = snapshot ? Number(snapshot.pnlPercentage) : 0

  const vaultAssets = Number(vaultState.total_assets)
  const vaultShares = Number(vaultState.total_shares)

  console.log('Portfolio snapshot: currentEquity =', currentEquity, 'walletBalance =', walletBalance, 'currentBalance =', currentBalance, 'initialBalance =', initialBalance, 'vaultPnl =', vaultPnl, 'vaultPnlPercentage =', vaultPnlPercentage)
  console.log('Vault state: totalAssets =', vaultAssets, 'totalShares =', vaultShares)

  // Calculate user's equity using deposit-based approach (most accurate for trading performance)
  // This represents what the user actually owns based on their proportional share of vault performance
  // Use portfolio_snapshot.currentEquity (not vault_state.total_assets) to reflect actual trading PnL
  const userEquity = initialBalance > 0 ? (totalDeposited / initialBalance) * currentEquity : totalDeposited

  // Calculate user's available balance using currentBalance (not walletBalance)
  // currentBalance represents the actual available funds after accounting for margin
  // walletBalance appears to be incorrectly set to currentEquity in the database
  const availableBalance = initialBalance > 0 ? (totalDeposited / initialBalance) * currentBalance : 0

  // Ensure available balance doesn't exceed total equity
  // This prevents the scenario where user balance appears larger than vault balance
  const userBalance = Math.min(availableBalance, userEquity)

  // Calculate PnL using vault's actual PnL (not just equity difference)
  // User's PnL should reflect their proportional share of the vault's trading performance
  const userPnl = initialBalance > 0 ? (totalDeposited / initialBalance) * vaultPnl : 0
  const userPnlPercentage = initialBalance > 0 ? (totalDeposited / initialBalance) * vaultPnlPercentage : 0

  // Calculate user's share of locked margin (for informational purposes)
  const userMarginLocked = initialBalance > 0 ? (totalDeposited / initialBalance) * totalMarginUsed : 0

  // Calculate user's current equity including unrealized PnL
  // Get user's open trades to calculate unrealized PnL
  let userUnrealizedPnL = 0
  try {
    // Fetch open trades for this user
    const { data: openTrades, error: tradesError } = await (supabase as any)
      .from('trades')
      .select('*')
      .eq('status', 'OPEN')

    if (!tradesError && openTrades?.length > 0) {
      // Fetch current prices for unrealized PnL calculations
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
            const leverage = trade.leverage || 1

            // Calculate dollar PnL
            const dollarPnL = trade.side === 'BUY'
              ? (currentPrice - entryPrice) * quantity
              : (entryPrice - currentPrice) * quantity

            // Calculate user's share of this PnL based on their ownership percentage
            const ownershipPercentage = initialBalance > 0 ? totalDeposited / initialBalance : 0
            userUnrealizedPnL += dollarPnL * ownershipPercentage
          })
        }
      } catch (pricesError) {
        console.error('Error fetching prices for unrealized PnL:', pricesError)
        // Continue with zero unrealized PnL if there's an error
      }
    }
  } catch (error) {
    console.error('Error calculating user unrealized PnL:', error)
    // Continue with zero unrealized PnL if there's an error
  }

  // User's current equity = realized equity + unrealized PnL
  const userCurrentEquity = userEquity + userUnrealizedPnL

  console.log('User metrics: userEquity =', userEquity, 'userCurrentEquity =', userCurrentEquity, 'userBalance =', userBalance, 'userPnl =', userPnl, 'userPnlPercentage =', userPnlPercentage, 'userMarginLocked =', userMarginLocked, 'userUnrealizedPnL =', userUnrealizedPnL)

  return {
    totalDeposited,
    balanceLeft: userBalance,
    totalEquity: userEquity, // Keep realized equity for backward compatibility
    currentEquity: userCurrentEquity, // New field: realized + unrealized
    pnl: userPnl,
    pnlPercentage: userPnlPercentage,
    currentShares: currentUserShares,
    marginLocked: userMarginLocked,
    availableForWithdrawal: userBalance,
    unrealizedPnL: userUnrealizedPnL // New field: just the unrealized portion
  }
})
