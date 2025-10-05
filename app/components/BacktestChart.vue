<template>
  <div class="bg-base-200 rounded-lg shadow-lg p-6">
    <!-- Header with view toggle -->
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-xl font-bold text-white">
        Performance Chart
      </h3>
      <div class="flex rounded-lg p-1">
        <button
          @click="activeView = 'both'"
          :class="activeView === 'both' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
          class="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
        >
          Combined
        </button>
        <button
          @click="activeView = 'price'"
          :class="activeView === 'price' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
          class="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
        >
          Price Only
        </button>
        <button
          @click="activeView = 'portfolio'"
          :class="activeView === 'portfolio' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
          class="px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
        >
          Portfolio Only
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="!dataReady" class="h-80 flex items-center justify-center">
      <div class="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="text-lg">Loading chart data...</span>
      </div>
    </div>

    <!-- Chart container -->
    <div v-else class="relative w-full rounded-lg border-gray-200 dark:border-gray-700 overflow-hidden">
      <svg
        ref="chartSvg"
        :width="svgWidth"
        :height="svgHeight"
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        class="w-full h-auto cursor-crosshair"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <!-- Grid and background -->
        <defs>
          <!-- Grid pattern -->
          <pattern id="chartGrid" :width="gridSize" :height="gridSize" patternUnits="userSpaceOnUse">
            <path
              :d="`M ${gridSize} 0 L 0 0 0 ${gridSize}`"
              fill="none"
              stroke="currentColor"
              stroke-width="0.8"
              class="text-gray-100 dark:text-gray-800"
            />
          </pattern>

          <!-- Gradient for area fill -->
          <linearGradient id="portfolioGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.2" />
            <stop offset="100%" style="stop-color:#10b981;stop-opacity:0.05" />
          </linearGradient>
        </defs>

        <!-- Background -->
        <rect width="100%" height="100%" fill="url(#chartGrid)" />

        <!-- Chart area -->
        <g :transform="`translate(${margin.left}, ${margin.top})`">
          <!-- Portfolio area fill (when showing both) -->
          <path
            v-if="activeView === 'both' && portfolioAreaPath"
            :d="portfolioAreaPath"
            fill="url(#portfolioGradient)"
          />

          <!-- Price line -->
          <path
            v-if="activeView === 'price' || activeView === 'both'"
            :d="pricePath"
            fill="none"
            stroke="#2563eb"
            stroke-width="2.5"
            class="drop-shadow-sm"
          />

          <!-- Portfolio line -->
          <path
            v-if="activeView === 'portfolio' || activeView === 'both'"
            :d="portfolioPath"
            fill="none"
            stroke="#059669"
            stroke-width="2.5"
            class="drop-shadow-sm"
          />

          <!-- Vertical line on hover -->
          <line
            v-if="hoverLine.x !== null"
            :x1="hoverLine.x"
            :y1="0"
            :x2="hoverLine.x"
            :y2="chartHeight"
            stroke="#6b7280"
            stroke-width="1"
            stroke-dasharray="2,2"
            opacity="0.7"
          />

          <!-- Trade markers -->
          <g v-if="tradeMarkers.length > 0">
            <!-- Buy markers (green triangles pointing up) -->
            <g v-for="marker in tradeMarkers.filter(m => m.side === 'BUY')"
               :key="`buy-${marker.id}`"
               class="cursor-pointer transition-all duration-200"
               @mouseenter="showTradeTooltip($event, marker)"
               @mouseleave="showTooltip = false">
              <polygon
                :points="`${marker.x},${marker.y - 8} ${marker.x - 6},${marker.y + 4} ${marker.x + 6},${marker.y + 4}`"
                fill="#059669"
                stroke="#047857"
                stroke-width="1.5"
                class="hover:stroke-2"
              />
              <circle
                :cx="marker.x"
                :cy="marker.y"
                r="2"
                fill="#059669"
                class="opacity-0 hover:opacity-100 transition-opacity"
              />
            </g>

            <!-- Sell markers (red triangles pointing down) -->
            <g v-for="marker in tradeMarkers.filter(m => m.side === 'SELL')"
               :key="`sell-${marker.id}`"
               class="cursor-pointer transition-all duration-200"
               @mouseenter="showTradeTooltip($event, marker)"
               @mouseleave="showTooltip = false">
              <polygon
                :points="`${marker.x},${marker.y + 8} ${marker.x - 6},${marker.y - 4} ${marker.x + 6},${marker.y - 4}`"
                fill="#dc2626"
                stroke="#b91c1c"
                stroke-width="1.5"
                class="hover:stroke-2"
              />
              <circle
                :cx="marker.x"
                :cy="marker.y"
                r="2"
                fill="#dc2626"
                class="opacity-0 hover:opacity-100 transition-opacity"
              />
            </g>
          </g>
        </g>

        <!-- Y-axis labels (Left - Price) -->
        <g v-if="activeView === 'price' || activeView === 'both'" class="text-xs font-medium">
          <text
            v-for="label in leftYLabels"
            :key="`left-${label.value}`"
            :x="margin.left - 8"
            :y="margin.top + label.y"
            text-anchor="end"
            dominant-baseline="middle"
            class="fill-blue-600 dark:fill-blue-400"
          >
            {{ label.text }}
          </text>
        </g>

        <!-- Y-axis labels (Right - Portfolio) -->
        <g v-if="activeView === 'portfolio' || activeView === 'both'" class="text-xs font-medium">
          <text
            v-for="label in rightYLabels"
            :key="`right-${label.value}`"
            :x="svgWidth - margin.right + 8"
            :y="margin.top + label.y"
            text-anchor="start"
            dominant-baseline="middle"
            class="fill-green-600 dark:fill-green-400"
          >
            {{ label.text }}
          </text>
        </g>

        <!-- X-axis labels -->
        <g class="text-xs font-medium fill-gray-600 dark:fill-gray-400">
          <text
            v-for="label in xLabels"
            :key="label.date"
            :x="margin.left + label.x"
            :y="svgHeight - margin.bottom + 20"
            text-anchor="middle"
          >
            {{ label.text }}
          </text>
        </g>

        <!-- Tooltip -->
        <g v-if="showTooltip && tooltipData" :transform="`translate(${tooltip.x}, ${tooltip.y})`">
          <rect
            :x="0"
            :y="0"
            :width="tooltip.width"
            :height="tooltip.height"
            fill="rgba(0,0,0,0.9)"
            rx="8"
            class="text-white"
          />
          <!-- Tooltip content -->
          <text x="12" y="20" class="text-sm font-semibold fill-white">
            {{ tooltipData.date }}
          </text>
          <text v-if="tooltipData.price" x="12" y="38" class="text-sm fill-blue-300">
            Price: ${{ tooltipData.price.toFixed(2) }}
          </text>
          <text v-if="tooltipData.portfolio" x="12" y="56" class="text-sm fill-green-300">
            Portfolio: ${{ tooltipData.portfolio.toFixed(2) }}
          </text>
          <text v-if="tooltipData.buyHold !== undefined" x="12" y="74" class="text-sm fill-gray-300">
            Buy & Hold: ${{ tooltipData.buyHold.toFixed(2) }}
          </text>
          <text v-if="tooltipData.vsBuyHold !== undefined" x="12" y="92"
                :class="tooltipData.vsBuyHold >= 0 ? 'text-sm fill-green-300' : 'text-sm fill-red-300'">
            vs B&H: {{ tooltipData.vsBuyHold >= 0 ? '+' : '' }}${{ tooltipData.vsBuyHold.toFixed(2) }}
            ({{ tooltipData.vsBuyHoldPct >= 0 ? '+' : '' }}{{ tooltipData.vsBuyHoldPct.toFixed(2) }}%)
          </text>
          <text v-if="tooltipData.drawdown !== undefined" x="12" y="110" class="text-sm fill-red-300">
            Drawdown: {{ tooltipData.drawdown.toFixed(2) }}%
          </text>
        </g>
      </svg>

      <!-- Legend -->
      <div class="flex justify-center mt-4 space-x-6 text-sm">
        <div v-if="activeView === 'price' || activeView === 'both'" class="flex items-center">
          <div class="w-4 h-4 bg-blue-600 rounded-full mr-2 shadow-sm"></div>
          <span class="text-gray-700 dark:text-gray-300 font-medium">Asset Price</span>
        </div>
        <div v-if="activeView === 'portfolio' || activeView === 'both'" class="flex items-center">
          <div class="w-4 h-4 bg-green-600 rounded-full mr-2 shadow-sm"></div>
          <span class="text-gray-700 dark:text-gray-300 font-medium">Portfolio Value</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  trades: {
    type: Array,
    default: () => []
  },
  initialCapital: {
    type: Number,
    default: 1000
  },
  priceData: {
    type: Array,
    default: () => []
  },
  result: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['data-ready'])

