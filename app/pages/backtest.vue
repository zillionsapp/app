<template>
  <div class="bg-base-100 text-white min-h-screen">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-white mb-8">
        Strategy Backtest
      </h1>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Configuration and Analysis -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Configuration Panel -->
          <BacktestConfiguration
            :config="config"
            :loading="loading"
            @run-backtest="runBacktest"
            @reset-config="resetConfig"
          />

          <!-- Analysis and Improvement Section -->
          <BacktestAnalysis
            v-if="result && !loading"
            :result="result"
            :analysis="analysis"
            :improvements="improvements"
            :optimalTrades="optimalTrades"
            :analyzing="analyzing"
            :improving="improving"
            :generatingOptimal="generatingOptimal"
            @analyze-trades="analyzeTrades"
            @improve-strategy="improveStrategy"
            @apply-improvements="applyImprovements"
            @generate-optimal-trades="generateOptimalTrades"
            @backtest-optimal-strategy="backtestOptimalStrategy"
            @analyze-optimal-performance="analyzeOptimalPerformance"
          />
        </div>

        <!-- Results Panel -->
        <div class="lg:col-span-2">
          <div v-if="loading" class="bg-base-200/60 rounded-lg shadow-md p-8 text-center">
            <div class="animate-pulse">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-8"></div>
              <div class="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div class="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>

          <BacktestResults
            v-else-if="result"
            :result="result"
            :show-all-trades="showAllTrades"
            @toggle-all-trades="showAllTrades = !showAllTrades"
            @chart-data-ready="handleChartDataReady"
          />

          <!-- No Results State -->
          <div v-else class="bg-base-200/60 rounded-lg shadow-md p-8 text-center">
            <div class="text-gray-500 dark:text-gray-400">
              <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 class="text-lg font-medium mb-2">No Backtest Results</h3>
              <p class="mb-4">Configure your strategy parameters and run a backtest to see results.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

// Protect this page with authentication
definePageMeta({
  middleware: 'auth'
})

const loading = ref(false)
const result = ref(null)
const showAllTrades = ref(false)
const analyzing = ref(false)
const improving = ref(false)
const generatingOptimal = ref(false)
const analysis = ref(null)
const improvements = ref(null)
const optimalTrades = ref(null)

const handleChartDataReady = (ready) => {
  console.log('Chart data ready:', ready)
}

// Default configuration - Strategy Analyzer Optimized Settings
const defaultConfig = {
  symbol: 'BTCUSDT',
  tf: '15m',
  htf: '1h',
  lookbackDays: 120,
  initialCapital: 1000,
  commissionPct: 0.05,
  slippagePct: 0,
  posPct: 10,
  useTrend: true,
  useHTF: true,
  trendLen: 35,
  upTh: 55,
  dnTh: 43,
  htfLongTh: 55,
  htfShortTh: 47,
  obosLen: 12,
  adaptLen: 14,
  showOBOS: true,
  winLen: 26,
  needBars: 6,
  minSpacing: 3,
  enableShorts: false,
  tpPct: 10,
  tpPortion: 50,
  useTrail: true,
  trailPct: 3.4,
  armTrailPct: 1.2,
  minHoldBars: 2,
  useATRstop: false,
  atrLen: 14,
  atrMult: 3
}

const config = reactive({ ...defaultConfig })

const runBacktest = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/backtest', {
      method: 'POST',
      body: config
    })
    result.value = response

    // Clear optimal trades when running new backtest since they become irrelevant
    optimalTrades.value = null
    console.log('Optimal trades cleared after new backtest')
  } catch (error) {
    console.error('Backtest failed:', error)
    // You could add a toast notification here
  } finally {
    loading.value = false
  }
}

const resetConfig = () => {
  Object.assign(config, defaultConfig)
  result.value = null
}



