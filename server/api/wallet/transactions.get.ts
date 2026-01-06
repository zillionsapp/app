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

  // Get user's commission transactions from vault_transactions
  const { data: commissionTransactions, error: commissionError } = await (supabase as any)
    .from('vault_transactions')
    .select('id, amount, type, timestamp, inviter_id, invited_user_id, invited_portfolio_value, invited_daily_pnl, commission_rate')
    .or(`inviter_id.eq.${user.id},invited_user_id.eq.${user.id}`)
    .in('type', ['COMMISSION_EARNED', 'COMMISSION_PAID'])
    .order('timestamp', { ascending: true })

  if (commissionError) {
    console.error('Error fetching commission transactions:', commissionError)
  }



  // Combine vault transactions and commission transactions
  const allTransactions = [
    // Vault transactions
    ...(vaultTransactions || []).map((tx: any) => ({
      ...tx,
      transaction_type: 'vault',
      commission_earned: null,
      invited_user_id: null
    })),
    // Commission transactions from vault_transactions
    ...(commissionTransactions || []).map((comm: any) => ({
      ...comm,
      transaction_type: comm.type === 'COMMISSION_EARNED' ? 'commission_earned' : 'commission_paid',
      commission_earned: Math.abs(comm.amount),
      email: userEmail
    }))
  ].sort((a, b) => a.timestamp - b.timestamp) // Sort by timestamp ascending

  // Calculate running cash balance (deposits/withdrawals/commissions only)
  // This shows the user's deposited amount changes over time
  let cashBalance = 0
  const transactionsWithBalance = allTransactions.map((tx: any) => {
    let description = ''
    let amountDisplay = ''
    let typeDisplay = ''
    let shares = '0'

    if (tx.transaction_type === 'vault') {
      if (tx.type === 'DEPOSIT') {
        cashBalance += Number(tx.amount)
        description = 'Deposit'
        amountDisplay = `+$${Number(tx.amount).toLocaleString()}`
        typeDisplay = 'deposit'
        shares = Number(tx.shares).toLocaleString()
      } else if (tx.type === 'WITHDRAWAL') {
        cashBalance -= Number(tx.amount)
        description = 'Withdrawal'
        amountDisplay = `-$${Number(tx.amount).toLocaleString()}`
        typeDisplay = 'withdrawal'
        shares = Number(tx.shares).toLocaleString()
      }
    } else if (tx.transaction_type === 'commission_earned') {
      cashBalance += Number(tx.commission_earned)
      description = 'Commission Received'
      amountDisplay = `+$${Number(tx.commission_earned).toLocaleString()}`
      typeDisplay = 'commission'
      shares = '0'
    } else if (tx.transaction_type === 'commission_paid') {
      cashBalance -= Math.abs(Number(tx.commission_earned))
      description = 'Commission Paid'
      amountDisplay = `-$${Math.abs(Number(tx.commission_earned)).toLocaleString()}`
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
      balance: `$${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      type: typeDisplay,
      timestamp: tx.timestamp
    }
  })

  // Reverse for display (newest first)
  const formattedTransactions = transactionsWithBalance.reverse()

  return {
    transactions: formattedTransactions
  }
})
