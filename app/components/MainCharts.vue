<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
    <!-- Zella Score -->
    <div class="card bg-base-200 shadow-lg">
      <div class="card-body">
        <h2 class="card-title mb-4">Zella Score</h2>
        <div class="flex items-center justify-center mb-4">
          <div class="relative w-32 h-32">
            <canvas ref="zellaScoreCanvas" class="w-full h-full"></canvas>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <div class="text-2xl font-bold">81</div>
                <div class="text-xs opacity-70">+1</div>
              </div>
            </div>
          </div>
        </div>
        <div class="text-center text-sm opacity-70">
          <div>Avg win/loss</div>
          <div>Profit factor</div>
          <div class="mt-2 text-xs">Your Zella Score: 81 +1</div>
        </div>
      </div>
    </div>

    <!-- Daily Net Cumulative P&L -->
    <div class="card bg-base-200 shadow-lg">
      <div class="card-body">
        <h2 class="card-title">Daily Net Cumulative P&L</h2>
        <div class="h-48 w-full">
          <canvas ref="cumulativePnLCanvas" class="h-full w-full"></canvas>
        </div>
      </div>
    </div>

    <!-- Net Daily P&L -->
    <div class="card bg-base-200 shadow-lg">
      <div class="card-body">
        <h2 class="card-title">Net Daily P&L</h2>
        <div class="h-48 w-full">
          <canvas ref="dailyPnLCanvas" class="h-full w-full"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement
} from 'chart.js'
import { useDashboard } from '../composables/useDashboard'

// Register Chart.js components
Chart.register(
  LineController,
  LineElement,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement
)

// Composables
const { report, loading } = useDashboard()

// Chart refs and instances
const zellaScoreCanvas = ref<HTMLCanvasElement | null>(null)
const cumulativePnLCanvas = ref<HTMLCanvasElement | null>(null)
const dailyPnLCanvas = ref<HTMLCanvasElement | null>(null)
let zellaScoreChart: Chart | null = null
let cumulativePnLChart: Chart | null = null
let dailyPnLChart: Chart | null = null

// Chart lifecycle
onMounted(() => {
  buildCharts()
})

// Chart building
function buildCharts() {
  // Calculate Zella Score based on real metrics
  const calculateZellaScore = () => {
    if (!report.value || !report.value.markets.SUMMARY) return 50

    const trades = report.value.markets.SUMMARY.trades
    if (trades.length === 0) return 50

    const winningTrades = trades.filter(trade => trade.notional > 0)
    const winRate = (winningTrades.length / trades.length) * 100

    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, trade) => sum + trade.notional, 0) / winningTrades.length
      : 0

    const losingTrades = trades.filter(trade => trade.notional <= 0)
    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.notional, 0) / losingTrades.length)
      : 0

    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 10 : 1

    // Zella Score calculation (simplified)
    const score = Math.min(100, Math.max(0,
      (winRate * 0.4) +
      (Math.min(profitFactor, 3) * 33.33 * 0.3) +
      (Math.min(avgWin / Math.max(avgLoss, 1), 3) * 33.33 * 0.3)
    ))

    return Math.round(score)
  }

  const zellaScore = calculateZellaScore()

  // Zella Score Gauge Chart - Custom triangular gauge
  if (zellaScoreCanvas.value) {
    const ctx = zellaScoreCanvas.value.getContext('2d')!
    zellaScoreChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: [zellaScore, 100 - zellaScore],
            backgroundColor: [
              zellaScore >= 70 ? '#22C55E' : zellaScore >= 40 ? '#F59E0B' : '#EF4444',
              '#E5E7EB',
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        rotation: -90,
        circumference: 180,
        cutout: '75%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
      },
    })

    // Draw the triangular pointer
    const centerX = zellaScoreCanvas.value.width / 2
    const centerY = zellaScoreCanvas.value.height / 2

    // Draw triangular pointer at score position
    const pointerAngle = (zellaScore / 100) * 180 * (Math.PI / 180) - Math.PI / 2

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(pointerAngle)
    ctx.beginPath()
    ctx.moveTo(0, -5)
    ctx.lineTo(-10, 10)
    ctx.lineTo(10, 10)
    ctx.closePath()
    ctx.fillStyle = zellaScore >= 70 ? '#22C55E' : zellaScore >= 40 ? '#F59E0B' : '#EF4444'
    ctx.fill()
    ctx.restore()

    // Update the score display in the center
    const scoreElement = zellaScoreCanvas.value?.parentElement?.querySelector('.text-2xl')
    if (scoreElement) {
      scoreElement.textContent = zellaScore.toString()
    }
  }

  // Daily Net Cumulative P&L Chart
  if (cumulativePnLCanvas.value && report.value?.markets.SUMMARY) {
    const ctx = cumulativePnLCanvas.value.getContext('2d')!
    const trades = report.value.markets.SUMMARY.trades.slice(-20) // Last 20 trades

    // Generate cumulative P&L data
    let cumulativePnL = 0
    const cumulativeData = trades.map(trade => {
      cumulativePnL += trade.notional
      return cumulativePnL
    })

    const labels = trades.map(trade =>
      new Date(trade.t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    )

    cumulativePnLChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.length > 0 ? labels : ['No Data'],
        datasets: [
          {
            label: 'Cumulative P&L',
            data: cumulativeData.length > 0 ? cumulativeData : [0],
            borderColor: cumulativeData[cumulativeData.length - 1] >= 0 ? '#10B981' : '#EF4444',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.1,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            type: 'category',
            grid: { display: false },
            ticks: { color: '#9CA3AF', font: { size: 10 } },
          },
          y: {
            type: 'linear',
            grid: { color: 'rgba(156, 163, 175, 0.2)' },
            ticks: {
              color: '#9CA3AF',
              callback: (v) => `$${Number(v).toFixed(0)}`,
              font: { size: 10 }
            },
          },
        },
        elements: {
          point: {
            radius: 0,
          },
        },
      },
    })
  }

  // Net Daily P&L Chart
  if (dailyPnLCanvas.value && report.value?.markets.SUMMARY) {
    const ctx = dailyPnLCanvas.value.getContext('2d')!
    const trades = report.value.markets.SUMMARY.trades.slice(-10) // Last 10 trades

    // Group trades by day and calculate daily P&L
    const dailyData = new Map()
    trades.forEach(trade => {
      const date = new Date(trade.t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!dailyData.has(date)) {
        dailyData.set(date, 0)
      }
      dailyData.set(date, dailyData.get(date) + trade.notional)
    })

    const labels = Array.from(dailyData.keys())
    const data = Array.from(dailyData.values())

    dailyPnLChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['No Data'],
        datasets: [
          {
            label: 'Daily P&L',
            data: data.length > 0 ? data : [0],
            backgroundColor: data.map(value =>
              value >= 0 ? '#10B981' : '#EF4444'
            ),
            borderRadius: 2,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            type: 'category',
            grid: { display: false },
            ticks: { color: '#9CA3AF', font: { size: 10 } },
          },
          y: {
            type: 'linear',
            grid: { color: 'rgba(156, 163, 175, 0.2)' },
            ticks: {
              color: '#9CA3AF',
              callback: (v) => `$${Number(v).toFixed(0)}`,
              font: { size: 10 }
            },
          },
        },
      },
    })
  }
}
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
