<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4">
    <!-- Net P&L -->
    <div class="card bg-base-200 shadow-lg">
      <div class="card-body p-4">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-3 h-3 rounded-full bg-blue-500"></div>
          <span class="text-sm opacity-70">Net P&L</span>
          <div class="ml-auto">
            <div class="dropdown dropdown-end">
              <!-- <div tabindex="0" role="button" class="btn btn-ghost btn-xs">ⓘ</div> -->
              <div class="dropdown-content z-[1] card card-compact p-2 shadow bg-base-100 text-xs">
                <div class="card-body p-2">
                  <p>Total profit and loss</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <div class="text-2xl font-bold text-success">{{ fmtCurrency(netPnl) }}</div>
          <!-- <div class="w-16 h-8">
            <canvas ref="netPnLChart" class="w-full h-full"></canvas>
          </div> -->
        </div>
      </div>
    </div>

    <!-- Trade Expectancy -->
    <div class="card bg-base-200 shadow-lg">
      <div class="card-body p-4">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
          <span class="text-sm opacity-70">Trade Expectancy</span>
          <!-- <div class="ml-auto">
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-ghost btn-xs">ⓘ</div>
            </div>
          </div> -->
        </div>
        <div class="flex items-center justify-between">
          <div class="text-2xl font-bold">${{ fmtNumber(tradeExpectancy) }}</div>
          <!-- <div class="w-16 h-8">
            <canvas ref="tradeExpectancyChart" class="w-full h-full"></canvas>
          </div> -->
        </div>
      </div>
    </div>

    <!-- Profit Factor -->
    <div class="card bg-base-200 shadow-lg">
      <div class="card-body p-4">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-3 h-3 rounded-full bg-purple-500"></div>
          <span class="text-sm opacity-70">Profit Factor</span>
          <!-- <div class="ml-auto">
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-ghost btn-xs">ⓘ</div>
            </div>
          </div> -->
        </div>
        <div class="flex items-center justify-between">
          <div class="text-2xl font-bold">{{ fmtNumber(profitFactor) }}</div>
          <!-- <div class="w-16 h-8">
            <canvas ref="profitFactorChart" class="w-full h-full"></canvas>
          </div> -->
        </div>
      </div>
    </div>

    <!-- Win % -->
    <div class="card bg-base-200 shadow-lg">
      <div class="card-body p-4">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-3 h-3 rounded-full bg-orange-500"></div>
          <span class="text-sm opacity-70">Win %</span>
          <!-- <div class="ml-auto">
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-ghost btn-xs">ⓘ</div>
            </div>
          </div> -->
        </div>
        <div class="flex items-center justify-between">
          <div class="text-2xl font-bold text-info">{{ fmtNumber(winRate) }}%</div>
          <!-- <div class="w-16 h-8">
            <canvas ref="winRateChart" class="w-full h-full"></canvas>
          </div> -->
        </div>
      </div>
    </div>

    <!-- Avg win/loss trade -->
    <div class="card bg-base-200 shadow-lg">
      <div class="card-body p-4">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
          <span class="text-sm opacity-70">Avg win/loss trade</span>
          <!-- <div class="ml-auto">
            <div class="dropdown dropdown-end">
              <div tabindex="0" role="button" class="btn btn-ghost btn-xs">ⓘ</div>
            </div>
          </div> -->
        </div>
        <div class="flex items-center justify-between">
          <div class="text-2xl font-bold">
            <span class="text-success">${{ fmtNumber(avgWin) }}</span>
            <span class="text-error ml-2">${{ fmtNumber(avgLoss) }}</span>
          </div>
          <!-- <div class="w-16 h-8">
            <canvas ref="avgWinLossChart" class="w-full h-full"></canvas>
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Chart, LineController, LineElement } from 'chart.js'

// Register Chart.js components
Chart.register(LineController, LineElement)

// Props
const props = defineProps<{
  netPnl: number
  tradeExpectancy: number
  profitFactor: number
  winRate: number
  avgWin: number
  avgLoss: number
}>()

