<template>
  <div class="p-4 md:p-6 space-y-6 text-white min-h-screen">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p class="text-lg">Loading dashboard data...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-4">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm">{{ error }}</p>
        </div>
        <div class="ml-auto pl-3">
          <button @click="refresh" class="text-sm text-red-400 hover:text-red-300">
            Retry
          </button>
        </div>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else>
      <!-- Header -->
      <DashboardHeader />

      <!-- Top Stats Cards -->
      <StatsCards
        :net-pnl="netPnl"
        :trade-expectancy="tradeExpectancy"
        :profit-factor="profitFactor"
        :win-rate="winRate"
        :avg-win="avgWin"
        :avg-loss="avgLoss"
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
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useDashboard } from '../composables/useDashboard'

definePageMeta({
  layout: 'app',
  middleware: 'auth'
})


// Composables
const {
  loading,
  error,
  fetchDashboardData,
  refresh,
  netPnl,
  tradeExpectancy,
  profitFactor,
  winRate,
  avgWin,
  avgLoss
} = useDashboard()

// Fetch data on component mount
onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
</style>
