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
  const { amount, recipientEmail } = body

  if (!amount || amount <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid amount'
    })
  }

  if (!recipientEmail || recipientEmail === user.email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid recipient email'
    })
  }

  const senderEmail = user.email!

  // Note: In a production system, you'd validate the recipient exists
  // For paper money demo, we'll skip this validation

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

  // Get sender's current balance
  const { data: senderTransactions, error: senderTxError } = await (supabase as any)
    .from('vault_transactions')
    .select('amount, shares, type')
    .eq('email', senderEmail)

  if (senderTxError) {
    console.error('Error fetching sender transactions:', senderTxError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch sender transactions'
    })
  }

  // Calculate sender's current balance and shares
  let senderTotalShares = 0

  for (const tx of senderTransactions || []) {
    if (tx.type === 'DEPOSIT' || tx.type === 'RECEIVE') {
      senderTotalShares += Number(tx.shares)
    } else if (tx.type === 'WITHDRAWAL' || tx.type === 'SEND') {
      senderTotalShares -= Number(tx.shares)
    }
  }

  // Calculate sender's current equity
  const currentTotalAssets = Number(vaultState.total_assets)
  const currentTotalShares = Number(vaultState.total_shares)
  const senderEquity = currentTotalShares > 0 ? (senderTotalShares / currentTotalShares) * currentTotalAssets : 0

  if (amount > senderEquity) {
    throw createError({
      statusCode: 400,
      statusMessage: `Insufficient balance. You have $${senderEquity.toFixed(2)} available.`
    })
  }

  // Calculate shares to transfer
  const sharePrice = currentTotalShares > 0 ? currentTotalAssets / currentTotalShares : 1
  const sharesToTransfer = sharePrice > 0 ? amount / sharePrice : amount

  if (sharesToTransfer > senderTotalShares) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Insufficient shares for transfer'
    })
  }

  const timestamp = Date.now()

  // Create send transaction for sender
  const { error: senderSendError } = await (supabase as any)
    .from('vault_transactions')
    .insert({
      email: senderEmail,
      amount: amount,
      shares: sharesToTransfer,
      type: 'SEND',
      timestamp: timestamp
    })

  if (senderSendError) {
    console.error('Error creating sender send transaction:', senderSendError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create sender transaction'
    })
  }

  // Create receive transaction for recipient
  const { error: recipientReceiveError } = await (supabase as any)
    .from('vault_transactions')
    .insert({
      email: recipientEmail,
      amount: amount,
      shares: sharesToTransfer,
      type: 'RECEIVE',
      timestamp: timestamp
    })

  if (recipientReceiveError) {
    console.error('Error creating recipient receive transaction:', recipientReceiveError)
    // Note: In a real system, you'd want to rollback the sender transaction
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create recipient transaction'
    })
  }

  // Vault state remains unchanged - total assets and shares stay the same
  // Only ownership changes

  return {
    success: true,
    message: `Successfully sent $${amount.toLocaleString()} to ${recipientEmail}`,
    sharesTransferred: sharesToTransfer
  }
})
