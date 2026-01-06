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

  // Get user's transactions from vault_transactions (deposits, withdrawals, sends, receives, earned commissions)
  const { data: allTransactions, error: txError } = await (supabase as any)
    .from('vault_transactions')
    .select('id, amount, shares, type, timestamp, email, inviter_id, invited_user_id, invited_portfolio_value, invited_daily_pnl, commission_rate')
    .eq('email', userEmail)
    .in('type', ['DEPOSIT', 'WITHDRAWAL', 'SEND', 'RECEIVE', 'COMMISSION_EARNED'])
    .order('timestamp', { ascending: true })

  if (txError) {
    console.error('Error fetching transactions:', txError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch transactions'
    })
  }

  // Calculate running cash balance (deposits/withdrawals/sends/receives/commissions)
  // This shows the user's deposited amount changes over time
  let cashBalance = 0
  const transactionsWithBalance = allTransactions.map((tx: any) => {
    let description = ''
    let amountDisplay = ''
    let typeDisplay = ''
    let shares = '0'
    let amountChange = 0

    if (tx.type === 'DEPOSIT') {
      amountChange = Number(tx.amount)
      cashBalance += amountChange
      description = 'Deposit'
      amountDisplay = `+$${Number(tx.amount).toLocaleString()}`
      typeDisplay = 'deposit'
      shares = Number(tx.shares).toLocaleString()
    } else if (tx.type === 'WITHDRAWAL') {
      amountChange = -Number(tx.amount)
      cashBalance += amountChange
      description = 'Withdrawal'
      amountDisplay = `-$${Number(tx.amount).toLocaleString()}`
      typeDisplay = 'withdrawal'
      shares = Number(tx.shares).toLocaleString()
    } else if (tx.type === 'SEND') {
      amountChange = -Number(tx.amount)
      cashBalance += amountChange
      description = 'Sent'
      amountDisplay = `-$${Number(tx.amount).toLocaleString()}`
      typeDisplay = 'send'
      shares = Number(tx.shares).toLocaleString()
    } else if (tx.type === 'RECEIVE') {
      amountChange = Number(tx.amount)
      cashBalance += amountChange
      description = 'Received'
      amountDisplay = `+$${Number(tx.amount).toLocaleString()}`
      typeDisplay = 'receive'
      shares = Number(tx.shares).toLocaleString()
    } else if (tx.type === 'COMMISSION_EARNED') {
      amountChange = Number(tx.amount) // Commission earned amount is positive
      cashBalance += amountChange
      description = 'Commission Received'
      amountDisplay = `+$${Math.abs(Number(tx.amount)).toLocaleString()}`
      typeDisplay = 'commission'
      shares = '0'
    } else if (tx.type === 'COMMISSION_PAID') {
      amountChange = Number(tx.amount) // Commission paid amount is negative
      cashBalance += amountChange
      description = 'Commission Paid'
      amountDisplay = `-$${Math.abs(Number(tx.amount)).toLocaleString()}`
      typeDisplay = 'commission'
      shares = '0'
    } else {
      // Unknown transaction type - skip
      description = 'Unknown Transaction'
      amountDisplay = '$0.00'
      typeDisplay = 'unknown'
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
      timestamp: tx.timestamp,
      amountChange // Store for balance recalculation when reversed
    }
  })

  // Reverse for display (newest first)
  // The balances are already calculated correctly in chronological order
  const formattedTransactions = transactionsWithBalance.reverse()

  return {
    transactions: formattedTransactions
  }
})