const chartSvg = ref(null)
const showTooltip = ref(false)
const tooltip = ref({ x: 0, y: 0, width: 200, height: 120 })
const tooltipData = ref(null)
const activeView = ref('both')
const dataReady = ref(false)
const hoverLine = ref({ x: null })

// Chart dimensions and styling
const svgWidth = 900
const svgHeight = 500
const margin = { top: 30, right: 80, bottom: 60, left: 80 }
const chartWidth = svgWidth - margin.left - margin.right
const chartHeight = svgHeight - margin.top - margin.bottom
const gridSize = 25

// Calculate portfolio values with proper backtesting simulation
const portfolioValues = computed(() => {
  if (!props.priceData.length || !props.trades.length) return []

  const values = []
  let cash = props.initialCapital
  let position = 0
  let peakValue = props.initialCapital

  // Sort trades chronologically
  const sortedTrades = [...props.trades].sort((a, b) => new Date(a.time) - new Date(b.time))

  props.priceData.forEach((pricePoint, index) => {
    const currentTime = new Date(pricePoint.time).getTime()
    const currentPrice = pricePoint.price

    // Process trades that occurred at or before this price point
    while (sortedTrades.length > 0 && new Date(sortedTrades[0].time).getTime() <= currentTime) {
      const trade = sortedTrades.shift()
      const tradePrice = parseFloat(trade.price)
      const quantity = parseFloat(trade.qty)

      if (trade.side === 'BUY') {
        const cost = quantity * tradePrice
        const commission = cost * 0.001 // 0.1% commission
        const totalCost = cost + commission

        if (cash >= totalCost) {
          const unitsBought = (cost) / tradePrice
          position += unitsBought
          cash -= totalCost
        }
      } else if (trade.side === 'SELL') {
        const sellValue = quantity * tradePrice
        const commission = sellValue * 0.001
        const netProceeds = sellValue - commission

        if (position >= quantity) {
          position -= quantity
          cash += netProceeds
        }
      }
    }

    // Calculate current portfolio value
    const portfolioValue = cash + (position * currentPrice)

    // Calculate drawdown
    if (portfolioValue > peakValue) {
      peakValue = portfolioValue
    }
    const drawdown = peakValue > 0 ? ((peakValue - portfolioValue) / peakValue) * 100 : 0

    values.push({
      time: pricePoint.time,
      value: portfolioValue,
      drawdown: drawdown,
      cash: cash,
      position: position,
      price: currentPrice
    })
  })

  return values
})

