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
    .order('timestamp', { ascending: true })

  if (txError) {
    console.error('Error fetching transactions:', txError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch transactions'
    })
  }



  // Calculate for each transaction in ascending order
  let deposited = 0
  const formattedTransactions = (transactions || []).map((tx: any) => {
    // Update deposited
    if (tx.type === 'DEPOSIT') {
      deposited += Number(tx.amount)
    } else if (tx.type === 'WITHDRAWAL') {
      deposited -= Number(tx.amount)
    }

    let description = ''
    let amountDisplay = ''
    let typeDisplay = ''

    switch (tx.type) {
      case 'DEPOSIT':
        description = 'Deposit'
        amountDisplay = `+$${Number(tx.amount).toLocaleString()}`
        typeDisplay = 'deposit'
        break
      case 'WITHDRAWAL':
        description = 'Withdrawal'
        amountDisplay = `-$${Number(tx.amount).toLocaleString()}`
        typeDisplay = 'withdrawal'
        break
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
      shares: Number(tx.shares).toLocaleString(),
      balance: `$${deposited.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      type: typeDisplay,
      timestamp: tx.timestamp
    }
  }).reverse() // Reverse for display (newest first)

  return {
    transactions: formattedTransactions
  }
})