const analyzeTrades = async () => {
  if (!result.value) return

  analyzing.value = true
  try {
    // Extract price data from the backtest result for dip/peak analysis
    const priceData = result.value.priceData || []

    const response = await $fetch('/api/strategy/analyze', {
      method: 'POST',
      body: {
        trades: result.value.allTrades,
        config: result.value.config,
        performance: {
          totalReturn: result.value.result.retPct,
          totalTrades: result.value.result.tradesCount,
          finalEquity: result.value.result.equity
        },
        priceData: priceData // Include price data for mathematical dip/peak analysis
      }
    })
    analysis.value = response.analysis
  } catch (error) {
    console.error('Trade analysis failed:', error)
    // You could add a toast notification here
  } finally {
    analyzing.value = false
  }
}

const improveStrategy = async () => {
  if (!result.value || !analysis.value) return

  improving.value = true
  try {
    const response = await $fetch('/api/strategy/improve', {
      method: 'POST',
      body: {
        currentConfig: result.value.config,
        analysis: analysis.value,
        trades: result.value.allTrades
      }
    })
    improvements.value = response.improvements
  } catch (error) {
    console.error('Strategy improvement failed:', error)
    // You could add a toast notification here
  } finally {
    improving.value = false
  }
}

const applyImprovements = () => {
  if (!improvements.value) return

  // Apply the suggested parameter changes to the current config
  improvements.value.parameterChanges.forEach(change => {
    if (config.hasOwnProperty(change.param)) {
      config[change.param] = change.newValue
    }
  })

  // Clear the improvements and analysis to reset the state
  improvements.value = null
  analysis.value = null

  // Optionally run a new backtest with the improved parameters
  // runBacktest()
}

const generateOptimalTrades = async () => {
  if (!result.value) {
    console.error('No backtest result available')
    return
  }

  generatingOptimal.value = true
  try {
    // Extract price data from the backtest result
    const rawPriceData = result.value.priceData || []
    // Convert price data objects to simple number array
    const priceData = rawPriceData.map((item) => typeof item === 'number' ? item : item.price)

    console.log('Generating optimal trades with:', {
      hasPriceData: !!priceData,
      priceDataLength: priceData.length,
      firstFewPrices: priceData.slice(0, 5),
      lastFewPrices: priceData.slice(-5),
      rawDataSample: rawPriceData.slice(0, 3)
    })

    if (priceData.length === 0) {
      console.error('No price data available in backtest result')
      return
    }

    const response = await $fetch('/api/strategy/generate-optimal', {
      method: 'POST',
      body: {
        priceData: priceData,
        initialCapital: 1000,
        commissionPct: 0.05
      }
    })

    console.log('Optimal trades response:', response)

    if (response.ok && response.optimalTrades) {
      optimalTrades.value = response.optimalTrades
      console.log('Optimal trades set successfully:', optimalTrades.value)
    } else {
      console.error('Invalid response format:', response)
    }
  } catch (error) {
    console.error('Optimal trades generation failed:', error)
    // You could add a toast notification here
  } finally {
    generatingOptimal.value = false
  }
}

// Handler for backtesting the optimal strategy
const backtestOptimalStrategy = async () => {
  if (!optimalTrades.value) {
    console.error('No optimal trades available')
    return
  }

  console.log('Taking over optimal trades into backtest results...')

  // Create a mock backtest result using the optimal trades
  const mockBacktestResult = createMockBacktestResult(optimalTrades.value)

  // Update the result to show optimal trades
  result.value = mockBacktestResult

  console.log('Optimal trades now displayed in backtest results')
}

