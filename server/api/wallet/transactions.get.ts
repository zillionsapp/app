import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const query = getQuery(event)

  // Get pagination parameters
  const limit = Math.min(parseInt(query.limit as string) || 50, 100) // Max 100 per page
  const offset = parseInt(query.offset as string) || 0

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const userEmail = user.email!

  // 1. Get Current Wallet Balance (Starting point for reverse calc)
  let currentBalance = 0
  const { data: snapshot } = await (supabase as any)
    .from('portfolio_snapshots')
    .select('currentBalance, timestamp')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (snapshot) {
    currentBalance = snapshot.currentBalance || 0
  }

  // 2. Get user's recent transactions (DESCENDING)
  const { data: allTransactions, error: txError } = await (supabase as any)
    .from('vault_transactions')
    .select('id, amount, shares, type, timestamp, email, inviter_id, invited_user_id, invited_portfolio_value, invited_daily_pnl, commission_rate')
    .eq('email', userEmail)
    .in('type', ['DEPOSIT', 'WITHDRAWAL', 'SEND', 'RECEIVE', 'COMMISSION_EARNED', 'COMMISSION_PAID'])
    .order('timestamp', { ascending: false }) // NEWEST FIRST
    .limit(1000)

  if (txError) {
    console.error('Error fetching transactions:', txError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch transactions'
    })
  }

  // 3. Get recent trades (DESCENDING) - Standard Client (User says RLS is fine)
  // Ensure we don't request 'pnl' column
  const { data: userTrades, error: tradesError } = await (supabase as any)
    .from('trades')
    .select('id, symbol, side, price, quantity, timestamp, status, exitPrice, exitTimestamp') // No pnl
    .order('timestamp', { ascending: false }) // NEWEST FIRST
    .limit(1000)

  if (tradesError) {
    console.error('Error fetching trades:', tradesError)
  }

  // 4. Combine and Sort (NEWEST FIRST)
  let combinedEvents: any[] = [...allTransactions]

  if (userTrades) {
    userTrades.forEach((trade: any) => {
      // ENTRY
      const entryValue = Number(trade.price) * Number(trade.quantity)
      combinedEvents.push({
        id: `trade-entry-${trade.id}`,
        type: 'TRADE_ENTRY',
        side: trade.side,
        symbol: trade.symbol,
        amount: -entryValue, // Deduction
        timestamp: trade.timestamp,
        shares: 0,
        originalTrade: trade
      })

      // EXIT
      if (trade.status === 'CLOSED' && trade.exitTimestamp) {
        const exitValue = Number(trade.exitPrice) * Number(trade.quantity)
        combinedEvents.push({
          id: `trade-exit-${trade.id}`,
          type: 'TRADE_EXIT',
          side: trade.side,
          symbol: trade.symbol,
          amount: exitValue, // Addition
          timestamp: trade.exitTimestamp,
          shares: 0,
          originalTrade: trade
        })
      }
    })
  }

  // Sort Descending (Newest first)
  combinedEvents.sort((a, b) => Number(b.timestamp) - Number(a.timestamp))

  // 5. Calculate Running Balance (BACKWARDS)
  // We start at 'currentBalance' and walk backwards.
  // For each transaction, the balance displayed is the balance AFTER the transaction.
  // The balance for the NEXT (older) transaction is: Current - Amount.

  let walkingBalance = currentBalance

  const transactionsWithBalance = combinedEvents.map((tx: any) => {
    let description = ''
    let amountDisplay = ''
    let typeDisplay = ''
    let shares = '0'
    let amountChange = 0

    if (tx.type === 'DEPOSIT') {
      amountChange = Number(tx.amount)
      description = 'Deposit'
      amountDisplay = `+$${Number(tx.amount).toLocaleString()}`
      typeDisplay = 'deposit'
      shares = Number(tx.shares).toLocaleString()
    } else if (tx.type === 'WITHDRAWAL') {
      amountChange = -Number(tx.amount)
      description = 'Withdrawal'
      amountDisplay = `-$${Number(tx.amount).toLocaleString()}`
      typeDisplay = 'withdrawal'
      shares = Number(tx.shares).toLocaleString()
    } else if (tx.type === 'SEND') {
      amountChange = -Number(tx.amount)
      description = 'Sent'
      amountDisplay = `-$${Number(tx.amount).toLocaleString()}`
      typeDisplay = 'send'
      shares = Number(tx.shares).toLocaleString()
    } else if (tx.type === 'RECEIVE') {
      amountChange = Number(tx.amount)
      description = 'Received'
      amountDisplay = `+$${Number(tx.amount).toLocaleString()}`
      typeDisplay = 'receive'
      shares = Number(tx.shares).toLocaleString()
    } else if (tx.type === 'COMMISSION_EARNED') {
      amountChange = Number(tx.amount)
      description = 'Commission Received'
      amountDisplay = `+$${Math.abs(Number(tx.amount)).toLocaleString()}`
      typeDisplay = 'commission'
    } else if (tx.type === 'COMMISSION_PAID') {
      amountChange = Number(tx.amount)
      description = 'Commission Paid'
      amountDisplay = `-$${Math.abs(Number(tx.amount)).toLocaleString()}`
      typeDisplay = 'commission'
    } else if (tx.type === 'TRADE_ENTRY') {
      amountChange = Number(tx.amount)
      if (tx.side === 'BUY') {
        description = `Buy ${tx.symbol}`
      } else {
        description = `Short Sell ${tx.symbol}`
      }
      amountDisplay = `-$${Math.abs(amountChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      typeDisplay = 'trade'
    } else if (tx.type === 'TRADE_EXIT') {
      amountChange = Number(tx.amount)
      if (tx.side === 'BUY') {
        description = `Sell ${tx.symbol}`
      } else {
        description = `Buy to Cover ${tx.symbol}`
      }
      amountDisplay = `+$${Math.abs(amountChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      typeDisplay = 'trade'
    } else {
      description = 'Unknown Transaction'
      amountDisplay = '$0.00'
      typeDisplay = 'unknown'
    }

    // Capture state
    const rowBalance = walkingBalance
    const formattedBalance = `$${rowBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

    // Update for next (older) row: Reverse the operation
    walkingBalance -= amountChange

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
      balance: formattedBalance,
      type: typeDisplay,
      timestamp: tx.timestamp,
      amountChange
    }
  })

  // formattedTransactions is already Newest First (Descending)
  const formattedTransactions = transactionsWithBalance // No need to reverse

  // Apply pagination
  const paginatedTransactions = formattedTransactions.slice(offset, offset + limit)
  const total = formattedTransactions.length

  return {
    transactions: paginatedTransactions,
    total,
    limit,
    offset
  }
})
