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

  // Get user's transactions
  const { data: transactions, error: txError } = await (supabase as any)
    .from('vault_transactions')
    .select('id, amount, shares, type, timestamp, email')
    .eq('email', userEmail)
    .order('timestamp', { ascending: false })

  if (txError) {
    console.error('Error fetching transactions:', txError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch transactions'
    })
  }

  // Calculate running balance
  let runningBalance = 0
  const formattedTransactions = (transactions || []).map((tx: any) => {
    let description = ''
    let amountDisplay = ''
    let typeDisplay = ''
    let balanceChange = 0

    switch (tx.type) {
      case 'DEPOSIT':
        if (tx.email === userEmail) {
          description = 'Deposit'
          amountDisplay = `+$${Number(tx.amount).toLocaleString()}`
          typeDisplay = 'deposit'
          balanceChange = Number(tx.amount)
        } else {
          // This shouldn't happen for deposits, but just in case
          description = 'Received'
          amountDisplay = `+$${Number(tx.amount).toLocaleString()}`
          typeDisplay = 'received'
          balanceChange = Number(tx.amount)
        }
        break
      case 'WITHDRAWAL':
        if (tx.email === userEmail) {
          description = 'Withdrawal'
          amountDisplay = `-$${Number(tx.amount).toLocaleString()}`
          typeDisplay = 'withdrawal'
          balanceChange = -Number(tx.amount)
        } else {
          // This shouldn't happen for withdrawals, but just in case
          description = 'Sent'
          amountDisplay = `-$${Number(tx.amount).toLocaleString()}`
          typeDisplay = 'sent'
          balanceChange = -Number(tx.amount)
        }
        break
    }

    // Update running balance
    runningBalance += balanceChange

    return {
      id: tx.id,
      date: new Date(tx.timestamp).toLocaleDateString(),
      time: new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description,
      amount: amountDisplay,
      shares: Number(tx.shares).toLocaleString(),
      balance: `$${runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      type: typeDisplay,
      timestamp: tx.timestamp
    }
  })

  return {
    transactions: formattedTransactions
  }
})
