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
    if (tx.type === 'DEPOSIT') {
      totalDeposited += Number(tx.amount)
      currentUserShares += Number(tx.shares)
    } else if (tx.type === 'WITHDRAWAL') {
      totalDeposited -= Number(tx.amount) // Withdrawals reduce deposited amount
      currentUserShares -= Number(tx.shares)
    }
  }

  // Calculate total vault shares
  let totalVaultShares = 0
  for (const tx of allTransactions || []) {
    if (tx.type === 'DEPOSIT') {
      totalVaultShares += Number(tx.shares)
    } else if (tx.type === 'WITHDRAWAL') {
      totalVaultShares -= Number(tx.shares)
    }
  }

  console.log('Calculated: totalDeposited =', totalDeposited, 'currentUserShares =', currentUserShares, 'totalVaultShares =', totalVaultShares)

  // Get current vault state
  const { data: vaultState, error: vaultError } = await (supabase as any)
    .from('vault_state')
    .select('total_assets, total_shares')
    .single()

  if (vaultError) {
    console.error('Error fetching vault state:', vaultError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch vault state'
    })
  }

  // Get latest portfolio snapshot
  const { data: snapshot, error: snapError } = await (supabase as any)
    .from('portfolio_snapshots')
    .select('currentEquity, walletBalance')
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

  const totalAssets = Number((vaultState as any).total_assets)
  const totalShares = Number((vaultState as any).total_shares)
  const currentEquity = Number((snapshot as any).currentEquity)
  const walletBalance = Number((snapshot as any).walletBalance)

  console.log('Vault state: totalAssets =', totalAssets, 'totalShares =', totalShares)
  console.log('Latest snapshot: currentEquity =', currentEquity, 'walletBalance =', walletBalance)

  // Calculate user's metrics
  const userEquity = totalVaultShares > 0 ? (currentUserShares / totalVaultShares) * currentEquity : 0
  const userBalance = totalVaultShares > 0 ? (currentUserShares / totalVaultShares) * walletBalance : 0

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
