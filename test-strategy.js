// Simple test script for the strategy API
// Run with: node test-strategy.js

const config = {
  symbol: "BTCUSDT",
  tf: "15m",
  htf: "1d",
  lookbackDays: 30, // Shorter for testing
  initialCapital: 1000,
  posPct: 10,
  useTrend: true,
  useHTF: true,
  enableShorts: false
}

async function testStrategy() {
  try {
    console.log('Testing strategy API with config:', JSON.stringify(config, null, 2))

    const response = await fetch('http://localhost:3000/api/strategy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config)
    })

    const result = await response.json()

    if (result.ok) {
      console.log('\n✅ Strategy executed successfully!')
      console.log(`📊 Final Equity: $${result.result.equity.toFixed(2)}`)
      console.log(`📈 Return: ${result.result.retPct.toFixed(2)}%`)
      console.log(`📊 Bars processed: ${result.result.bars}`)
      console.log(`💰 Last Price: $${result.result.lastPrice.toFixed(2)}`)
      console.log(`🔢 Total Trades: ${result.result.tradesCount}`)
      console.log(`📊 LTF Candles: ${result.data.ltfCandles}`)
      console.log(`📊 HTF Candles: ${result.data.htfCandles}`)

      console.log('\n📋 Recent Trades:')
      console.table(result.trades.slice(0, 5))

      if (result.trades.length > 5) {
        console.log(`... and ${result.trades.length - 5} more trades`)
      }
    } else {
      console.error('❌ Strategy failed:', result.error)
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('\n💡 Make sure to start the Nuxt dev server first:')
    console.log('   npm run dev')
  }
}

// Run test if this file is executed directly
if (import.meta && import.meta.url && process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  testStrategy()
}

export { testStrategy }
