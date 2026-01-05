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

  // Calculate user's current equity
  const currentTotalAssets = Number(vaultState.total_assets)
  const currentTotalShares = Number(vaultState.total_shares)
  const userEquity = currentTotalShares > 0 ? (userTotalShares / currentTotalShares) * currentTotalAssets : 0

  if (amount > userEquity) {
    throw createError({
      statusCode: 400,
      statusMessage: `Insufficient balance. You have $${userEquity.toFixed(2)} available.`
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
