import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  // Get latest portfolio snapshot
  const { data: snapshot, error: snapError } = await (supabase as any)
    .from('portfolio_snapshots')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (snapError) {
    console.error('Error fetching portfolio snapshot:', snapError)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch portfolio data'
    })
  }

  // Get current total deposited balance from vault transactions
  const { data: vaultTransactions, error: vaultTxError } = await (supabase as any)
    .from('vault_transactions')
    .select('amount, type, timestamp')
    .order('timestamp', { ascending: true })

  if (vaultTxError) {
    console.error('Error fetching vault transactions:', vaultTxError)
  }

  // Calculate current total deposited (like wallet summary does)
  let currentTotalDeposited = 0
  if (vaultTransactions) {
    currentTotalDeposited = vaultTransactions.reduce((sum: number, tx: any) => {
      if (tx.type === 'DEPOSIT') return sum + Number(tx.amount)
      if (tx.type === 'WITHDRAWAL') return sum - Number(tx.amount)
      if (tx.type === 'COMMISSION_EARNED') return sum + Number(tx.amount)
      if (tx.type === 'COMMISSION_PAID') return sum + Number(tx.amount) // amount is negative
      return sum
    }, 0)
  }

  // Get current open trades to calculate unrealized PnL
  const { data: openTrades, error: tradesError } = await (supabase as any)
    .from('trades')
    .select('*')
    .eq('status', 'OPEN')

  let currentUnrealizedPnL = 0
  if (!tradesError && openTrades?.length > 0) {
    // Get current prices for unrealized PnL calculation
    const symbols = [...new Set(openTrades.map((trade: any) => trade.symbol))]
    if (symbols.length > 0) {
      try {
        const pricesResponse = await $fetch(`/api/prices?symbols=${symbols.join(',')}`)
        const prices = pricesResponse as Record<string, number>

        if (prices) {
          openTrades.forEach((trade: any) => {
            const currentPrice = prices[trade.symbol]
            if (!currentPrice) return

            const entryPrice = Number(trade.price)
            const quantity = Number(trade.quantity)

            const dollarPnL = trade.side === 'BUY'
              ? (currentPrice - entryPrice) * quantity
              : (entryPrice - currentPrice) * quantity

            currentUnrealizedPnL += dollarPnL
          })
        }
      } catch (pricesError) {
        console.error('Error fetching prices for unrealized PnL:', pricesError)
      }
    }
  }

  // The snapshot's initialBalance is outdated. We need to adjust based on current deposited amount
  const snapshotInitialBalance = snapshot.initialBalance || 0
  const snapshotUnrealizedPnL = (snapshot.currentEquity || 0) - (snapshot.walletBalance || 0)

  const depositedAdjustment = currentTotalDeposited - snapshotInitialBalance
  const unrealizedPnLAdjustment = currentUnrealizedPnL - snapshotUnrealizedPnL

  // Adjust balance and equity for the difference in deposited capital and current unrealized PnL
  const adjustedCurrentBalance = Math.max(0, (snapshot.currentBalance || 0) + depositedAdjustment)
  const adjustedCurrentEquity = (snapshot.currentEquity || 0) + depositedAdjustment + unrealizedPnLAdjustment

  // Recalculate PnL percentage based on the adjusted initial balance
  // This fixes the issue where PnL % is calculated against a default/old initial balance (e.g. 1000)
  // instead of the actual current capital in the vault.
  const adjustedInitialBalance = Math.max(1, currentTotalDeposited) // Prevent division by zero
  const currentTotalPnL = snapshot.pnl || 0
  const adjustedPnLPercentage = (currentTotalPnL / adjustedInitialBalance) * 100

  return {
    currentBalance: adjustedCurrentBalance,
    currentEquity: adjustedCurrentEquity,
    winRate: snapshot.winRate || 0,
    profitFactor: snapshot.profitFactor || 0,
    totalPnL: currentTotalPnL,
    totalPnLPercentage: adjustedPnLPercentage,
    openTradesCount: snapshot.openTradesCount || 0,
    totalMarginUsed: snapshot.totalMarginUsed || 0,
    closedTrades: (snapshot.winningTrades || 0) + (snapshot.losingTrades || 0),
    winningTrades: snapshot.winningTrades || 0,
    losingTrades: snapshot.losingTrades || 0,
    initialBalance: adjustedInitialBalance
  }
})
