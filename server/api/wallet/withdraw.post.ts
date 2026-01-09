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

  const body = await readBody(event)
  const { amount } = body

  if (!amount || amount <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid amount'
    })
  }

  const userEmail = user.email!

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

  // Handle case where vault state doesn't exist yet
  const vaultState = vaultStates?.[0]
  if (!vaultState) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No vault state available for withdrawal'
    })
  }

  // Get user's current balance
  const { data: transactions, error: txError } = await (supabase as any)
    .from('vault_transactions')
    .select('amount, shares, type')
    .eq('email', userEmail)

  if (txError) {
    console.error('Error fetching user transactions:', txError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch user transactions'
    })
  }

  // Calculate user's current balance and shares
  let userTotalDeposited = 0
  let userTotalShares = 0

  for (const tx of transactions || []) {
    if (tx.type === 'DEPOSIT') {
      userTotalDeposited += Number(tx.amount)
      userTotalShares += Number(tx.shares)
    } else if (tx.type === 'WITHDRAWAL') {
      userTotalDeposited -= Number(tx.amount)
      userTotalShares -= Number(tx.shares)
    }
  }

  // Calculate user's current equity and available balance
  const currentTotalAssets = Number(vaultState.total_assets)
  const currentTotalShares = Number(vaultState.total_shares)
  const userEquity = currentTotalShares > 0 ? (userTotalShares / currentTotalShares) * currentTotalAssets : 0

  // Get current portfolio snapshot to check available funds
  const { data: snapshots, error: snapError } = await (supabase as any)
    .from('portfolio_snapshots')
    .select('walletBalance, initialBalance')
    .order('timestamp', { ascending: false })
    .limit(1)

  let availableBalance = userEquity // Default to full equity if no snapshot
  if (!snapError && snapshots?.[0]) {
    const snapshot = snapshots[0]
    const walletBalance = Number(snapshot.walletBalance)
    const initialBalance = Number(snapshot.initialBalance)
    // Calculate available balance based on proportional share of available funds
    availableBalance = initialBalance > 0 ? (userTotalDeposited / initialBalance) * walletBalance : 0
    // Ensure available balance doesn't exceed total equity
    availableBalance = Math.min(availableBalance, userEquity)
  }

  if (amount > availableBalance) {
    throw createError({
      statusCode: 400,
      statusMessage: `Insufficient available balance. You have $${availableBalance.toFixed(2)} available for withdrawal (total equity: $${userEquity.toFixed(2)}).`
    })
  }

  // Calculate shares to burn
  const sharePrice = currentTotalShares > 0 ? currentTotalAssets / currentTotalShares : 1
  const sharesToBurn = sharePrice > 0 ? amount / sharePrice : amount

  if (sharesToBurn > userTotalShares) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Insufficient shares for withdrawal'
    })
  }

  // Create withdrawal transaction
  const { error: withdrawError } = await (supabase as any)
    .from('vault_transactions')
    .insert({
      email: userEmail,
      amount: amount,
      shares: sharesToBurn,
      type: 'WITHDRAWAL',
      timestamp: Date.now()
    })

  if (withdrawError) {
    console.error('Error creating withdrawal transaction:', withdrawError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create withdrawal transaction'
    })
  }

  // Update vault state
  const newTotalAssets = currentTotalAssets - amount
  const newTotalShares = currentTotalShares - sharesToBurn

  const { error: updateError } = await (supabase as any)
    .from('vault_state')
    .update({
      total_assets: newTotalAssets,
      total_shares: newTotalShares,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1)

  if (updateError) {
    console.error('Error updating vault state:', updateError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update vault state'
    })
  }

  return {
    success: true,
    message: `Successfully withdrew $${amount.toLocaleString()}`,
    sharesBurned: sharesToBurn
  }
})
