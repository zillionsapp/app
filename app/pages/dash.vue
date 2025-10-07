<template>
  <div class="p-4 md:p-6 space-y-6 text-white min-h-screen">
    <!-- Header -->
    <DashboardHeader />

    <!-- Top Stats Cards -->
    <StatsCards
      :net-pnl="netPnl"
      :trade-expectancy="248.78"
      :profit-factor="1.24"
      :win-rate="39.02"
      :avg-win="34.82"
      :avg-loss="51.32"
    />

    <!-- Main Charts Section -->
    <MainCharts />

    <!-- Bottom Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Open Positions -->
      <OpenPositions />

      <!-- Calendar -->
      <TradingCalendar />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SAMPLE_REPORT } from '../data/sampleReport'
import type { Report } from '../types/report'

// Props
const props = defineProps<{
  report?: Report
}>()

// Computed state
const report = computed((): Report => props.report || SAMPLE_REPORT)

// Metrics
const netPnl = computed(() => Number(report.value.cash || 0) - Number(report.value.deposit || 0))
</script>

<style scoped>
</style>
