import Airtable from 'airtable'
import type { Report, Market } from '../../app/types/report'

interface WalletData {
  id: string
  email: string
  amount: number
  trades: string[]
  sentTo: Array<{email: string, amount: number, timestamp: string}>
  receivedFrom: Array<{email: string, amount: number, timestamp: string}>
}

interface DashboardMetrics {
  totalWallets: number
  totalBalance: number
  totalTrades: number
  activeWallets: number
  avgBalance: number
  topPerformers: Array<{
    email: string
    balance: number
    tradeCount: number
    pnl: number
  }>
}

export default defineEventHandler(async (event) => {
  try {
    // Initialize Airtable
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY
    }).base(process.env.AIRTABLE_BASE_ID || '')

    const tableName = process.env.AIRTABLE_WALLET_TABLE || 'Wallets'

    const records = await base(tableName)
      .select({
        sort: [{ field: 'Updated At', direction: 'desc' }]
      })
      .all()

    const wallets: WalletData[] = records.map(record => {
      // Parse trades field
      let trades: string[] = []
      try {
        const tradesField = record.fields.Trades as string
        if (tradesField) {
          trades = JSON.parse(tradesField)
        }
      } catch (parseError) {
        console.error(`Error parsing trades for ${record.fields.Email}:`, parseError)
        trades = []
      }

      // Parse sentTo field
      let sentTo: Array<{email: string, amount: number, timestamp: string}> = []
      try {
        const sentToField = record.fields.sentTo as string
        if (sentToField) {
          sentTo = JSON.parse(sentToField)
        }
      } catch (parseError) {
        console.error(`Error parsing sentTo for ${record.fields.Email}:`, parseError)
        sentTo = []
      }

      // Parse receivedFrom field
      let receivedFrom: Array<{email: string, amount: number, timestamp: string}> = []
      try {
        const receivedFromField = record.fields.receivedFrom as string
        if (receivedFromField) {
          receivedFrom = JSON.parse(receivedFromField)
        }
      } catch (parseError) {
        console.error(`Error parsing receivedFrom for ${record.fields.Email}:`, parseError)
        receivedFrom = []
      }

      return {
        id: record.id,
        email: record.fields.Email as string,
        amount: record.fields.Amount as number || 0,
        trades,
        sentTo,
        receivedFrom
      }
    })

    // Calculate metrics
    const metrics: DashboardMetrics = {
      totalWallets: wallets.length,
      totalBalance: wallets.reduce((sum, wallet) => sum + wallet.amount, 0),
      totalTrades: wallets.reduce((sum, wallet) => sum + wallet.trades.length, 0),
      activeWallets: wallets.filter(wallet => wallet.amount > 0).length,
      avgBalance: wallets.length > 0 ? wallets.reduce((sum, wallet) => sum + wallet.amount, 0) / wallets.length : 0,
      topPerformers: wallets
        .filter(wallet => wallet.trades.length > 0)
        .map(wallet => {
          // Calculate PnL from trades
          let pnl = 0
          let lastBuyAmount = 0

          wallet.trades.forEach(trade => {
            if (trade.includes('BUY')) {
              const amountMatch = trade.match(/Amount: \$([0-9.]+)/)
              if (amountMatch) {
                lastBuyAmount = parseFloat(amountMatch[1])
              }
            } else if (trade.includes('SELL')) {
              const amountMatch = trade.match(/Amount: \$([0-9.]+)/)
              if (amountMatch) {
                const sellAmount = parseFloat(amountMatch[1])
                pnl += sellAmount - lastBuyAmount
              }
            }
          })

          return {
            email: wallet.email,
            balance: wallet.amount,
            tradeCount: wallet.trades.length,
            pnl
          }
        })
        .sort((a, b) => b.pnl - a.pnl)
        .slice(0, 10)
    }

    // Create a mock report structure for compatibility with existing components
    const mockMarkets: { [key: string]: Market } = {}

    // Add a summary market entry if there are any trades
    if (wallets.some(wallet => wallet.trades.length > 0)) {
      const allTrades = wallets.flatMap(wallet =>
        wallet.trades.map((trade, index) => ({
          t: new Date(Date.now() - (wallet.trades.length - index) * 60000).toISOString(),
          side: trade.includes('BUY') ? 'buy' as const : 'sell' as const,
          qty: 1,
          px: 100,
          notional: 100
        }))
      )

      mockMarkets['SUMMARY'] = {
        position: 0,
        entryPrice: 100,
        realizedPnL: metrics.topPerformers.reduce((sum, performer) => sum + performer.pnl, 0),
        feesPaid: 0,
        trades: allTrades.slice(-50), // Last 50 trades
        lastMark: 100,
        router: {
          lastRegime: 'paper-trading',
          lastStrategyKey: 'paper-trading',
          lastSwitchTs: Date.now(),
          detector: {
            lastRegime: 'paper-trading'
          }
        },
        strategies: {
          trend: {
            fast: null,
            slow: null,
            prevSlow: null,
            lastMark: null,
            volEwmaBps: null,
            lastState: 'flat',
            entryTs: Date.now(),
            lastExitTs: Date.now(),
            ticks: 0,
            warmTicks: 0
          },
          range: {
            fast: null,
            slow: null,
            prevSlow: null,
            lastMark: null,
            volEwmaBps: null,
            lastState: 'flat',
            entryTs: Date.now(),
            lastExitTs: Date.now(),
            ticks: 0,
            warmTicks: 0
          }
        }
      }
    }

    const report: Report = {
      meta: {
        createdAt: new Date().toISOString(),
        network: 'paper-trading',
        notes: 'Paper trading dashboard data',
        dayStartDate: new Date().toISOString().split('T')[0],
        dayStartEquity: metrics.totalBalance
      },
      deposit: metrics.totalBalance,
      cash: metrics.totalBalance,
      markets: mockMarkets
    }

    return {
      success: true,
      metrics,
      report,
      wallets: wallets.map(wallet => ({
        email: wallet.email,
        balance: wallet.amount,
        tradeCount: wallet.trades.length,
        recentTrades: wallet.trades.slice(-5) // Last 5 trades
      }))
    }
  } catch (error: any) {
    console.error('Dashboard API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to get dashboard data'
    })
  }
})
