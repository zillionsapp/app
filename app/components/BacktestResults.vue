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
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="bg-base-200 rounded-lg shadow-md p-4">
        <div class="text-sm font-medium text-gray-400">Portfolio Value</div>
        <div class="text-2xl font-bold text-primary">
          ${{ result.result.equity.toFixed(2) }}
        </div>
        <div class="text-sm text-gray-400">
          Final Balance
        </div>
      </div>

      <div class="bg-base-200 rounded-lg shadow-md p-4">
        <div class="text-sm font-medium text-gray-400">Strategy PnL</div>
        <div class="text-2xl font-bold text-green-400">
          ${{ (result.result.equity - result.config.initialCapital).toFixed(2) }}
        </div>
        <div class="text-sm text-gray-400">
          {{ result.result.retPct.toFixed(2) }}%
        </div>
      </div>

      <div class="bg-base-200 rounded-lg shadow-md p-4">
        <div class="text-sm font-medium text-gray-400">Buy & Hold PnL</div>
        <div class="text-2xl font-bold text-blue-400">
          ${{ buyHoldPnL.toFixed(2) }}
        </div>
        <div class="text-sm text-gray-400">
          {{ buyHoldReturn.toFixed(2) }}%
        </div>
      </div>

      <div class="bg-base-200 rounded-lg shadow-md p-4">
        <div class="text-sm font-medium text-gray-400">vs Buy & Hold</div>
        <div :class="strategyVsBuyHold >= 0 ? 'text-2xl font-bold text-green-400' : 'text-2xl font-bold text-red-400'">
          {{ strategyVsBuyHold >= 0 ? '+' : '' }}${{ strategyVsBuyHold.toFixed(2) }}
        </div>
        <div :class="strategyVsBuyHoldPct >= 0 ? 'text-sm text-green-400' : 'text-sm text-red-400'">
          {{ strategyVsBuyHoldPct >= 0 ? '+' : '' }}{{ strategyVsBuyHoldPct.toFixed(2) }}%
        </div>
      </div>

      <div class="bg-base-200 rounded-lg shadow-md p-4">
        <div class="text-sm font-medium text-gray-400">Win Rate</div>
        <div class="text-2xl font-bold text-purple-400">
          {{ winRate.toFixed(1) }}%
        </div>
      </div>
    </div>

    <!-- Trades Analyzer -->
    <div class="bg-base-200/60 rounded-lg shadow-md p-6">
      <h3 class="text-lg font-semibold mb-4 text-white">Trades Analyzer</h3>
      <!-- Summary Stats -->
      <div class="my-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div class="bg-base-200 rounded-lg p-3">
          <div class="text-gray-400">Total Trades</div>
          <div class="text-lg font-semibold text-white">{{ roundTripTrades.length }}</div>
        </div>
        <div class="bg-green-900/20 rounded-lg p-3">
          <div class="text-gray-400">Winning Trades</div>
          <div class="text-lg font-semibold text-green-400">{{ winningTrades }}</div>
        </div>
        <div class="bg-red-900/20 rounded-lg p-3">
          <div class="text-gray-400">Losing Trades</div>
          <div class="text-lg font-semibold text-red-400">{{ losingTrades }}</div>
        </div>
        <div class="bg-blue-900/20 rounded-lg p-3">
          <div class="text-gray-400">Win Rate</div>
          <div class="text-lg font-semibold text-blue-400">{{ winRate.toFixed(1) }}%</div>
        </div>
      </div>
      
      <!-- Trades Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-700">
          <thead class="bg-base-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Trade #
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Entry Time
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Exit Time
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Duration
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Entry Price
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Exit Price
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Quantity
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                P&L ($)
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                P&L (%)
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Result
              </th>
            </tr>
          </thead>
          <tbody class="bg-base-200/60 divide-y divide-gray-700">
            <tr v-for="(roundTrip, index) in roundTripTrades" :key="index" :class="roundTrip.pnl >= 0 ? 'bg-success/10' : 'bg-error/10'">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                {{ index + 1 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                {{ formatDate(roundTrip.entryTime) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                {{ formatDate(roundTrip.exitTime) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                {{ roundTrip.duration }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                ${{ roundTrip.entryPrice }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                ${{ roundTrip.exitPrice }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-white">
                {{ roundTrip.quantity }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" :class="roundTrip.pnl >= 0 ? 'text-green-400' : 'text-red-400'">
                ${{ roundTrip.pnl.toFixed(2) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" :class="roundTrip.pnlPct >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ roundTrip.pnlPct.toFixed(2) }}%
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="roundTrip.pnl >= 0 ? 'bg-success text-green-100' : 'bg-error text-red-100'" class="px-2 py-1 text-xs font-medium rounded-full">
                  {{ roundTrip.pnl >= 0 ? 'PROFIT' : 'LOSS' }}
                </span>
              </td>
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

// Buy & Hold Calculations - FIXED to match chart calculations
const buyHoldPnL = computed(() => {
  if (!props.result || !props.result.priceData.length) return 0

  const firstPrice = props.result.priceData[0].price
  const lastPrice = props.result.priceData[props.result.priceData.length - 1].price
  const initialCapital = props.result.config.initialCapital

  // Calculate how many units could be bought initially (no commission for buy & hold)
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

  // Calculate how many units could be bought initially (no commission for buy & hold)
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

// Round-trip trades analysis
const roundTripTrades = computed(() => {
  if (!props.result || !props.result.allTrades.length) return []

  const trades = props.result.allTrades
  const roundTrips = []
  let currentPosition = null
  let entryTrade = null
  let totalQuantity = 0
  let totalCost = 0

  for (const trade of trades) {
    if (trade.side === 'BUY' && trade.note === 'entry') {
      // Starting a new position
      if (currentPosition) {
        // Close previous position if exists
        closeCurrentPosition()
      }
      currentPosition = 'long'
      entryTrade = trade
      totalQuantity = parseFloat(trade.qty)
      totalCost = parseFloat(trade.price) * totalQuantity
    } else if (trade.side === 'SELL' && currentPosition === 'long') {
      // Exiting or reducing position
      const sellQuantity = parseFloat(trade.qty)
      const sellValue = parseFloat(trade.price) * sellQuantity

      if (sellQuantity >= totalQuantity) {
        // Full exit
        const pnl = sellValue - (totalCost * (sellQuantity / totalQuantity))
        const pnlPct = (pnl / (totalCost * (sellQuantity / totalQuantity))) * 100

        roundTrips.push({
          entryTime: entryTrade.time,
          exitTime: trade.time,
          duration: calculateDuration(entryTrade.time, trade.time),
          entryPrice: parseFloat(entryTrade.price),
          exitPrice: parseFloat(trade.price),
          quantity: totalQuantity,
          pnl: pnl,
          pnlPct: pnlPct
        })

        currentPosition = null
        entryTrade = null
        totalQuantity = 0
        totalCost = 0
      } else {
        // Partial exit - reduce position
        const exitRatio = sellQuantity / totalQuantity
        const exitCost = totalCost * exitRatio
        const pnl = sellValue - exitCost
        const pnlPct = (pnl / exitCost) * 100

        roundTrips.push({
          entryTime: entryTrade.time,
          exitTime: trade.time,
          duration: calculateDuration(entryTrade.time, trade.time),
          entryPrice: parseFloat(entryTrade.price),
          exitPrice: parseFloat(trade.price),
          quantity: sellQuantity,
          pnl: pnl,
          pnlPct: pnlPct
        })

        // Reduce remaining position
        totalQuantity -= sellQuantity
        totalCost -= exitCost
      }
    }
  }

  // Close any remaining position at EOD
  if (currentPosition && entryTrade) {
    closeCurrentPosition()
  }

  return roundTrips

  function closeCurrentPosition() {
    // Find the last price for EOD close
    const lastPrice = props.result.priceData.length > 0
      ? props.result.priceData[props.result.priceData.length - 1].price
      : entryTrade.price

    const pnl = (parseFloat(lastPrice) * totalQuantity) - totalCost
    const pnlPct = (pnl / totalCost) * 100

    roundTrips.push({
      entryTime: entryTrade.time,
      exitTime: trades[trades.length - 1].time,
      duration: calculateDuration(entryTrade.time, trades[trades.length - 1].time),
      entryPrice: parseFloat(entryTrade.price),
      exitPrice: parseFloat(lastPrice),
      quantity: totalQuantity,
      pnl: pnl,
      pnlPct: pnlPct
    })
  }

  function calculateDuration(entryTime, exitTime) {
    const entry = new Date(entryTime)
    const exit = new Date(exitTime)
    const diffMs = exit - entry

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }
})

const winningTrades = computed(() => {
  return roundTripTrades.value.filter(trade => trade.pnl > 0).length
})

const losingTrades = computed(() => {
  return roundTripTrades.value.filter(trade => trade.pnl < 0).length
})

const winRate = computed(() => {
  if (roundTripTrades.value.length === 0) return 0
  return (winningTrades.value / roundTripTrades.value.length) * 100
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
