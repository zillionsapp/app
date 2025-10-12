<template>
  <section class="card">
    <div class="card-body flex flex-wrap">
      <!-- Balance headline -->
      <div class="flex items-baseline justify-between">
        <div>
          <p class="text-sm opacity-70">Total balance</p>
          <h1 class="text-4xl md:text-5xl font-bold tracking-tight mt-1">
            {{ currency }}{{ formatMoney(displayBalance) }}
          </h1>
          <p v-if="latestPrice" class="text-xs opacity-70 mt-1">
            BTC last: ${{ formatMoney(latestPrice!) }} • Bought on {{ depositAt }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-sm opacity-70">Earnings since {{ depositAt }}</p>
          <div class="mt-1 inline-flex items-center gap-2">
            <span
              class="badge"
              :class="earningsUsd >= 0 ? 'badge-success' : 'badge-error'"
            >
              {{ earningsUsd >= 0 ? '+' : '' }}{{ earningsPct.toFixed(2) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Sparkline / area chart -->
      <div class="mt-6 w-full">
        <div class="w-full h-40 md:h-48 rounded-2xl relative overflow-hidden">
          <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="w-full h-full">
            <g opacity="0.15">
              <line v-for="y in 4" :key="'g'+y"
                    :x1="0" :x2="chartWidth"
                    :y1="(chartHeight/4)*y" :y2="(chartHeight/4)*y"
                    stroke="currentColor" />
            </g>
            <path :d="areaPath" fill="currentColor" class="opacity-10" />
            <path :d="linePath" fill="none" stroke="currentColor" stroke-width="2.5" />
            <circle v-if="points.length" :cx="points[points.length-1].x" :cy="points[points.length-1].y" r="3.5" class="text-primary" fill="currentColor"/>
          </svg>

          <!-- period selector -->
          <div class="absolute top-3 right-3 join">
            <button v-for="p in periods" :key="p"
                    class="btn btn-xs join-item"
                    :class="period === p ? 'btn-primary' : 'btn-ghost'"
                    :disabled="loading"
                    @click="emit('setPeriod', p)">{{ p }}</button>
          </div>
        </div>

        <!-- status / error -->
        <div class="text-xs opacity-70 mt-2 min-h-5">
          <span v-if="loading">Updating {{ period }}…</span>
          <span v-else-if="error" class="text-error">Failed to load data: {{ error }}</span>
          <span v-else-if="earningsLoading" class="opacity-70">Calculating earnings…</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Period } from '@/composables/useSeries'

type Point = { x: number; y: number }

interface Props {
  currency: string
  displayBalance: number
  latestPrice: number | null
  period: string
  depositAt: string
  earningsUsd: number
  earningsPct: number
  loading: boolean
  error: string | null
  earningsLoading: boolean
  periods: string[]
  points: Point[]
  chartWidth: number
  chartHeight: number
  areaPath: string
  linePath: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'setPeriod', period: string): void
}>()

/* Utils */
function formatMoney(n: number) {
  const s = Math.abs(n).toFixed(2)
  const parts = s.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const sign = n < 0 ? '-' : ''
  return sign + parts.join('.')
}
</script>
