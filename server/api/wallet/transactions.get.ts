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

  const userEmail = user.email!

  // Get user's vault transactions
  const { data: vaultTransactions, error: txError } = await (supabase as any)
    .from('vault_transactions')
    .select('id, amount, shares, type, timestamp, email')
    .eq('email', userEmail)
    .order('timestamp', { ascending: true })

  if (txError) {
    console.error('Error fetching vault transactions:', txError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch transactions'
    })
  }

  // Get user's commission payments (as referrer)
  const { data: commissionPayments, error: commError } = await (supabase as any)
    .from('commission_snapshots')
    .select('id, commission_earned, snapshot_date, invited_user_id')
    .eq('inviter_id', user.id)
    .order('snapshot_date', { ascending: true })

  if (commError) {
    console.error('Error fetching commission payments:', commError)
    // Don't fail if commission data isn't available
  }



  // Combine vault transactions and commission payments
  const allTransactions = [
    // Vault transactions
    ...(vaultTransactions || []).map((tx: any) => ({
      ...tx,
      transaction_type: 'vault',
      commission_earned: null,
      invited_user_id: null
    })),
    // Commission payments
    ...(commissionPayments || []).map((comm: any) => ({
      id: comm.id,
      amount: comm.commission_earned,
      shares: 0,
      type: 'COMMISSION',
      timestamp: new Date(comm.snapshot_date).getTime(),
      email: userEmail,
      transaction_type: 'commission',
      commission_earned: comm.commission_earned,
      invited_user_id: comm.invited_user_id
    }))
  ].sort((a, b) => a.timestamp - b.timestamp) // Sort by timestamp ascending

  // Calculate for each transaction in ascending order
  let deposited = 0
  const formattedTransactions = allTransactions.map((tx: any) => {
    let description = ''
    let amountDisplay = ''
    let typeDisplay = ''
    let shares = '0'

    if (tx.transaction_type === 'vault') {
      // Update deposited balance for vault transactions
      if (tx.type === 'DEPOSIT') {
        deposited += Number(tx.amount)
        description = 'Deposit'
        amountDisplay = `+$${Number(tx.amount).toLocaleString()}`
        typeDisplay = 'deposit'
        shares = Number(tx.shares).toLocaleString()
      } else if (tx.type === 'WITHDRAWAL') {
        deposited -= Number(tx.amount)
        description = 'Withdrawal'
        amountDisplay = `-$${Number(tx.amount).toLocaleString()}`
        typeDisplay = 'withdrawal'
        shares = Number(tx.shares).toLocaleString()
      }
    } else if (tx.transaction_type === 'commission') {
      // Commission payments don't affect deposited balance
      description = 'Commission Received'
      amountDisplay = `+$${Number(tx.commission_earned).toLocaleString()}`
      typeDisplay = 'commission'
      shares = '0'
    }

    return {
      id: tx.id,
      date: new Date(tx.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: new Date(tx.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      description,
      amount: amountDisplay,
      shares,
      balance: `$${deposited.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      type: typeDisplay,
      timestamp: tx.timestamp
    }
  }).reverse() // Reverse for display (newest first)

  return {
    transactions: formattedTransactions
  }
})
