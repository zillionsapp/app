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

  // Get all closed trades
  const { data: trades, error: tradesError } = await (supabase as any)
    .from('trades')
    .select('id, symbol, side, quantity, price, exitPrice, timestamp, exitTimestamp, status')
    .eq('status', 'CLOSED')
    .not('exitPrice', 'is', null)
    .order('exitTimestamp', { ascending: true })

  if (tradesError) {
    console.error('Error fetching trades:', tradesError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch trades'
    })
  }

  // Get user's vault transactions to calculate shares over time
  const { data: vaultTxs, error: vaultError } = await supabase
    .from('vault_transactions')
    .select('amount, shares, type, timestamp, email')
    .eq('email', userEmail)
    .in('type', ['DEPOSIT', 'WITHDRAWAL', 'SEND', 'RECEIVE'])
    .order('timestamp', { ascending: true })

  if (vaultError) {
    console.error('Error fetching vault transactions:', vaultError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch vault transactions'
    })
  }

  // Calculate user's share at each point in time
  const shareHistory: Array<{ timestamp: number, shares: number }> = []
  let currentShares = 0

  for (const tx of vaultTxs) {
    if (tx.type === 'DEPOSIT') {
      currentShares += Number(tx.shares)
    } else if (tx.type === 'WITHDRAWAL') {
      currentShares -= Number(tx.shares)
    }
    // SEND and RECEIVE don't affect shares

    shareHistory.push({
      timestamp: tx.timestamp,
      shares: currentShares
    })
  }

  // Calculate total vault shares at each trade time
  const pnlTransactions: any[] = []

  for (const trade of trades) {
    // Find user's shares at the time the trade was opened
    const userSharesAtOpen = getUserSharesAtTime(shareHistory, trade.timestamp)
    if (userSharesAtOpen <= 0) continue

    // Get total vault shares at the time the trade was opened
    const totalVaultSharesAtOpen = await getTotalVaultSharesAtTime(supabase, trade.timestamp)
    if (totalVaultSharesAtOpen <= 0) continue

    // Calculate user's share of the trade
    const userShareRatio = userSharesAtOpen / totalVaultSharesAtOpen

    // Calculate trade P&L
    const tradePnL = trade.side === 'BUY'
      ? (trade.exitPrice - trade.price) * trade.quantity
      : (trade.price - trade.exitPrice) * trade.quantity

    // User's portion of P&L
    const userPnL = tradePnL * userShareRatio

    if (Math.abs(userPnL) < 0.01) continue // Skip very small amounts

    pnlTransactions.push({
      id: `pnl-${trade.id}`,
      date: new Date(trade.exitTimestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: new Date(trade.exitTimestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      description: `${trade.side} ${trade.symbol} ${trade.quantity}@${trade.price} -> ${trade.exitPrice}`,
      amount: userPnL > 0 ? `+$${userPnL.toFixed(2)}` : `-$${Math.abs(userPnL).toFixed(2)}`,
      shares: '0',
      balance: '$0.00', // Will be calculated in frontend
      type: userPnL > 0 ? 'profit' : 'loss',
      timestamp: trade.exitTimestamp,
      amountChange: userPnL
    })
  }

  // Apply pagination
  const paginatedTransactions = pnlTransactions.slice(offset, offset + limit)
  const total = pnlTransactions.length

  return {
    transactions: paginatedTransactions,
    total,
    limit,
    offset
  }
})

// Helper function to get user's shares at a specific timestamp
function getUserSharesAtTime(shareHistory: Array<{ timestamp: number, shares: number }>, targetTime: number): number {
  // Find the last share record before or at the target time
  for (let i = shareHistory.length - 1; i >= 0; i--) {
    if (shareHistory[i].timestamp <= targetTime) {
      return shareHistory[i].shares
    }
  }
  return 0
}

// Helper function to get total vault shares at a specific timestamp
async function getTotalVaultSharesAtTime(supabase: any, targetTime: number): Promise<number> {
  const { data: vaultTxs, error } = await supabase
    .from('vault_transactions')
    .select('shares, type, timestamp')
    .in('type', ['DEPOSIT', 'WITHDRAWAL'])
    .lte('timestamp', targetTime)
    .order('timestamp', { ascending: true })

  if (error) return 0

  let totalShares = 0
  for (const tx of vaultTxs) {
    if (tx.type === 'DEPOSIT') {
      totalShares += Number(tx.shares)
    } else if (tx.type === 'WITHDRAWAL') {
      totalShares -= Number(tx.shares)
    }
  }

  return totalShares
}
