<template>
  <div class="bg-base-200 rounded-lg shadow-md p-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Performance Chart
      </h3>
      <div class="flex space-x-2">
        <button
          @click="activeView = 'both'"
          :class="activeView === 'both' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
          class="px-3 py-1 rounded text-sm font-medium"
        >
          Both
        </button>
        <button
          @click="activeView = 'price'"
          :class="activeView === 'price' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
          class="px-3 py-1 rounded text-sm font-medium"
        >
          Price
        </button>
        <button
          @click="activeView = 'portfolio'"
          :class="activeView === 'portfolio' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
          class="px-3 py-1 rounded text-sm font-medium"
        >
          Portfolio
        </button>
      </div>
    </div>

    <div v-if="!dataReady" class="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
      <div class="animate-pulse">Loading chart data...</div>
    </div>

    <div v-else class="relative w-full">
      <svg
        ref="chartSvg"
        width="100%"
        height="100%"
        viewBox="0 0 800 400"
        class="w-full h-auto"
        @mousemove="handleMouseMove"
        @mouseleave="showTooltip = false"
      >
        <!-- Grid lines -->
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="currentColor"
              stroke-width="0.5"
              class="text-gray-200 dark:text-gray-700"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        <!-- Left Y-axis labels (Price) -->
        <g class="text-xs fill-blue-500 dark:fill-blue-400">
          <text v-for="label in leftYLabels" :key="`left-${label.value}`" :x="margin.left - 10" :y="label.y" text-anchor="end" dominant-baseline="middle">
            {{ label.text }}
          </text>
        </g>

        <!-- Right Y-axis labels (Portfolio) -->
        <g v-if="activeView === 'both'" class="text-xs fill-green-500 dark:fill-green-400">
          <text v-for="label in rightYLabels" :key="`right-${label.value}`" :x="width - margin.right + 10" :y="label.y" text-anchor="start" dominant-baseline="middle">
            {{ label.text }}
          </text>
        </g>

        <!-- X-axis labels -->
        <g class="text-xs fill-gray-500 dark:fill-gray-400" :transform="`translate(0, ${height - margin.bottom + 30})`">
          <text v-for="label in xLabels" :key="label.date" :x="label.x" y="20" text-anchor="middle">
            {{ label.text }}
          </text>
        </g>

        <!-- Chart area -->
        <g :transform="`translate(${margin.left}, ${margin.top})`">
          <!-- Price line (blue) -->
          <path
            v-if="activeView === 'price' || activeView === 'both'"
            :d="pricePath"
            fill="none"
            stroke="#3b82f6"
            stroke-width="2"
            class="drop-shadow-sm"
          />

          <!-- Portfolio line (green) -->
          <path
            v-if="activeView === 'portfolio' || activeView === 'both'"
            :d="portfolioPath"
            fill="none"
            stroke="#10b981"
            stroke-width="2"
            class="drop-shadow-sm"
          />

          <!-- Area fill for portfolio vs price -->
          <defs v-if="activeView === 'both'">
            <linearGradient id="portfolioGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.3" />
              <stop offset="100%" style="stop-color:#10b981;stop-opacity:0.05" />
            </linearGradient>
          </defs>

          <!-- Portfolio area fill -->
          <path
            v-if="activeView === 'both' && portfolioPoints.length > 0"
            :d="`${portfolioPath} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`"
            fill="url(#portfolioGradient)"
          />

          <!-- Data points -->
          <g v-if="showPoints">
            <!-- Price points -->
            <circle
              v-for="(point, index) in pricePoints"
              v-if="activeView === 'price' || activeView === 'both'"
              :key="`price-${index}`"
              :cx="point.x"
              :cy="point.y"
              r="3"
              fill="#3b82f6"
              class="cursor-pointer hover:r-5 transition-all"
              @mouseenter="showPointTooltip($event, point, 'price')"
              @mouseleave="showTooltip = false"
            />

            <!-- Portfolio points -->
            <circle
              v-for="(point, index) in portfolioPoints"
              v-if="activeView === 'portfolio' || activeView === 'both'"
              :key="`portfolio-${index}`"
              :cx="point.x"
              :cy="point.y"
              r="3"
              fill="#10b981"
              class="cursor-pointer hover:r-5 transition-all"
              @mouseenter="showPointTooltip($event, point, 'portfolio')"
              @mouseleave="showTooltip = false"
            />
          </g>

          <!-- Trade markers -->
          <g v-if="tradeMarkers.length > 0">
            <!-- Buy markers (green triangles pointing up) -->
            <polygon
              v-for="marker in tradeMarkers.filter(m => m.side === 'BUY')"
              :key="`buy-${marker.index}`"
              :points="`${marker.x},${marker.y - 8} ${marker.x - 6},${marker.y + 4} ${marker.x + 6},${marker.y + 4}`"
              fill="#10b981"
              stroke="#065f46"
              stroke-width="1"
              class="cursor-pointer hover:stroke-2 transition-all"
              @mouseenter="showTradeTooltip($event, marker)"
              @mouseleave="showTooltip = false"
            />

            <!-- Sell markers (red triangles pointing down) -->
            <polygon
              v-for="marker in tradeMarkers.filter(m => m.side === 'SELL')"
              :key="`sell-${marker.index}`"
              :points="`${marker.x},${marker.y + 8} ${marker.x - 6},${marker.y - 4} ${marker.x + 6},${marker.y - 4}`"
              fill="#ef4444"
              stroke="#dc2626"
              stroke-width="1"
              class="cursor-pointer hover:stroke-2 transition-all"
              @mouseenter="showTradeTooltip($event, marker)"
              @mouseleave="showTooltip = false"
            />
          </g>
        </g>

        <!-- Tooltip -->
        <g v-if="showTooltip && tooltipData" :transform="`translate(${tooltip.x}, ${tooltip.y - 10})`">
          <rect
            :x="tooltip.offsetX"
            :y="0"
            :width="tooltipData.buyHold !== undefined ? 220 : 180"
            :height="tooltipData.buyHold !== undefined ? 110 : 80"
            fill="rgba(0,0,0,0.8)"
            rx="4"
            class="text-white"
          />
          <text x="10" y="20" class="text-xs fill-white font-medium">
            {{ tooltipData.date }}
          </text>
          <text v-if="tooltipData.price" x="10" y="35" class="text-xs fill-blue-300">
            Price: ${{ tooltipData.price.toFixed(2) }}
          </text>
          <text v-if="tooltipData.portfolio" x="10" y="50" class="text-xs fill-green-300">
            Portfolio: ${{ tooltipData.portfolio.toFixed(2) }}
          </text>
          <text v-if="tooltipData.vsBuyHold !== undefined" x="10" y="80" :class="tooltipData.vsBuyHold >= 0 ? 'text-xs fill-green-300' : 'text-xs fill-red-300'">
            vs B&H: {{ tooltipData.vsBuyHold >= 0 ? '+' : '' }}${{ tooltipData.vsBuyHold.toFixed(2) }} ({{ tooltipData.vsBuyHoldPct >= 0 ? '+' : '' }}{{ tooltipData.vsBuyHoldPct.toFixed(2) }}%)
          </text>
          <text v-if="tooltipData.buyHold !== undefined" x="10" y="65" class="text-xs fill-gray-300">
            Buy & Hold: ${{ tooltipData.buyHold.toFixed(2) }}
          </text>
          <text v-if="tooltipData.drawdown !== undefined" x="10" y="95" class="text-xs fill-red-300">
            Drawdown: {{ tooltipData.drawdown.toFixed(2) }}%
          </text>
        </g>
      </svg>

      <!-- Legend -->
      <div class="flex justify-center mt-4 space-x-6 text-sm">
        <div v-if="activeView === 'price' || activeView === 'both'" class="flex items-center">
          <div class="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
          <span class="text-gray-700 dark:text-gray-300">Asset Price</span>
        </div>
        <div v-if="activeView === 'portfolio' || activeView === 'both'" class="flex items-center">
          <div class="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
          <span class="text-gray-700 dark:text-gray-300">Portfolio Value</span>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="text-center">
          <div class="text-xs text-gray-500 dark:text-gray-400">Max Drawdown</div>
          <div :class="maxDrawdown >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="font-semibold">
            {{ maxDrawdown.toFixed(2) }}%
          </div>
        </div>
        <div class="text-center">
          <div class="text-xs text-gray-500 dark:text-gray-400">Win Rate</div>
          <div class="text-green-600 dark:text-green-400 font-semibold">
            {{ winRate.toFixed(1) }}%
          </div>
        </div>
        <div class="text-center">
          <div class="text-xs text-gray-500 dark:text-gray-400">Sharpe Ratio</div>
          <div class="text-blue-600 dark:text-blue-400 font-semibold">
            {{ sharpeRatio.toFixed(2) }}
          </div>
        </div>
        <div class="text-center">
          <div class="text-xs text-gray-500 dark:text-gray-400">Volatility</div>
          <div class="text-gray-700 dark:text-gray-300 font-semibold">
            {{ volatility.toFixed(2) }}%
          </div>
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
const tooltip = ref({ x: 0, y: 0 })
const tooltipData = ref(null)
const activeView = ref('both')
const dataReady = ref(false)