// Calculate buy & hold baseline
const buyHoldValues = computed(() => {
  if (!props.priceData.length || !props.initialCapital) return []

  const firstPrice = props.priceData[0].price
  const units = props.initialCapital / firstPrice

  return props.priceData.map(point => ({
    time: point.time,
    value: units * point.price
  }))
})

// Chart data points
const pricePoints = computed(() => {
  if (!props.priceData.length) return []

  const prices = props.priceData.map(p => p.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice || 1

  return props.priceData.map((point, index) => {
    const x = (index / (props.priceData.length - 1)) * chartWidth
    const y = chartHeight - ((point.price - minPrice) / priceRange) * chartHeight
    return { x, y, price: point.price, time: point.time }
  })
})

const portfolioPoints = computed(() => {
  if (!portfolioValues.value.length) return []

  const values = portfolioValues.value.map(p => p.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = maxValue - minValue || 1

  return portfolioValues.value.map((portfolioValue, index) => {
    const x = (index / (props.priceData.length - 1)) * chartWidth
    const y = chartHeight - ((portfolioValue.value - minValue) / valueRange) * chartHeight
    return {
      x,
      y,
      value: portfolioValue.value,
      time: portfolioValue.time,
      drawdown: portfolioValue.drawdown
    }
  })
})

// Chart paths
const pricePath = computed(() => {
  if (!pricePoints.value.length) return ''
  const points = pricePoints.value.map(p => `${p.x},${p.y}`).join(' L ')
  return `M ${points}`
})

const portfolioPath = computed(() => {
  if (!portfolioPoints.value.length) return ''
  const points = portfolioPoints.value.map(p => `${p.x},${p.y}`).join(' L ')
  return `M ${points}`
})

const portfolioAreaPath = computed(() => {
  if (!portfolioPoints.value.length || activeView.value !== 'both') return ''

  const portfolioPointsList = portfolioPoints.value
  const firstPoint = portfolioPointsList[0]
  const lastPoint = portfolioPointsList[portfolioPointsList.length - 1]

  // Create area path: portfolio line + bottom line + back to start
  const portfolioLine = portfolioPointsList.map(p => `${p.x},${p.y}`).join(' L ')
  return `M ${portfolioLine} L ${lastPoint.x},${chartHeight} L ${firstPoint.x},${chartHeight} Z`
})

// Y-axis labels
const leftYLabels = computed(() => {
  if (!props.priceData.length || (activeView.value !== 'price' && activeView.value !== 'both')) return []

  const prices = props.priceData.map(p => p.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const labels = []

  for (let i = 0; i <= 5; i++) {
    const value = minPrice + ((maxPrice - minPrice) * (5 - i)) / 5
    labels.push({
      value,
      y: (i * chartHeight) / 5,
      text: `$${value.toFixed(0)}`
    })
  }
  return labels
})

const rightYLabels = computed(() => {
  if (!portfolioValues.value.length || (activeView.value !== 'portfolio' && activeView.value !== 'both')) return []

  const values = portfolioValues.value.map(p => p.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const labels = []

  for (let i = 0; i <= 5; i++) {
    const value = minValue + ((maxValue - minValue) * (5 - i)) / 5
    labels.push({
      value,
      y: (i * chartHeight) / 5,
      text: `$${value.toFixed(0)}`
    })
  }
  return labels
})

const xLabels = computed(() => {
  if (!props.priceData.length) return []

  const labels = []
  const numLabels = 6
  const step = Math.floor(props.priceData.length / (numLabels - 1))

  for (let i = 0; i < props.priceData.length && labels.length < numLabels; i += step) {
    const date = new Date(props.priceData[i].time)
    labels.push({
      date: props.priceData[i].time,
      x: (i / (props.priceData.length - 1)) * chartWidth,
      text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })
  }
  return labels
})

// Trade markers with correct positioning
const tradeMarkers = computed(() => {
  if (!props.trades.length || !props.priceData.length) return []

  return props.trades.map((trade, index) => {
    const tradeTime = new Date(trade.time).getTime()
    const tradePrice = parseFloat(trade.price)

    // Find the closest price data points for interpolation
    let x = 0
    let y = 0

    // Find where this trade fits in the price timeline
    for (let i = 0; i < props.priceData.length - 1; i++) {
      const currentTime = new Date(props.priceData[i].time).getTime()
      const nextTime = new Date(props.priceData[i + 1].time).getTime()

      if (tradeTime >= currentTime && tradeTime <= nextTime) {
        // Interpolate between these two points
        const timeRatio = (tradeTime - currentTime) / (nextTime - currentTime)
        x = ((i + timeRatio) / (props.priceData.length - 1)) * chartWidth
        break
      }
    }

    // Handle edge cases
    if (x === 0) {
      if (tradeTime <= new Date(props.priceData[0].time).getTime()) {
        x = 0
      } else if (tradeTime >= new Date(props.priceData[props.priceData.length - 1].time).getTime()) {
        x = chartWidth
      }
    }

    // Calculate Y position based on price
    const prices = props.priceData.map(p => p.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1
    y = chartHeight - ((tradePrice - minPrice) / priceRange) * chartHeight

    return {
      id: `trade-${index}`,
      ...trade,
      x,
      y,
      price: tradePrice
    }
  })
})

// Performance metrics
const maxDrawdown = computed(() => {
  if (!portfolioValues.value.length) return 0
  return Math.min(...portfolioValues.value.map(pv => pv.drawdown))
})

const winRate = computed(() => {
  if (!props.result?.allTrades?.length) return 0

  const trades = props.result.allTrades
  let wins = 0
  let total = 0

  // Simple win rate calculation based on profitable trades
  trades.forEach(trade => {
    if (trade.pnl !== undefined) {
      total++
      if (trade.pnl > 0) wins++
    }
  })

  return total > 0 ? (wins / total) * 100 : 0
})

const sharpeRatio = computed(() => {
  if (!portfolioValues.value.length) return 0

  const returns = []
  for (let i = 1; i < portfolioValues.value.length; i++) {
    const ret = (portfolioValues.value[i].value - portfolioValues.value[i-1].value) / portfolioValues.value[i-1].value
    returns.push(ret)
  }

  if (returns.length === 0) return 0

  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
  const stdDev = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length)

  return stdDev === 0 ? 0 : (avgReturn / stdDev) * Math.sqrt(252)
})

const volatility = computed(() => {
  if (!portfolioValues.value.length) return 0

  const returns = []
  for (let i = 1; i < portfolioValues.value.length; i++) {
    const ret = (portfolioValues.value[i].value - portfolioValues.value[i-1].value) / portfolioValues.value[i-1].value
    returns.push(ret)
  }

  if (returns.length === 0) return 0

  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length
  const stdDev = Math.sqrt(variance)

  return stdDev * Math.sqrt(252) * 100
})

// Mouse event handlers
const handleMouseMove = (event) => {
  const rect = chartSvg.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  // Check if mouse is within chart area
  if (mouseX >= margin.left && mouseX <= svgWidth - margin.right &&
      mouseY >= margin.top && mouseY <= svgHeight - margin.bottom) {

    const chartX = mouseX - margin.left
    hoverLine.value = { x: chartX }

    // Find closest data point
    const totalPoints = props.priceData.length
    const index = Math.round((chartX / chartWidth) * (totalPoints - 1))
    const clampedIndex = Math.max(0, Math.min(totalPoints - 1, index))

    if (props.priceData[clampedIndex] && portfolioValues.value[clampedIndex] && buyHoldValues.value[clampedIndex]) {
      const priceData = props.priceData[clampedIndex]
      const portfolioData = portfolioValues.value[clampedIndex]
      const buyHoldData = buyHoldValues.value[clampedIndex]

      const vsBuyHold = portfolioData.value - buyHoldData.value
      const vsBuyHoldPct = buyHoldData.value !== 0 ? (vsBuyHold / buyHoldData.value) * 100 : 0

      tooltipData.value = {
        date: new Date(priceData.time).toLocaleString(),
        price: priceData.price,
        portfolio: portfolioData.value,
        buyHold: buyHoldData.value,
        vsBuyHold: vsBuyHold,
        vsBuyHoldPct: vsBuyHoldPct,
        drawdown: portfolioData.drawdown
      }

      // Position tooltip
      const tooltipWidth = 220
      const tooltipHeight = 130
      let tooltipX = mouseX + 10
      let tooltipY = mouseY - 10

      // Adjust if tooltip would go off-screen
      if (tooltipX + tooltipWidth > svgWidth) {
        tooltipX = mouseX - tooltipWidth - 10
      }
      if (tooltipY + tooltipHeight > svgHeight) {
        tooltipY = mouseY - tooltipHeight + 20
      }

      tooltip.value = {
        x: tooltipX,
        y: tooltipY,
        width: tooltipWidth,
        height: tooltipHeight
      }

      showTooltip.value = true
    }
  } else {
    hoverLine.value = { x: null }
    showTooltip.value = false
  }
}

const handleMouseLeave = () => {
  hoverLine.value = { x: null }
  showTooltip.value = false
}

const showTradeTooltip = (event, marker) => {
  const rect = chartSvg.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  tooltipData.value = {
    date: new Date(marker.time).toLocaleString(),
    price: marker.price,
    side: marker.side,
    qty: parseFloat(marker.qty),
    value: parseFloat(marker.qty) * marker.price,
    note: marker.note || 'Trade execution'
  }

  // Position tooltip
  const tooltipWidth = 200
  const tooltipHeight = 100
  let tooltipX = mouseX + 10
  let tooltipY = mouseY - 10

  if (tooltipX + tooltipWidth > svgWidth) {
    tooltipX = mouseX - tooltipWidth - 10
  }
  if (tooltipY + tooltipHeight > svgHeight) {
    tooltipY = mouseY - tooltipHeight + 20
  }

  tooltip.value = {
    x: tooltipX,
    y: tooltipY,
    width: tooltipWidth,
    height: tooltipHeight
  }

  showTooltip.value = true
}

// Watch for data changes
watch([() => props.trades, () => props.priceData, () => props.result], () => {
  dataReady.value = false
  nextTick(() => {
    dataReady.value = true
    emit('data-ready', true)
  })
}, { deep: true })

onMounted(() => {
  dataReady.value = true
})
</script>

<style scoped>
.backtest-chart {
  min-height: 500px;
}

svg {
  cursor: crosshair;
}

.drop-shadow-sm {
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.06));
}

.dark .drop-shadow-sm {
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.3)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.2));
}
</style>
