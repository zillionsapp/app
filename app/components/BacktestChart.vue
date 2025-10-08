<template>
  <div class="bg-base-200 rounded-lg shadow-lg p-6">
    <!-- Header with view toggle -->
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-xl font-bold text-white">
        Performance Chart
      </h3>
    </div>

    <!-- Loading state -->
    <div v-if="!dataReady" class="h-80 flex items-center justify-center">
      <div class="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="text-lg">Loading chart data...</span>
      </div>
    </div>

    <!-- Chart.js Chart Container -->
    <div v-else class="relative w-full" style="height: 400px;">
      <canvas ref="chartCanvas" class="w-full" style="height: 100%; max-height: 400px;"></canvas>

      <!-- Custom Tooltip -->
      <div
        v-if="showTooltip && tooltipData"
        ref="tooltipEl"
        class="absolute bg-black bg-opacity-90 text-white p-3 rounded-lg pointer-events-none z-10 text-sm"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px', minWidth: '220px' }"
      >
        <div class="font-semibold mb-2">{{ tooltipData.date }}</div>
        <div v-if="tooltipData.price" class="text-blue-300 mb-1">
          Price: ${{ tooltipData.price.toFixed(2) }} ({{ tooltipData.pricePct >= 0 ? '+' : '' }}{{ tooltipData.pricePct.toFixed(2) }}%)
        </div>
        <div v-if="tooltipData.portfolio" class="text-green-300 mb-1">
          Portfolio: ${{ tooltipData.portfolio.toFixed(2) }} ({{ tooltipData.portfolioPct >= 0 ? '+' : '' }}{{ tooltipData.portfolioPct.toFixed(2) }}%)
        </div>
        <div v-if="tooltipData.buyHold !== undefined" class="text-gray-300 mb-1">
          Buy & Hold: ${{ tooltipData.buyHold.toFixed(2) }}
        </div>
        <div v-if="tooltipData.vsBuyHold !== undefined" class="mb-1"
             :class="tooltipData.vsBuyHold >= 0 ? 'text-green-300' : 'text-red-300'">
          vs B&H: {{ tooltipData.vsBuyHold >= 0 ? '+' : '' }}${{ tooltipData.vsBuyHold.toFixed(2) }}
          ({{ tooltipData.vsBuyHoldPct >= 0 ? '+' : '' }}{{ tooltipData.vsBuyHoldPct.toFixed(2) }}%)
        </div>
        <div v-if="tooltipData.drawdown !== undefined" class="text-red-300">
          Drawdown: {{ tooltipData.drawdown.toFixed(2) }}%
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
)

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

const chartCanvas = ref(null)
const tooltipEl = ref(null)
const showTooltip = ref(false)
const tooltip = ref({ x: 0, y: 0 })
const tooltipData = ref(null)
const activeView = ref('both')
const dataReady = ref(false)
const chartInstance = ref(null)

// Unified percentage range for both axes
const unifiedPercentRange = computed(() => {
  if (!props.priceData.length) return { min: 0, max: 0 }

  const startPrice = props.priceData[0]?.price || 1
  const initialCapital = props.initialCapital || 1000

  // Calculate percentage changes for both datasets
  const pricePercentages = props.priceData.map(p =>
    startPrice !== 0 ? ((p.price - startPrice) / startPrice) * 100 : 0
  )

  const portfolioPercentages = portfolioValues.value.map(p =>
    initialCapital !== 0 ? ((p.value - initialCapital) / initialCapital) * 100 : 0
  )

  // Combine all percentages to find unified range
  const allPercentages = [...pricePercentages, ...portfolioPercentages]
  const minPercent = Math.min(...allPercentages)
  const maxPercent = Math.max(...allPercentages)

  return { min: minPercent, max: maxPercent }
})

