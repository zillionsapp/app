<template>
  <section class="card">
    <div class="card-body">
      <h3 class="card-title text-lg">Trading Strategy Selection</h3>
      <p class="text-sm opacity-70 mb-4">
        Choose your preferred trading strategies. You can select multiple approaches:
      </p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          v-for="strategy in strategies"
          :key="strategy.id"
          class="p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md"
          :class="strategy.selected
            ? 'border-red-500 bg-red-900/10'
            : 'border-base-300 bg-base-100 hover:border-base-300/80'"
          @click="emit('toggleStrategy', strategy.id)"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-sm">{{ strategy.name }}</span>
            </div>
            <span v-if="strategy.selected" class="badge badge-error badge-sm">Active</span>
          </div>
          <p class="text-xs opacity-70 mb-2">{{ strategy.description }}</p>
          <div class="flex items-center gap-2">
            <span class="badge badge-xs" :class="strategy.riskClass">{{ strategy.risk }}</span>
            <span class="text-xs opacity-60">{{ strategy.timeframe }}</span>
          </div>
        </div>
      </div>

      <!-- Strategy Performance Overview -->
      <div v-if="selectedStrategies.length > 0" class="mt-4 p-3 bg-gradient-to-r from-base-100 to-base-200/50 rounded-xl border border-base-300">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-medium">Active Strategies Performance ({{ selectedStrategies.length }})</p>
          <span class="text-xs opacity-70">Portfolio Allocation</span>
        </div>

        <div class="space-y-3">
          <div
            v-for="strategy in selectedStrategies"
            :key="strategy.id"
            class="bg-base-100/70 rounded-lg p-3 border border-base-300/50"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-sm">{{ strategy.name }}</span>
                <span class="badge badge-xs" :class="strategy.riskClass">{{ strategy.risk }}</span>
              </div>
              <div class="text-right">
                <span class="text-sm font-semibold text-primary">{{ strategy.allocation || 0 }}%</span>
              </div>
            </div>

            <!-- Strategy Performance Metrics -->
            <div class="grid grid-cols-3 gap-2 mb-3">
              <div class="text-center">
                <div class="text-xs opacity-70 uppercase tracking-wide">24h Return</div>
                <div class="text-sm font-medium" :class="getStrategyReturn(strategy.id, 'daily') >= 0 ? 'text-success' : 'text-error'">
                  {{ getStrategyReturn(strategy.id, 'daily') >= 0 ? '+' : ''}}{{ getStrategyReturn(strategy.id, 'daily').toFixed(2) }}%
                </div>
              </div>
              <div class="text-center">
                <div class="text-xs opacity-70 uppercase tracking-wide">7d Return</div>
                <div class="text-sm font-medium" :class="getStrategyReturn(strategy.id, 'weekly') >= 0 ? 'text-success' : 'text-error'">
                  {{ getStrategyReturn(strategy.id, 'weekly') >= 0 ? '+' : ''}}{{ getStrategyReturn(strategy.id, 'weekly').toFixed(2) }}%
                </div>
              </div>
              <div class="text-center">
                <div class="text-xs opacity-70 uppercase tracking-wide">PnL ($)</div>
                <div class="text-sm font-medium" :class="getStrategyPnL(strategy.id) >= 0 ? 'text-success' : 'text-error'">
                  {{ getStrategyPnL(strategy.id) >= 0 ? '+' : ''}}${{ Math.abs(getStrategyPnL(strategy.id)).toFixed(0) }}
                </div>
              </div>
            </div>

            <!-- Mini performance bar -->
            <div class="w-full bg-base-300/50 rounded-full h-1.5 mb-2">
              <div
                class="h-1.5 rounded-full transition-all duration-300"
                :class="getStrategyReturn(strategy.id, 'weekly') >= 0 ? 'bg-success' : 'bg-error'"
                :style="{ width: `${Math.min(Math.abs(getStrategyReturn(strategy.id, 'weekly')), 100)}%` }"
              ></div>
            </div>

            <!-- Allocation Control -->
            <div class="flex items-center gap-2">
              <span class="text-xs opacity-70">Allocation:</span>
              <input
                type="range"
                min="0"
                :max="getMaxAllocation(strategy.id)"
                :value="strategy.allocation || 0"
                @input="emit('updateAllocation', strategy.id, ($event.target as HTMLInputElement).value)"
                class="range range-xs range-primary flex-1"
                step="5"
              />
              <button @click="emit('toggleStrategy', strategy.id)" class="btn btn-ghost btn-xs">×</button>
            </div>
          </div>

          <!-- Portfolio Summary -->
          <div class="bg-primary/5 rounded-lg p-3 border border-primary/20">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Portfolio Summary:</span>
              <span
                class="text-sm font-semibold"
                :class="totalAllocation === 100 ? 'text-success' : totalAllocation > 100 ? 'text-error' : 'text-warning'"
              >
                {{ totalAllocation }}% {{ totalAllocation !== 100 ? (totalAllocation > 100 ? '(Over-allocated)' : '(Under-allocated)') : '(Balanced)' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Strategy {
  id: string
  name: string
  description: string
  risk: string
  riskClass: string
  timeframe: string
  selected: boolean
  allocation: number
}

interface Props {
  strategies: Strategy[]
  selectedStrategies: Strategy[]
  totalAllocation: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'toggleStrategy', strategyId: string): void
  (e: 'updateAllocation', strategyId: string, value: string): void
  (e: 'getMaxAllocation', strategyId: string): number
}>()

/* Get max allocation for a strategy */
const getMaxAllocation = (strategyId: string) => {
  return emit('getMaxAllocation', strategyId)
}

/* Strategy Performance Functions */
function getStrategyReturn(strategyId: string, period: 'daily' | 'weekly') {
  // Mock data - in real app this would come from API or calculations
  const mockReturns: Record<string, { daily: number; weekly: number }> = {
    'investments': { daily: 0.5, weekly: 2.1 },
    'trading': { daily: -0.3, weekly: 1.8 },
    'sniping': { daily: 1.2, weekly: -1.5 }
  }
  return mockReturns[strategyId]?.[period] || 0
}

function getStrategyPnL(strategyId: string) {
  // Mock data - in real app this would be calculated based on strategy performance
  const mockPnL: Record<string, number> = {
    'investments': 150,
    'trading': -75,
    'sniping': 320
  }
  return mockPnL[strategyId] || 0
}
</script>
