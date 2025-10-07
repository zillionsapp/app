import Airtable from 'airtable'
import {
  fetchKlines,
  StrategyConfig,
  DEFAULT_CONFIG,
  trendScore,
  obosSignals,
  rollingCountTrue,
  alignHTFtoLTF,
  ema,
  rsi,
  atr,
  pct,
  applyCommission,
  applySlippagePx,
  nowMs,
  days
} from '../services/strategy'

interface WalletRecord {
  id: string
  email: string
  amount: number
  trades: string[]
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

// Export the bot class for external use
export class PaperTradingBot {
  private base: Airtable.Base
  private tableName: string
  private strategyConfig: StrategyConfig

  constructor() {
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_API_KEY!
    }).base(process.env.AIRTABLE_BASE_ID || '')

    this.base = base
    this.tableName = process.env.AIRTABLE_WALLET_TABLE || 'Wallets'
    this.strategyConfig = { ...DEFAULT_CONFIG }
  }

  async getAllWallets(): Promise<WalletRecord[]> {
    try {
      const records = await this.base(this.tableName)
        .select({
          sort: [{ field: 'Updated At', direction: 'desc' }]
        })
        .all()

      return records.map(record => {
        let trades: string[] = []
        try {
          // Parse the JSON string from Airtable
          const tradesField = record.fields.Trades as string
          if (tradesField) {
            trades = JSON.parse(tradesField)
          }
        } catch (parseError) {
          console.error(`Error parsing trades for wallet ${record.id}:`, parseError)
          trades = []
        }

        return {
          id: record.id,
          email: record.fields.Email as string,
          amount: record.fields.Amount as number || 0,
          trades: trades
        }
      })
    } catch (error) {
      console.error('Error fetching wallets:', error)
      return []
    }
  }

  async updateWalletTrades(walletId: string, trades: string[]): Promise<void> {
    try {
      await this.base(this.tableName).update(walletId, {
        'Trades': JSON.stringify(trades),
        'Updated At': new Date().toISOString()
      })
    } catch (error) {
      console.error(`Error updating trades for wallet ${walletId}:`, error)
    }
  }

  async generateTradingSignal(symbol: string = 'BTCUSDT'): Promise<TradeSignal> {
    try {
      const endTime = nowMs()
      const startTime = endTime - days(this.strategyConfig.lookbackDays!)

      // Fetch market data
      const ltfData = await fetchKlines(symbol, this.strategyConfig.tf!, startTime, endTime)
      const htfData = await fetchKlines(symbol, this.strategyConfig.htf!, startTime, endTime)

      if (ltfData.length < 100 || htfData.length < 20) {
        return { action: 'HOLD', price: 0, timestamp: endTime, confidence: 0 }
      }

      // Extract price series
      const close = ltfData.map(d => d.close)
      const high = ltfData.map(d => d.high)
      const low = ltfData.map(d => d.low)

      // Calculate indicators
      const trend = trendScore(close, this.strategyConfig.trendLen!)
      const obos = obosSignals(close, this.strategyConfig.obosLen!, this.strategyConfig.adaptLen!)
      const htfTrend = alignHTFtoLTF(ltfData.map(d => d.time), htfData, this.strategyConfig.trendLen!)

      // Generate signals
      const bullishSignals = rollingCountTrue(obos.isOB.map((ob, i) =>
        trend[i] > this.strategyConfig.upTh! &&
        htfTrend[i] > this.strategyConfig.htfLongTh! &&
        !ob // Not overbought
      ), this.strategyConfig.winLen!)

      const bearishSignals = rollingCountTrue(obos.isOS.map((os, i) =>
        trend[i] < this.strategyConfig.dnTh! &&
        htfTrend[i] < this.strategyConfig.htfShortTh! &&
        !os // Not oversold
      ), this.strategyConfig.winLen!)

      const currentPrice = close[close.length - 1]
      const bullishCount = bullishSignals[bullishSignals.length - 1] || 0
      const bearishCount = bearishSignals[bearishSignals.length - 1] || 0

      // Decision logic
      if (bullishCount >= this.strategyConfig.needBars! && bearishCount < this.strategyConfig.needBars!) {
        return {
          action: 'BUY',
          price: currentPrice,
          timestamp: endTime,
          confidence: Math.min(bullishCount / this.strategyConfig.winLen!, 1)
        }
      } else if (bearishCount >= this.strategyConfig.needBars! && bullishCount < this.strategyConfig.needBars!) {
        return {
          action: 'SELL',
          price: currentPrice,
          timestamp: endTime,
          confidence: Math.min(bearishCount / this.strategyConfig.winLen!, 1)
        }
      }

      return {
        action: 'HOLD',
        price: currentPrice,
        timestamp: nowMs(),
        confidence: 0
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

    const tradeAmount = wallet.amount * (this.strategyConfig.posPct! / 100)
    const quantity = tradeAmount / signal.price

    if (quantity < 0.0001) { // Minimum trade size
      return null
    }

    const commission = applyCommission(tradeAmount, this.strategyConfig.commissionPct!)
    const slippage = applySlippagePx(signal.price, this.strategyConfig.slippagePct!, signal.action)

    const finalAmount = signal.action === 'BUY' ? commission : tradeAmount - commission
    const finalPrice = signal.action === 'BUY' ? slippage : slippage

    return {
      type: signal.action,
      symbol: this.strategyConfig.symbol!,
      quantity: quantity,
      price: finalPrice,
      amount: finalAmount,
      timestamp: signal.timestamp
    }
  }

  generateTradeDescription(trade: TradeResult): string {
    const pnlText = trade.pnl !== undefined ?
      ` | PnL: ${trade.pnl > 0 ? '+' : ''}$${trade.pnl.toFixed(2)}` : ''

    return `${trade.timestamp} | ${trade.type} ${trade.quantity.toFixed(8)} ${trade.symbol} @ $${trade.price.toFixed(2)} | Amount: $${trade.amount.toFixed(2)}${pnlText}`
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
          // Calculate PnL for sell orders by comparing to last buy
          if (trade.type === 'SELL') {
            const lastBuyTrade = [...wallet.trades]
              .reverse()
              .find(t => t.includes('BUY'))

            if (lastBuyTrade) {
              const buyMatch = lastBuyTrade.match(/Amount: \$([0-9.]+)/)
              if (buyMatch) {
                const buyAmount = parseFloat(buyMatch[1])
                trade.pnl = trade.amount - buyAmount
              }
            }
          }

          const tradeDescription = this.generateTradeDescription(trade)
          const updatedTrades = [...wallet.trades, tradeDescription]

          await this.updateWalletTrades(wallet.id, updatedTrades)
          console.log(`Executed ${trade.type} for ${wallet.email}: ${tradeDescription}`)
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