// Fixed dimensions for consistent rendering
const width = 800
const height = 400
const margin = { top: 20, right: 60, bottom: 40, left: 60 }
const chartWidth = width - margin.left - margin.right
const chartHeight = height - margin.top - margin.bottom

// Calculate portfolio value over time
const portfolioValues = computed(() => {
  if (!props.trades.length || !props.priceData.length) return []

  const values = []
  let cash = props.initialCapital
  let position = 0
  let avgPrice = 0

  // Sort trades by time
  const sortedTrades = [...props.trades].sort((a, b) => new Date(a.time) - new Date(b.time))

  // Create portfolio value timeline at each price data point
  props.priceData.forEach((pricePoint, index) => {
    const currentTime = pricePoint.time
    let tradeIndex = 0

    // Find all trades that occurred at or before this time
    for (let i = 0; i < sortedTrades.length; i++) {
      if (new Date(sortedTrades[i].time).getTime() <= currentTime) {
        tradeIndex = i
      } else {
        break
      }
    }

    // Process all trades up to this point
    for (let i = 0; i <= tradeIndex; i++) {
      const trade = sortedTrades[i]

      if (trade.side === 'BUY') {
        const qty = parseFloat(trade.qty)
        const price = parseFloat(trade.price)
        const cost = qty * price * (1 + 0.0005) // Including 0.05% commission

        if (cash >= cost) {
          cash -= cost
          const newPosition = position + qty
          avgPrice = position > 0 ? (avgPrice * position + price * qty) / newPosition : price
          position = newPosition
        }
      } else if (trade.side === 'SELL') {
        const qty = parseFloat(trade.qty)
        const price = parseFloat(trade.price)
        const proceeds = qty * price * (1 - 0.0005) // Including 0.05% commission

        cash += proceeds
        position -= qty
      }
    }

    // Calculate portfolio value at this point
    const portfolioValue = cash + (position * pricePoint.price)

    values.push({
      time: currentTime,
      value: portfolioValue,
      drawdown: 0
    })
  })

  // Calculate drawdown
  if (values.length > 0) {
    const peak = Math.max(...values.map(v => v.value))
    values.forEach(v => {
      v.drawdown = ((v.value - peak) / peak) * 100
    })
  }

  return values
})