// Chart refs
const netPnLChart = ref<HTMLCanvasElement | null>(null)
const tradeExpectancyChart = ref<HTMLCanvasElement | null>(null)
const profitFactorChart = ref<HTMLCanvasElement | null>(null)
const winRateChart = ref<HTMLCanvasElement | null>(null)
const avgWinLossChart = ref<HTMLCanvasElement | null>(null)

// Chart instances
let netPnLMiniChart: Chart | null = null
let tradeExpectancyMiniChart: Chart | null = null
let profitFactorMiniChart: Chart | null = null
let winRateMiniChart: Chart | null = null
let avgWinLossMiniChart: Chart | null = null

// Chart lifecycle
onMounted(() => {
  buildCharts()
})

watch([props], () => {
  rebuildCharts()
})

// Chart building
function rebuildCharts() {
  netPnLMiniChart?.destroy?.()
  tradeExpectancyMiniChart?.destroy?.()
  profitFactorMiniChart?.destroy?.()
  winRateMiniChart?.destroy?.()
  avgWinLossMiniChart?.destroy?.()
  buildCharts()
}

function buildCharts() {
  // Generate sample data based on current metrics
  const generateTrendData = (baseValue: number, variance: number = 0.3) => {
    return Array.from({ length: 5 }, (_, i) => {
      const randomFactor = 1 + (Math.random() - 0.5) * variance
      return Math.max(0, baseValue * randomFactor)
    })
  }

  // Net P&L Mini Chart
  if (netPnLChart.value) {
    const ctx = netPnLChart.value.getContext('2d')!
    const pnlData = generateTrendData(Math.abs(props.netPnl) || 100)
    netPnLMiniChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['', '', '', '', ''],
        datasets: [
          {
            data: pnlData,
            borderColor: props.netPnl >= 0 ? '#10B981' : '#EF4444',
            backgroundColor: props.netPnl >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false },
        },
        elements: { point: { radius: 0 } },
      },
    })
  }

  // Trade Expectancy Mini Chart
  if (tradeExpectancyChart.value) {
    const ctx = tradeExpectancyChart.value.getContext('2d')!
    const expectancyData = generateTrendData(Math.abs(props.tradeExpectancy) || 50)
    tradeExpectancyMiniChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['', '', '', '', ''],
        datasets: [
          {
            data: expectancyData,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false },
        },
        elements: { point: { radius: 0 } },
      },
    })
  }

  // Profit Factor Mini Chart
  if (profitFactorChart.value) {
    const ctx = profitFactorChart.value.getContext('2d')!
    const pfData = generateTrendData(props.profitFactor || 1.5, 0.5)
    profitFactorMiniChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['', '', '', '', ''],
        datasets: [
          {
            data: pfData,
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false },
        },
        elements: { point: { radius: 0 } },
      },
    })
  }

  // Win Rate Mini Chart
  if (winRateChart.value) {
    const ctx = winRateChart.value.getContext('2d')!
    const winRateData = generateTrendData(props.winRate || 40, 0.2)
    winRateMiniChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['', '', '', '', ''],
        datasets: [
          {
            data: winRateData,
            borderColor: '#F97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false },
        },
        elements: { point: { radius: 0 } },
      },
    })
  }

  // Avg Win/Loss Mini Chart
  if (avgWinLossChart.value) {
    const ctx = avgWinLossChart.value.getContext('2d')!
    const winData = generateTrendData(props.avgWin || 100, 0.3)
    const lossData = generateTrendData(Math.abs(props.avgLoss) || 80, 0.3)

    avgWinLossMiniChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['', '', '', '', ''],
        datasets: [
          {
            label: 'Avg Win',
            data: winData,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: false,
            tension: 0.4,
            pointRadius: 0,
          },
          {
            label: 'Avg Loss',
            data: lossData.map(v => -v), // Make negative for loss
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: false,
            tension: 0.4,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false },
        },
        elements: { point: { radius: 0 } },
      },
    })
  }
}

// Utility functions
function fmtCurrency(v: number | null | undefined): string {
  const n = Number(v||0)
  const sign = n < 0 ? '-' : ''
  return `${sign}$${Math.abs(n).toFixed(2)}`
}

function fmtNumber(v: number | null | undefined): string {
  const n = Number(v||0)
  return Number.isInteger(n) ? n.toString() : n.toFixed(6)
}
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
