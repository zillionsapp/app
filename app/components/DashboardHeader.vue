<template>
  <div class="flex items-center justify-between py-2">
    <div>
      <h1 class="text-3xl font-bold">Trading Dashboard</h1>
      <p class="opacity-70">
        ${{ totalBalance.toLocaleString() }} Total Balance •
        {{ totalTrades }} Total Trades
      </p>
    </div>
    <!-- <div class="flex items-center gap-4">
      <select class="select select-bordered select-sm">
        <option>Last 7 Days</option>
        <option>Last 30 Days</option>
        <option>Last 90 Days</option>
      </select>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { useDashboard } from '../composables/useDashboard'

const {
  totalBalance,
  totalTrades
} = useDashboard()
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
