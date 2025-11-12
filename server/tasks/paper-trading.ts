import Airtable from 'airtable'
import {
  RTBMomentumBreakoutStrategy,
  fetchKlines,
  applyCommission,
  applySlippagePx,
  nowMs,
  days
} from '../services/strategy'

interface WalletRecord {
  id: string
  email: string
  amount: number
  trades: TradeRecord[]
  position: number // 0: flat, 1: long
  entryAmount?: number
}

interface TradeSignal {
  action: 'BUY' | 'SELL' | 'HOLD'
  price: number
  timestamp: number
  confidence: number
}

interface TradeResult {
  type: 'BUY' | 'SELL'
  symbol: string
  quantity: number
  price: number
  amount: number
  timestamp: number
  pnl?: number
}

interface TradeRecord {
  timestamp: number
  side: 'BUY' | 'SELL'
  amount_btc: number
  pair: string
  price_usd: number
  amount_usd: number
  pnl?: number
}

// Helper function to convert old string format to TradeRecord
function parseTradeString(tradeStr: string): TradeRecord | null {
  try {
    const parts = tradeStr.split(' | ')
    if (parts.length < 3) return null

    const timestamp = parseInt(parts[0])
    const tradePart = parts[1]
    const amountPart = parts[2]

    // Parse trade part: "SELL 0.00048488 BTCUSDT @ $111368.12"
    const tradeMatch = tradePart.match(/^(\w+)\s+([\d.]+)\s+(\w+)\s+@\s+\$([\d.]+)$/)
    if (!tradeMatch) return null

    const side = tradeMatch[1] as 'BUY' | 'SELL'
    const amount_btc = parseFloat(tradeMatch[2])
    const pair = tradeMatch[3]
    const price_usd = parseFloat(tradeMatch[4])

    // Parse amount part: "Amount: $0.03"
    const amountMatch = amountPart.match(/Amount:\s+\$([\d.]+)/)
    if (!amountMatch) return null

    const amount_usd = parseFloat(amountMatch[1])

    // Check for PnL
    let pnl: number | undefined
    if (parts.length > 3 && parts[3].startsWith('PnL:')) {
      const pnlMatch = parts[3].match(/PnL:\s*([+-])\$([\d.]+)/)
      if (pnlMatch) {
        pnl = parseFloat(pnlMatch[2]) * (pnlMatch[1] === '+' ? 1 : -1)
      }
    }

    return {
      timestamp,
      side,
      amount_btc,
      pair,
      price_usd,
      amount_usd,
      pnl
    }
  } catch (error) {
    console.error('Error parsing trade string:', tradeStr, error)
    return null
  }
}

// Export the bot class for external use
export class PaperTradingBot {
  private base: Airtable.Base
  private tableName: string
  private strategy: RTBMomentumBreakoutStrategy

