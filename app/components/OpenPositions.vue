<template>
  <div class="card bg-base-200 shadow-lg">
    <div class="card-body">
      <div class="flex items-center justify-between mb-4">
        <h2 class="card-title">Recent Trades</h2>
        <div class="tabs tabs-boxed">
          <a class="tab tab-active">All Trades</a>
          <a class="tab">Winners</a>
          <a class="tab">Losers</a>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>

      <div v-else-if="recentTrades.length === 0" class="text-center py-8 opacity-70">
        <p>No trades found</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th class="text-white">Date</th>
              <th class="text-white">Symbol</th>
              <th class="text-white">Side</th>
              <th class="text-white text-right">Quantity</th>
              <th class="text-white text-right">Price</th>
              <th class="text-white text-right">P&L</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="trade in recentTrades" :key="`${trade.t}-${trade.side}`">
              <td>{{ formatDate(trade.t) }}</td>
              <td>BTCUSDT</td>
              <td>
                <span class="badge" :class="trade.side === 'buy' ? 'badge-success' : 'badge-error'">
                  {{ trade.side.toUpperCase() }}
                </span>
              </td>
              <td class="text-right">{{ formatNumber(trade.qty) }}</td>
              <td class="text-right">${{ formatNumber(trade.px) }}</td>
              <td class="text-right" :class="trade.notional >= 0 ? 'text-success' : 'text-error'">
                ${{ formatNumber(trade.notional) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Summary Stats -->
      <div v-if="recentTrades.length > 0" class="mt-4 pt-4 border-t border-base-300">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div class="opacity-70">Total Trades</div>
            <div class="font-semibold">{{ recentTrades.length }}</div>
          </div>
          <div>
            <div class="opacity-70">Win Rate</div>
            <div class="font-semibold text-success">{{ winRate }}%</div>
          </div>
          <div>
            <div class="opacity-70">Total P&L</div>
            <div class="font-semibold" :class="totalPnL >= 0 ? 'text-success' : 'text-error'">
              ${{ formatNumber(totalPnL) }}
            </div>
          </div>
          <div>
            <div class="opacity-70">Avg Trade</div>
            <div class="font-semibold">${{ formatNumber(avgTradeSize) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDashboard } from '../composables/useDashboard'

const { report, loading } = useDashboard()

// Computed properties
const recentTrades = computed(() => {
  if (!report.value?.markets.SUMMARY) return []
  return report.value.markets.SUMMARY.trades.slice(-20) // Last 20 trades
})

const totalPnL = computed(() => {
  return recentTrades.value.reduce((sum, trade) => sum + trade.notional, 0)
})

const winRate = computed(() => {
  if (recentTrades.value.length === 0) return 0
  const winningTrades = recentTrades.value.filter(trade => trade.notional > 0)
  return Math.round((winningTrades.length / recentTrades.value.length) * 100)
})

const avgTradeSize = computed(() => {
  if (recentTrades.value.length === 0) return 0
  const totalSize = recentTrades.value.reduce((sum, trade) => sum + Math.abs(trade.notional), 0)
  return totalSize / recentTrades.value.length
})

// Utility functions
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit'
  })
}

function formatNumber(value: number): string {
  if (Math.abs(value) < 0.01) return value.toFixed(6)
  if (Math.abs(value) < 1) return value.toFixed(4)
  return value.toFixed(2)
}
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