// Chart data for Chart.js
const chartData = computed(() => {
  if (!props.priceData.length) return null

  const labels = props.priceData.map(point =>
    new Date(point.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  )

  const datasets = []

  // Asset price dataset (left axis) - using unified scale
  if (activeView.value === 'price' || activeView.value === 'both') {
    const startPrice = props.priceData[0]?.price || 1
    const pricePercentages = props.priceData.map(p =>
      startPrice !== 0 ? ((p.price - startPrice) / startPrice) * 100 : 0
    )

    datasets.push({
      label: 'Asset Price',
      data: pricePercentages,
      borderColor: '#2563eb',
      backgroundColor: '#2563eb',
      yAxisID: 'y',
      type: 'line',
      pointRadius: 0,
      pointHoverRadius: 0,
      borderWidth: 2.5,
      fill: false
    })
  }

  // Portfolio value dataset (right axis) - using same unified scale
  if (activeView.value === 'portfolio' || activeView.value === 'both') {
    const initialCapital = props.initialCapital || 1000
    const portfolioPercentages = portfolioValues.value.map(p =>
      initialCapital !== 0 ? ((p.value - initialCapital) / initialCapital) * 100 : 0
    )

    datasets.push({
      label: 'Portfolio Value',
      data: portfolioPercentages,
      borderColor: '#059669',
      backgroundColor: '#059669',
      yAxisID: 'y1',
      type: 'line',
      pointRadius: 0,
      pointHoverRadius: 0,
      borderWidth: 2.5,
      fill: false
    })
  }

  return {
    labels,
    datasets
  }
})

// Chart options for Chart.js
const chartOptions = computed(() => ({
  responsive: false,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      enabled: false,
      external: function(context) {
        // Custom tooltip handler
        if (context.tooltip && context.tooltip.dataPoints) {
          const dataPoint = context.tooltip.dataPoints[0]
          const index = dataPoint.dataIndex

          if (props.priceData[index] && portfolioValues.value[index]) {
            const priceData = props.priceData[index]
            const portfolioData = portfolioValues.value[index]
            const buyHoldData = buyHoldValues.value[index]

            const vsBuyHold = portfolioData.value - buyHoldData.value
            const vsBuyHoldPct = buyHoldData.value !== 0 ? (vsBuyHold / buyHoldData.value) * 100 : 0

            // Calculate percentage changes from initial values
            const startPrice = props.priceData[0]?.price || 1
            const initialCapital = props.initialCapital || 1000
            const pricePct = startPrice !== 0 ? ((priceData.price - startPrice) / startPrice) * 100 : 0
            const portfolioPct = initialCapital !== 0 ? ((portfolioData.value - initialCapital) / initialCapital) * 100 : 0

            tooltipData.value = {
              date: new Date(priceData.time).toLocaleString(),
              price: priceData.price,
              pricePct: pricePct,
              portfolio: portfolioData.value,
              portfolioPct: portfolioPct,
              buyHold: buyHoldData.value,
              vsBuyHold: vsBuyHold,
              vsBuyHoldPct: vsBuyHoldPct,
              drawdown: portfolioData.drawdown
            }

            // Position tooltip
            const rect = context.chart.canvas.getBoundingClientRect()
            tooltip.value = {
              x: context.tooltip.x,
              y: context.tooltip.y
            }

            showTooltip.value = true
          }
        } else {
          showTooltip.value = false
        }
      }
    }
  },
  scales: {
    x: {
      display: true,
      grid: {
        display: true,
        color: 'rgba(156, 163, 175, 0.2)'
      },
      ticks: {
        color: 'rgb(156, 163, 175)',
        font: {
          size: 12
        }
      }
    },
    y: {
      type: 'linear',
      display: activeView.value === 'price' || activeView.value === 'both' ? true : false,
      position: 'left',
      min: unifiedPercentRange.value.min,
      max: unifiedPercentRange.value.max,
      title: {
        display: true,
        text: 'Asset Price (%)',
        color: '#2563eb',
        font: {
          size: 12,
          weight: 'bold'
        }
      },
      grid: {
        display: true,
        color: 'rgba(156, 163, 175, 0.2)'
      },
      ticks: {
        color: '#2563eb',
        font: {
          size: 11
        },
        callback: function(value) {
          return (value >= 0 ? '+' : '') + value.toFixed(1) + '%'
        }
      }
    },
    y1: {
      type: 'linear',
      display: activeView.value === 'portfolio' || activeView.value === 'both' ? true : false,
      position: 'right',
      min: unifiedPercentRange.value.min,
      max: unifiedPercentRange.value.max,
      title: {
        display: true,
        text: 'Portfolio Value (%)',
        color: '#059669',
        font: {
          size: 12,
          weight: 'bold'
        }
      },
      grid: {
        display: false
      },
      ticks: {
        color: '#059669',
        font: {
          size: 11
        },
        callback: function(value) {
          return (value >= 0 ? '+' : '') + value.toFixed(1) + '%'
        }
      }
    }
  },
  elements: {
    point: {
      radius: 0
    }
  },
  onHover: (event, elements) => {
    if (elements.length > 0) {
      event.native.target.style.cursor = 'crosshair'
    } else {
      event.native.target.style.cursor = 'default'
    }
  }
}))

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

// Trade markers for Chart.js annotations
const tradeMarkers = computed(() => {
  if (!props.trades.length || !props.priceData.length || !chartInstance.value) return []

  return props.trades.map((trade, index) => {
    const tradeTime = new Date(trade.time).getTime()
    const tradePrice = parseFloat(trade.price)

    // Find the index in price data
    let dataIndex = 0
    for (let i = 0; i < props.priceData.length - 1; i++) {
      const currentTime = new Date(props.priceData[i].time).getTime()
      const nextTime = new Date(props.priceData[i + 1].time).getTime()

      if (tradeTime >= currentTime && tradeTime <= nextTime) {
        dataIndex = i
        break
      }
    }

    // Handle edge cases
    if (dataIndex === 0) {
      if (tradeTime <= new Date(props.priceData[0].time).getTime()) {
        dataIndex = 0
      } else if (tradeTime >= new Date(props.priceData[props.priceData.length - 1].time).getTime()) {
        dataIndex = props.priceData.length - 1
      }
    }

    return {
      id: `trade-${index}`,
      ...trade,
      dataIndex,
      price: tradePrice
    }
  })
})

// Initialize Chart.js chart
const initChart = () => {
  if (!chartCanvas.value || !chartData.value) return

  // Destroy existing chart if it exists
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }

  try {
    const ctx = chartCanvas.value.getContext('2d')

    chartInstance.value = new ChartJS(ctx, {
      type: 'line',
      data: chartData.value,
      options: chartOptions.value
    })

    // Add trade markers as annotations
    if (tradeMarkers.value.length > 0) {
      addTradeMarkers()
    }
  } catch (error) {
    console.error('Failed to initialize Chart.js:', error)
  }
}

// Add trade markers to the chart
const addTradeMarkers = () => {
  if (!chartInstance.value || !tradeMarkers.value.length) return

  // For now, we'll skip the complex annotation setup
  // In a full implementation, you'd use chartjs-plugin-annotation
}

// Watch for data changes and reinitialize chart
watch([() => props.trades, () => props.priceData, () => props.result, activeView], () => {
  dataReady.value = false
  nextTick(() => {
    dataReady.value = true
    setTimeout(() => {
      initChart()
    }, 100)
  })
}, { deep: true })

// Watch for active view changes
watch(activeView, () => {
  if (chartInstance.value) {
    initChart()
  }
})

onMounted(() => {
  dataReady.value = true
  nextTick(() => {
    initChart()
  })
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