// Calculate buy & hold value over time
const buyHoldValues = computed(() => {
  if (!props.priceData.length || !props.initialCapital) return []

  const firstPrice = props.priceData[0].price
  const initialUnits = props.initialCapital / firstPrice

  return props.priceData.map((point, index) => {
    const buyHoldValue = initialUnits * point.price
    return {
      time: point.time,
      value: buyHoldValue
    }
  })
})

// Price data points for chart
const pricePoints = computed(() => {
  if (!props.priceData.length) return []

  const prices = props.priceData.map(p => p.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  return props.priceData.map((point, index) => {
    const x = (index / (props.priceData.length - 1)) * chartWidth
    const y = chartHeight - ((point.price - minPrice) / (maxPrice - minPrice)) * chartHeight
    return { x, y, price: point.price, time: point.time }
  })
})

// Portfolio data points for chart
const portfolioPoints = computed(() => {
  if (!portfolioValues.value.length || !props.priceData.length) return []

  const portfolioPrices = portfolioValues.value.map(pv => pv.value)
  const minPortfolio = Math.min(...portfolioPrices)
  const maxPortfolio = Math.max(...portfolioPrices)

  return portfolioValues.value.map((portfolioValue, index) => {
    const x = (index / (props.priceData.length - 1)) * chartWidth
    const y = chartHeight - ((portfolioValue.value - minPortfolio) / (maxPortfolio - minPortfolio)) * chartHeight

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

// Left Y-axis labels (Price)
const leftYLabels = computed(() => {
  if (activeView.value === 'price' || activeView.value === 'both') {
    const priceRange = Math.max(...props.priceData.map(p => p.price)) - Math.min(...props.priceData.map(p => p.price))
    const priceMin = Math.min(...props.priceData.map(p => p.price))

    const labels = []
    for (let i = 0; i <= 5; i++) {
      const value = priceMin + (priceRange * (5 - i)) / 5
      labels.push({
        value,
        y: (i * chartHeight) / 5,
        text: `$${value.toFixed(0)}`
      })
    }
    return labels
  }
  return []
})

// Right Y-axis labels (Portfolio)
const rightYLabels = computed(() => {
  if (activeView.value === 'both') {
    const portfolioRange = Math.max(...portfolioValues.value.map(pv => pv.value)) - Math.min(...portfolioValues.value.map(pv => pv.value))
    const portfolioMin = Math.min(...portfolioValues.value.map(pv => pv.value))

    const labels = []
    for (let i = 0; i <= 5; i++) {
      const value = portfolioMin + (portfolioRange * (5 - i)) / 5
      labels.push({
        value,
        y: (i * chartHeight) / 5,
        text: `$${value.toFixed(0)}`
      })
    }
    return labels
  }
  return []
})

const xLabels = computed(() => {
  if (!props.priceData.length) return []

  const labels = []
  const step = Math.floor(props.priceData.length / 6)

  for (let i = 0; i < props.priceData.length; i += step) {
    const date = new Date(props.priceData[i].time)
    labels.push({
      date: props.priceData[i].time,
      x: (i / (props.priceData.length - 1)) * chartWidth,
      text: date.toLocaleDateString()
    })
  }
  return labels
})

// Performance metrics
const maxDrawdown = computed(() => {
  if (!portfolioValues.value.length) return 0
  return Math.min(...portfolioValues.value.map(pv => pv.drawdown))
})

const winRate = computed(() => {
  if (!props.trades.length) return 0

  const winningTrades = props.trades.filter(trade =>
    trade.note.includes('TP') || trade.note.includes('trailing stop')
  ).length

  return (winningTrades / props.trades.length) * 100
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

  return stdDev === 0 ? 0 : (avgReturn / stdDev) * Math.sqrt(252) // Annualized
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

  return stdDev * Math.sqrt(252) * 100 // Annualized percentage
})

const showPoints = ref(true)

// Calculate trade marker positions on chart
const tradeMarkers = computed(() => {
  if (!props.trades.length || !props.priceData.length) return []

  // Sort trades by time
  const sortedTrades = [...props.trades].sort((a, b) => new Date(a.time) - new Date(b.time))

  // Use the exact same price range calculation as pricePoints for consistency
  const prices = props.priceData.map(p => p.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  return sortedTrades.map((trade, index) => {
    // Find the exact position by interpolating between price data points
    let x = 0
    let y = 0

    if (props.priceData.length === 1) {
      // Single price point
      x = chartWidth / 2
      y = chartHeight - ((parseFloat(trade.price) - minPrice) / (maxPrice - minPrice)) * chartHeight
    } else {
      // Find the two price points to interpolate between
      const tradeTime = new Date(trade.time).getTime()

      // Handle edge cases
      if (tradeTime <= props.priceData[0].time) {
        // Trade before first price point
        x = 0
        y = chartHeight - ((parseFloat(trade.price) - minPrice) / (maxPrice - minPrice)) * chartHeight
      } else if (tradeTime >= props.priceData[props.priceData.length - 1].time) {
        // Trade after last price point
        x = chartWidth
        y = chartHeight - ((parseFloat(trade.price) - minPrice) / (maxPrice - minPrice)) * chartHeight
      } else {
        // Trade between price points - interpolate
        for (let i = 0; i < props.priceData.length - 1; i++) {
          const currentPoint = props.priceData[i]
          const nextPoint = props.priceData[i + 1]

          if (tradeTime >= currentPoint.time && tradeTime <= nextPoint.time) {
            // Interpolate between these two points
            const timeRange = nextPoint.time - currentPoint.time
            const tradeTimeFromStart = tradeTime - currentPoint.time
            const ratio = tradeTimeFromStart / timeRange

            x = (i / (props.priceData.length - 1)) * chartWidth + (ratio * chartWidth / (props.priceData.length - 1))
            y = chartHeight - ((parseFloat(trade.price) - minPrice) / (maxPrice - minPrice)) * chartHeight
            break
          }
        }
      }
    }

    return {
      ...trade,
      index,
      x,
      y,
      closestIndex: Math.round(x / chartWidth * (props.priceData.length - 1))
    }
  })
})

// Event handlers
const handleMouseMove = (event) => {
  const rect = chartSvg.value.getBoundingClientRect()
  const x = event.clientX - rect.left - margin.left
  const y = event.clientY - rect.top - margin.top

  if (x >= 0 && x <= chartWidth && y >= 0 && y <= chartHeight) {
    const tooltipWidth = tooltipData.value?.buyHold !== undefined ? 220 : 180
    const chartRightEdge = width - margin.right

    // Position tooltip to the right by default, but flip to left if it would go off-screen
    let tooltipX = event.clientX - rect.left + 10
    let offsetX = 0

    if (tooltipX + tooltipWidth > chartRightEdge) {
      // Position tooltip to the left of cursor
      tooltipX = event.clientX - rect.left - tooltipWidth - 10
      offsetX = 0
    } else {
      // Position tooltip to the right of cursor
      offsetX = 0
    }

    tooltip.value = {
      x: tooltipX,
      y: event.clientY - rect.top,
      offsetX: offsetX
    }

    // Find closest data point index
    const totalPoints = props.priceData.length
    const index = Math.round((x / chartWidth) * (totalPoints - 1))
    const clampedIndex = Math.max(0, Math.min(totalPoints - 1, index))

    if (props.priceData[clampedIndex] && portfolioValues.value[clampedIndex] && buyHoldValues.value[clampedIndex]) {
      const portfolioValue = portfolioValues.value[clampedIndex].value
      const buyHoldValue = buyHoldValues.value[clampedIndex].value
      const vsBuyHold = portfolioValue - buyHoldValue
      const vsBuyHoldPct = (vsBuyHold / buyHoldValue) * 100

      // Check if this is the final data point and if there are unclosed positions
      const isFinalPoint = clampedIndex === portfolioValues.value.length - 1
      const finalPortfolioValue = isFinalPoint ? props.initialCapital + (props.initialCapital * (props.result?.result?.retPct || 0) / 100) : portfolioValue

      tooltipData.value = {
        date: new Date(props.priceData[clampedIndex].time).toLocaleString(),
        price: props.priceData[clampedIndex].price,
        portfolio: finalPortfolioValue,
        buyHold: buyHoldValue,
        vsBuyHold: finalPortfolioValue - buyHoldValue,
        vsBuyHoldPct: ((finalPortfolioValue - buyHoldValue) / buyHoldValue) * 100,
        drawdown: portfolioValues.value[clampedIndex].drawdown
      }

      showTooltip.value = true
    }
  }
}

const showPointTooltip = (event, point, type) => {
  const tooltipWidth = tooltipData.value?.buyHold !== undefined ? 220 : 180
  const chartRightEdge = width - margin.right

  // Position tooltip to the right by default, but flip to left if it would go off-screen
  let tooltipX = event.clientX + 10
  let offsetX = 0

  if (tooltipX + tooltipWidth > chartRightEdge) {
    // Position tooltip to the left of cursor
    tooltipX = event.clientX - tooltipWidth - 10
    offsetX = 0
  } else {
    // Position tooltip to the right of cursor
    offsetX = 0
  }

  tooltip.value = {
    x: tooltipX,
    y: event.clientY,
    offsetX: offsetX
  }

  // Find the corresponding price data point for this portfolio point
  const pointIndex = portfolioPoints.value.findIndex(p => p.x === point.x && p.y === point.y)
  const pricePoint = props.priceData[pointIndex]
  const buyHoldPoint = buyHoldValues.value[pointIndex]

  if (pricePoint && buyHoldPoint) {
    // Check if this is the final data point and if there are unclosed positions
    const isFinalPoint = pointIndex === portfolioValues.value.length - 1
    const finalPortfolioValue = isFinalPoint ? props.initialCapital + (props.initialCapital * (props.result?.result?.retPct || 0) / 100) : point.value

    tooltipData.value = {
      date: new Date(point.time).toLocaleString(),
      price: pricePoint.price,
      portfolio: finalPortfolioValue,
      buyHold: buyHoldPoint.value,
      vsBuyHold: finalPortfolioValue - buyHoldPoint.value,
      vsBuyHoldPct: ((finalPortfolioValue - buyHoldPoint.value) / buyHoldPoint.value) * 100,
      drawdown: point.drawdown || null
    }
  } else {
    tooltipData.value = {
      date: new Date(point.time).toLocaleString(),
      price: type === 'price' ? point.price : null,
      portfolio: type === 'portfolio' ? point.value : null,
      drawdown: point.drawdown || null
    }
  }
  showTooltip.value = true
}

const showTradeTooltip = (event, marker) => {
  const tooltipWidth = 200
  const chartRightEdge = width - margin.right

  // Position tooltip to the right by default, but flip to left if it would go off-screen
  let tooltipX = event.clientX + 10
  let offsetX = 0

  if (tooltipX + tooltipWidth > chartRightEdge) {
    // Position tooltip to the left of cursor
    tooltipX = event.clientX - tooltipWidth - 10
    offsetX = 0
  } else {
    // Position tooltip to the right of cursor
    offsetX = 0
  }

  tooltip.value = {
    x: tooltipX,
    y: event.clientY,
    offsetX: offsetX
  }

  // Get the corresponding price data point for this trade
  const pricePoint = props.priceData[marker.closestIndex]

  tooltipData.value = {
    date: new Date(marker.time).toLocaleString(),
    price: parseFloat(marker.price),
    side: marker.side,
    qty: parseFloat(marker.qty),
    value: parseFloat(marker.qty) * parseFloat(marker.price),
    note: marker.note || 'No note'
  }

  showTooltip.value = true
}

// Watch for data changes
watch([() => props.trades, () => props.priceData], () => {
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
