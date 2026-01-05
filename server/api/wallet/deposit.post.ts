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

  // Get current vault state to calculate shares
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

  const currentTotalAssets = Number(vaultState.total_assets)
  const currentTotalShares = Number(vaultState.total_shares)

  // Calculate shares for the deposit amount
  // Share price = total_assets / total_shares
  const sharePrice = currentTotalShares > 0 ? currentTotalAssets / currentTotalShares : 1
  const sharesToIssue = sharePrice > 0 ? amount / sharePrice : amount

  // Create deposit transaction
  const { error: txError } = await (supabase as any)
    .from('vault_transactions')
    .insert({
      email: userEmail,
      amount: amount,
      shares: sharesToIssue,
      type: 'DEPOSIT',
      timestamp: Date.now()
    })

  if (txError) {
    console.error('Error creating deposit transaction:', txError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create deposit transaction'
    })
  }

  // Update vault state
  const newTotalAssets = currentTotalAssets + amount
  const newTotalShares = currentTotalShares + sharesToIssue

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
    message: `Successfully deposited $${amount.toLocaleString()}`,
    sharesIssued: sharesToIssue
  }
})
