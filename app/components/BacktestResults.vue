<template>
  <div class="space-y-6">
    <!-- Performance Chart -->
    <BacktestChart
      :trades="result.allTrades"
      :initial-capital="result.config.initialCapital"
      :price-data="result.priceData"
      :result="result"
      @data-ready="handleChartDataReady"
    />

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Portfolio Value</div>
        <div class="text-2xl font-bold text-primary">
          ${{ result.result.equity.toFixed(2) }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          Final Balance
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Strategy PnL</div>
        <div class="text-2xl font-bold text-green-600 dark:text-green-400">
          ${{ (result.result.equity - result.config.initialCapital).toFixed(2) }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ result.result.retPct.toFixed(2) }}%
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Buy & Hold PnL</div>
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
          ${{ buyHoldPnL.toFixed(2) }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ buyHoldReturn.toFixed(2) }}%
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div class="text-sm font-medium text-gray-500 dark:text-gray-400">vs Buy & Hold</div>
        <div :class="strategyVsBuyHold >= 0 ? 'text-2xl font-bold text-green-600 dark:text-green-400' : 'text-2xl font-bold text-red-600 dark:text-red-400'">
          {{ strategyVsBuyHold >= 0 ? '+' : '' }}${{ strategyVsBuyHold.toFixed(2) }}
        </div>
        <div :class="strategyVsBuyHoldPct >= 0 ? 'text-sm text-green-600 dark:text-green-400' : 'text-sm text-red-600 dark:text-red-400'">
          {{ strategyVsBuyHoldPct >= 0 ? '+' : '' }}{{ strategyVsBuyHoldPct.toFixed(2) }}%
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Trades</div>
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ result.result.tradesCount }}
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Win Rate</div>
        <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {{ winRate.toFixed(1) }}%
        </div>
      </div>
    </div>

    <!-- Configuration Summary -->
    <div class="bg-base-200/60 rounded-lg shadow-md p-6">
      <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Configuration Used</h3>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span class="font-medium text-gray-700 dark:text-gray-300">Symbol:</span>
          {{ result.config.symbol }}
        </div>
        <div>
          <span class="font-medium text-gray-700 dark:text-gray-300">Timeframe:</span>
          {{ result.config.tf }}
        </div>
        <div>
          <span class="font-medium text-gray-700 dark:text-gray-300">HTF:</span>
          {{ result.config.htf }}
        </div>
        <div>
          <span class="font-medium text-gray-700 dark:text-gray-300">Capital:</span>
          ${{ result.config.initialCapital }}
        </div>
        <div>
          <span class="font-medium text-gray-700 dark:text-gray-300">Position Size:</span>
          {{ result.config.posPct }}%
        </div>
        <div>
          <span class="font-medium text-gray-700 dark:text-gray-300">Trend Filter:</span>
          {{ result.config.useTrend ? 'On' : 'Off' }}
        </div>
      </div>
    </div>

    <!-- Trades Table -->
    <div class="bg-base-200/60 rounded-lg shadow-md p-6">
      <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Recent Trades ({{ result.trades.length }} of {{ result.result.tradesCount }})
      </h3>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Time
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Side
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Price
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Quantity
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Note
              </th>
            </tr>
          </thead>
          <tbody class="bg-base-200/60 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="trade in result.trades" :key="trade.time" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ formatDate(trade.time) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="trade.side === 'BUY' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="font-medium">
                  {{ trade.side }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                ${{ trade.price }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {{ trade.qty }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ trade.note }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="result.result.tradesCount > result.trades.length" class="mt-4 text-center">
        <button
          @click="$emit('toggle-all-trades')"
          class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
        >
          {{ showAllTrades ? 'Show Less' : `Show All ${result.result.tradesCount} Trades` }}
        </button>
      </div>
    </div>

    <!-- All Trades (Collapsible) -->
    <div v-if="showAllTrades && result.result.tradesCount > result.trades.length" class="bg-base-200/60 rounded-lg shadow-md p-6">
      <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">All Trades</h3>
      <div class="max-h-96 overflow-y-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Side</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Note</th>
            </tr>
          </thead>
          <tbody class="bg-base-200/60 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="trade in result.allTrades" :key="trade.time">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{{ formatDate(trade.time) }}</td>
              <td class="px-6 py-4 whitespace-nowrap"><span :class="trade.side === 'BUY' ? 'text-green-600' : 'text-red-600'" class="font-medium">{{ trade.side }}</span></td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${{ trade.price }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{{ trade.qty }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ trade.note }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  result: {
    type: Object,
    default: null
  },
  showAllTrades: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-all-trades', 'chart-data-ready'])

const handleChartDataReady = (ready) => {
  emit('chart-data-ready', ready)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

// Buy & Hold Calculations
const buyHoldPnL = computed(() => {
  if (!props.result || !props.result.priceData.length) return 0

  const firstPrice = props.result.priceData[0].price
  const lastPrice = props.result.priceData[props.result.priceData.length - 1].price
  const initialCapital = props.result.config.initialCapital

  // Calculate how many units could be bought initially
  const initialUnits = initialCapital / firstPrice
  const finalValue = initialUnits * lastPrice

  return finalValue - initialCapital
})

// Calculate buy & hold value at the end (for comparison with final portfolio value)
const buyHoldFinalValue = computed(() => {
  if (!props.result || !props.result.priceData.length) return props.result.config.initialCapital

  const firstPrice = props.result.priceData[0].price
  const lastPrice = props.result.priceData[props.result.priceData.length - 1].price
  const initialCapital = props.result.config.initialCapital

  // Calculate how many units could be bought initially
  const initialUnits = initialCapital / firstPrice
  return initialUnits * lastPrice
})

const buyHoldReturn = computed(() => {
  if (!props.result || !props.result.priceData.length) return 0

  const firstPrice = props.result.priceData[0].price
  const lastPrice = props.result.priceData[props.result.priceData.length - 1].price

  return ((lastPrice - firstPrice) / firstPrice) * 100
})

const strategyVsBuyHold = computed(() => {
  if (!props.result) return 0
  // Compare final portfolio value vs buy&hold final value
  return props.result.result.equity - buyHoldFinalValue.value
})

const strategyVsBuyHoldPct = computed(() => {
  if (!props.result || buyHoldFinalValue.value === 0) return 0
  // Calculate percentage difference based on final values
  return ((props.result.result.equity - buyHoldFinalValue.value) / buyHoldFinalValue.value) * 100
})

const winRate = computed(() => {
  if (!props.result || !props.result.allTrades.length) return 0

  const winningTrades = props.result.allTrades.filter(trade =>
    trade.note.includes('TP') || trade.note.includes('trailing stop')
  ).length

  return (winningTrades / props.result.allTrades.length) * 100
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
