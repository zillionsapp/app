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

  // Get latest portfolio snapshot for current market value (includes trading P&L)
  const { data: snapshot, error: snapError } = await (supabase as any)
    .from('portfolio_snapshots')
    .select('currentEquity, walletBalance, initialBalance')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (snapError) {
    console.error('Error fetching portfolio snapshot:', snapError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch portfolio snapshot'
    })
  }

  const currentEquity = Number((snapshot as any).currentEquity)
  const walletBalance = Number((snapshot as any).walletBalance)
  const initialBalance = Number((snapshot as any).initialBalance)

  console.log('Portfolio snapshot: currentEquity =', currentEquity, 'initialBalance =', initialBalance)

  // Calculate user's proportional equity based on initial investment ratio
  // User gets their proportional share of the current vault value
  const userEquity = initialBalance > 0 ? (totalDeposited / initialBalance) * currentEquity : 0
  const userBalance = initialBalance > 0 ? (totalDeposited / initialBalance) * walletBalance : 0

  // Calculate PnL: current equity - total deposited
  const pnl = userEquity - totalDeposited
  const pnlPercentage = totalDeposited > 0 ? (pnl / totalDeposited) * 100 : 0

  console.log('User metrics: userEquity =', userEquity, 'userBalance =', userBalance, 'pnl =', pnl, 'pnlPercentage =', pnlPercentage)

  return {
    totalDeposited,
    balanceLeft: userBalance,
    totalEquity: userEquity,
    pnl,
    pnlPercentage,
    currentShares: currentUserShares
  }
})
