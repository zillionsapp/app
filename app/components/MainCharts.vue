<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
import { ref, onMounted } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement
} from 'chart.js'

// Register Chart.js components
Chart.register(
  LineController,
  LineElement,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement
)

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
  // Zella Score Gauge Chart - Custom triangular gauge
  if (zellaScoreCanvas.value) {
    const ctx = zellaScoreCanvas.value.getContext('2d')!
    zellaScoreChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: [81, 19],
            backgroundColor: [
              '#22C55E',
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
    const outerRadius = 120

    // Draw triangular pointer at score position (81/100 * 180 degrees = 145.8 degrees)
    const pointerAngle = (81 / 100) * 180 * (Math.PI / 180) - Math.PI / 2

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(pointerAngle)
    ctx.beginPath()
    ctx.moveTo(0, -5)
    ctx.lineTo(-10, 10)
    ctx.lineTo(10, 10)
    ctx.closePath()
    ctx.fillStyle = '#22C55E'
    ctx.fill()
    ctx.restore()
  }

  // Daily Net Cumulative P&L Chart
  if (cumulativePnLCanvas.value) {
    const ctx = cumulativePnLCanvas.value.getContext('2d')!
    cumulativePnLChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['12/09/2022', '12/09/2022', '12/09/2022', '12/09/2022', '12/09/2022'],
        datasets: [
          {
            label: 'Cumulative P&L',
            data: [200, 150, 50, -50, -200],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
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
            grid: { display: false },
            ticks: { color: '#9CA3AF', font: { size: 10 } },
          },
          y: {
            grid: { color: 'rgba(156, 163, 175, 0.2)' },
            ticks: {
              color: '#9CA3AF',
              callback: (v) => `$${Number(v)}`,
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
  if (dailyPnLCanvas.value) {
    const ctx = dailyPnLCanvas.value.getContext('2d')!
    dailyPnLChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['12/09/2022', '12/09/2022', '12/09/2022', '12/09/2022', '12/09/2022'],
        datasets: [
          {
            label: 'Daily P&L',
            data: [100, 80, -60, 120, -40],
            backgroundColor: [
              '#10B981',
              '#10B981',
              '#EF4444',
              '#10B981',
              '#EF4444',
            ],
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
            grid: { display: false },
            ticks: { color: '#9CA3AF', font: { size: 10 } },
          },
          y: {
            grid: { color: 'rgba(156, 163, 175, 0.2)' },
            ticks: {
              color: '#9CA3AF',
              callback: (v) => `$${Number(v)}`,
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