  constructor() {
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY!
    }).base(process.env.AIRTABLE_BASE_ID || '')

    this.base = base
    this.tableName = process.env.AIRTABLE_WALLET_TABLE || 'Wallets'
    this.strategy = new RTBMomentumBreakoutStrategy()
  }

  async getAllWallets(): Promise<WalletRecord[]> {
    try {
      const records = await this.base(this.tableName)
        .select({
          sort: [{ field: 'Updated At', direction: 'desc' }]
        })
        .all()

      return records.map(record => {
        let parsedTrades: any[] = []
        try {
          // Parse the JSON string from Airtable
          const tradesField = record.fields.Trades as string
          if (tradesField) {
            parsedTrades = JSON.parse(tradesField)
          }
        } catch (parseError) {
          console.error(`Error parsing trades for wallet ${record.id}:`, parseError)
          parsedTrades = []
        }

        // Convert old string format to TradeRecord
        const trades: TradeRecord[] = parsedTrades
          .map(t => typeof t === 'string' ? parseTradeString(t) : t)
          .filter(t => t !== null) as TradeRecord[]

        return {
          id: record.id,
          email: record.fields.Email as string,
          amount: record.fields.Amount as number || 0,
          trades: trades,
          position: record.fields.Position as number || 0,
          entryAmount: record.fields['Entry Amount'] as number || undefined
        }
      })
    } catch (error) {
      console.error('Error fetching wallets:', error)
      return []
    }
  }

  async updateWallet(walletId: string, trades: TradeRecord[], position: number, entryAmount?: number): Promise<void> {
    try {
      const updateData: any = {
        'Trades': JSON.stringify(trades),
        'Position': position,
        'Updated At': new Date().toISOString()
      }
      if (entryAmount !== undefined) {
        updateData['Entry Amount'] = entryAmount
      }
      await this.base(this.tableName).update(walletId, updateData)
    } catch (error) {
      console.error(`Error updating wallet ${walletId}:`, error)
    }
  }

  async generateTradingSignal(symbol: string = 'BTCUSDT'): Promise<TradeSignal> {
    try {
      const endTime = nowMs()
      const startTime = endTime - days(30) // Get last 30 days for sufficient data

      // Fetch recent market data
      const data = await fetchKlines(symbol, '15m', startTime, endTime)

      if (data.length < 50) {
        return { action: 'HOLD', price: 0, timestamp: endTime, confidence: 0 }
      }

      // Get the latest bar
      const latestBar = data[data.length - 1]
      const signal = this.strategy.generateSignal(
        latestBar.open,
        latestBar.high,
        latestBar.low,
        latestBar.close,
        latestBar.volume
      )

      // Convert signal to action
      let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD'
      let confidence = 0

      if (typeof signal === 'object') {
        if (signal.signal === 1) {
          action = 'BUY'
          confidence = 0.8 // High confidence for buy signals
        } else if (signal.signal === -1) {
          action = 'SELL'
          confidence = 0.8 // High confidence for sell signals
        }
      }

      return {
        action,
        price: latestBar.close,
        timestamp: endTime,
        confidence
      }
    } catch (error) {
      console.error('Error generating trading signal:', error)
      return { action: 'HOLD', price: 0, timestamp: nowMs(), confidence: 0 }
    }
  }

  executePaperTrade(wallet: WalletRecord, signal: TradeSignal): TradeResult | null {
    if (signal.action === 'HOLD' || wallet.amount <= 0) {
      return null
    }

    // Check position constraints
    if (signal.action === 'BUY' && wallet.position !== 0) {
      return null // Already in position
    }
    if (signal.action === 'SELL' && wallet.position !== 1) {
      return null // Not in position
    }

    const posPct = 10 // 10% position size
    const commissionPct = 0.05 // 0.05% commission
    const slippagePct = 0 // No slippage for paper trading

    const tradeAmount = wallet.amount * (posPct / 100)
    const quantity = tradeAmount / signal.price

    if (quantity < 0.0001) { // Minimum trade size
      return null
    }

    const commission = applyCommission(tradeAmount, commissionPct)
    const slippage = applySlippagePx(signal.price, slippagePct, signal.action)

    const finalAmount = signal.action === 'BUY' ? commission : tradeAmount - commission
    const finalPrice = signal.action === 'BUY' ? slippage : slippage

    return {
      type: signal.action,
      symbol: 'BTCUSDT',
      quantity: quantity,
      price: finalPrice,
      amount: finalAmount,
      timestamp: signal.timestamp
    }
  }

  generateTradeRecord(trade: TradeResult): TradeRecord {
    return {
      timestamp: trade.timestamp,
      side: trade.type,
      amount_btc: trade.quantity,
      pair: trade.symbol,
      price_usd: trade.price,
      amount_usd: trade.amount,
      pnl: trade.pnl
    }
  }

  async runPaperTradingCycle(): Promise<void> {
    console.log('Starting paper trading cycle...')

    try {
      // Get all wallets
      const wallets = await this.getAllWallets()
      console.log(`Processing ${wallets.length} wallets`)

      if (wallets.length === 0) {
        console.log('No wallets found')
        return
      }

      // Generate trading signal
      const signal = await this.generateTradingSignal()
      console.log(`Trading signal: ${signal.action} @ $${signal.price} (confidence: ${signal.confidence})`)

      if (signal.action === 'HOLD') {
        console.log('No trading action required')
        return
      }

      // Process each wallet
      for (const wallet of wallets) {
        if (wallet.amount <= 0) {
          console.log(`Skipping wallet ${wallet.email} - no balance`)
          continue
        }

        const trade = this.executePaperTrade(wallet, signal)

        if (trade) {
          // Calculate PnL for sell orders
          let pnl: number | undefined
          if (trade.type === 'SELL' && wallet.entryAmount !== undefined) {
            pnl = trade.amount - wallet.entryAmount
            trade.pnl = pnl
          }

          const tradeRecord = this.generateTradeRecord(trade)
          const updatedTrades = [...wallet.trades, tradeRecord]

          // Update position and entry amount
          let newPosition = wallet.position
          let newEntryAmount = wallet.entryAmount
          if (trade.type === 'BUY') {
            newPosition = 1
            newEntryAmount = trade.amount
          } else if (trade.type === 'SELL') {
            newPosition = 0
            newEntryAmount = undefined
          }

          await this.updateWallet(wallet.id, updatedTrades, newPosition, newEntryAmount)
          console.log(`Executed ${trade.type} for ${wallet.email}: ${tradeRecord.side} ${tradeRecord.amount_btc.toFixed(8)} ${tradeRecord.pair} @ $${tradeRecord.price_usd.toFixed(2)}`)
        }
      }

      console.log('Paper trading cycle completed')
    } catch (error) {
      console.error('Error in paper trading cycle:', error)
    }
  }
}

// Export the task function
export default defineTask({
  meta: {
    name: 'paper-trading',
    description: 'Run paper trading for all users every 5 minutes'
  },
  async run({ payload, context }) {
    const bot = new PaperTradingBot()
    await bot.runPaperTradingCycle()
    return { result: { success: true } }
  }
})