// Create a mock backtest result from optimal trades
const createMockBacktestResult = (optimalTradesData) => {
  const performance = optimalTradesData.performance
  const trades = optimalTradesData.optimalTrades

  // Use the original price data from the current backtest result
  const originalPriceData = result.value?.priceData || []
  const originalStartPrice = originalPriceData.length > 0 ?
    (typeof originalPriceData[0] === 'number' ? originalPriceData[0] : originalPriceData[0].price) : 50000
  const originalEndPrice = originalPriceData.length > 0 ?
    (typeof originalPriceData[originalPriceData.length - 1] === 'number'
      ? originalPriceData[originalPriceData.length - 1]
      : originalPriceData[originalPriceData.length - 1].price) : 50000

  // Calculate proper buy & hold return using original price data
  const properBuyAndHoldReturn = ((originalEndPrice - originalStartPrice) / originalStartPrice) * 100

  // Create properly formatted trades that match the expected structure for round-trip analysis
  const formattedTrades = []

  // Group optimal trades into entry/exit pairs for proper round-trip calculation
  let currentPosition = null
  let entryTrade = null

  trades.forEach((trade, index) => {
    const tradeTime = originalPriceData.length > index ?
      (typeof originalPriceData[index] === 'object' ? originalPriceData[index].time : new Date(Date.now() - (trades.length - index) * 15 * 60 * 1000).toISOString()) :
      new Date(Date.now() - (trades.length - index) * 15 * 60 * 1000).toISOString()

    if (trade.type === 'BUY') {
      // This is an entry
      if (currentPosition) {
        // Close previous position first
        formattedTrades.push({
          time: tradeTime,
          side: 'SELL',
          price: trade.price.toFixed(6),
          qty: currentPosition.qty.toFixed(8),
          note: 'EOD flatten'
        })
      }

      // Open new position
      currentPosition = {
        qty: (trade.quantity || 1).toFixed(8),
        price: trade.price,
        time: tradeTime
      }

      formattedTrades.push({
        time: tradeTime,
        side: 'BUY',
        price: trade.price.toFixed(6),
        qty: currentPosition.qty,
        note: 'entry'
      })

    } else if (trade.type === 'SELL' && currentPosition) {
      // This is an exit
      formattedTrades.push({
        time: tradeTime,
        side: 'SELL',
        price: trade.price.toFixed(6),
        qty: currentPosition.qty,
        note: 'exit'
      })

      currentPosition = null
    }
  })

  // Close any remaining position
  if (currentPosition) {
    const finalTime = originalPriceData.length > 0 ?
      (typeof originalPriceData[originalPriceData.length - 1] === 'object'
        ? originalPriceData[originalPriceData.length - 1].time
        : new Date().toISOString()) :
      new Date().toISOString()

    formattedTrades.push({
      time: finalTime,
      side: 'SELL',
      price: originalEndPrice.toFixed(6),
      qty: currentPosition.qty,
      note: 'EOD flatten'
    })
  }

  return {
    ok: true,
    config: { ...config }, // Use current config
    result: {
      equity: performance.finalValue,
      retPct: performance.totalReturnPct,
      bars: originalPriceData.length || 1000,
      lastPrice: originalEndPrice,
      tradesCount: trades.length
    },
    trades: formattedTrades.slice(-20), // Last 20 trades for display
    allTrades: formattedTrades, // All trades for analysis
    priceData: originalPriceData, // Use original price data for proper buy & hold calculation
    data: {
      ltfCandles: originalPriceData.length || 1000,
      htfCandles: 200,
      ltfTimeframe: '15m',
      htfTimeframe: '1h'
    }
  }
}

// Helper function to extract price data for optimal trades generation
const extractPriceArray = (priceData) => {
  if (!priceData || priceData.length === 0) return []

  return priceData.map(item =>
    typeof item === 'number' ? item : item.price
  ).filter(price => typeof price === 'number' && price > 0)
}

// Handler for analyzing optimal performance
const analyzeOptimalPerformance = () => {
  if (!optimalTrades.value) {
    console.error('No optimal trades available')
    return
  }

  console.log('Analyzing optimal performance:', optimalTrades.value)

  // For now, just log the performance
  // In the future, we could run detailed analysis on the optimal trades
  console.log('Optimal Performance Summary:', {
    return: optimalTrades.value.performance.totalReturnPct,
    vsBuyHold: optimalTrades.value.performance.vsBuyAndHold,
    finalValue: optimalTrades.value.performance.finalValue,
    totalTrades: optimalTrades.value.performance.totalTrades
  })

  // You could add a toast notification here showing the analysis
}

// Auto-run backtest on mount with default config
onMounted(() => {
  runBacktest()
})
</script>

<style scoped>
/* Custom scrollbar for trade tables */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.dark .overflow-y-auto::-webkit-scrollbar-track {
  background: #374151;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #6b7280;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
