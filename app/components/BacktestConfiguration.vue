<template>
  <div class="bg-base-200/60 rounded-lg shadow-md p-6">
    <h2 class="text-xl font-semibold mb-4 text-base-content">
      Strategy Configuration
    </h2>

    <!-- Strategy Explanation -->
    <div class="mb-6 p-4 bg-blue-900/20 rounded-lg border border-blue-800">
      <h3 class="text-sm font-semibold text-blue-500 mb-2">BTC Dip-Peak Mean Reversion Strategy</h3>
      <div class="text-sm text-blue-500 space-y-2">
        <p><strong>Mean Reversion Approach:</strong> Buys significant dips and sells peaks in BTCUSDT, capitalizing on price corrections in volatile crypto markets.</p>
        <p><strong>Dip Detection:</strong> Identifies entries when price drops below a threshold from recent highs, using SMA indicators for trend context.</p>
        <p><strong>Peak Exit:</strong> Exits positions on profit targets, overbought signals, or time limits to capture mean-reverting moves.</p>
        <p><strong>Risk Management:</strong> Uses stop-losses, trailing stops after profit, and spacing rules to manage risk and prevent over-trading.</p>
        <p><strong>Position Sizing:</strong> Percentage-based sizing with commission factors for realistic backtesting.</p>
      </div>
    </div>

    <form @submit.prevent="$emit('run-backtest')" class="space-y-4">
      <!-- Basic Settings -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-base-content">Basic Settings</h3>
        <p class="italic">{{ isCustomParameters ? 'Custom Algo Trading Bot Parameters.' : 'Current Zillions Apps default Algo Trading Bot Parameters.' }}</p>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Symbol
          </label>
          <select
            v-model="config.symbol"
            class="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 bg-base-200 text-base-content"
          >
            <option value="BTCUSDT">BTCUSDT</option>
            <option value="ETHUSDT">ETHUSDT</option>
            <option value="SOLUSDT">SOLUSDT</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Timeframe
          </label>
          <select
            v-model="config.tf"
            class="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 bg-base-200 text-base-content"
          >
            <option value="15m">15m</option>
            <option value="30m">30m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
            <option value="1d">1d</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Initial Capital ($)
            </label>
            <input
              v-model.number="config.initialCapital"
              type="number"
              step="100"
              class="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 bg-base-200 text-base-content"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Position Size (%)
            </label>
            <input
              v-model.number="config.posPct"
              type="number"
              step="1"
              max="100"
              class="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 bg-base-200 text-base-content"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Lookback Days
          </label>
          <input
            v-model.number="config.lookbackDays"
            type="number"
            min="30"
            max="365"
            class="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 bg-base-200"
          />
        </div>
      </div>

      <!-- Indicator Settings -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-base-content">Indicator Settings</h3>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              SMA Fast Length
            </label>
            <input
              v-model.number="config.smaFastLen"
              type="number"
              min="5"
              max="50"
              class="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 bg-base-200 text-base-content"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              SMA Slow Length
            </label>
            <input
              v-model.number="config.smaSlowLen"
              type="number"
              min="20"
              max="100"
              class="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 bg-base-200 text-base-content"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              RSI Length
            </label>
            <input
              v-model.number="config.rsiLen"
              type="number"
              min="5"
              max="30"
              class="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 bg-base-200 text-base-content"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              ATR Length
            </label>
            <input
              v-model.number="config.atrLen"
              type="number"
              min="5"
              max="30"
              class="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 bg-base-200 text-base-content"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Dip Period (bars)
            </label>
            <input
              v-model.number="config.dipPeriod"
              type="number"
              min="10"
              max="50"
              class="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 bg-base-200 text-base-content"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Spacing Bars
            </label>
            <input
              v-model.number="config.spacingBars"
              type="number"
              min="1"
              max="20"
              class="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 bg-base-200 text-base-content"
            />
          </div>
        </div>
      </div>

      <!-- Risk Management -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-base-content">Risk Management</h3>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Profit Target %
            </label>
            <input
              v-model.number="config.profitTargetPct"
              type="number"
              step="0.1"
              min="1"
              max="20"
              class="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 bg-base-200 text-base-content"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Stop Loss %
            </label>
            <input
              v-model.number="config.stopLossPct"
              type="number"
              step="0.1"
              min="1"
              max="10"
              class="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 bg-base-200 text-base-content"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Time Exit Bars
            </label>
            <input
              v-model.number="config.timeExitBars"
              type="number"
              min="10"
              max="100"
              class="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 bg-base-200 text-base-content"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Trail Multiplier
            </label>
            <input
              v-model.number="config.trailMult"
              type="number"
              step="0.1"
              min="1"
              max="3"
              class="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 bg-base-200 text-base-content"
            />
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="pt-4">
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 bg-gradient-to-r from-primary via-secondary to-accent animate-gradient disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
        >
          <span v-if="loading" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-base-content" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Running Backtest...
          </span>
          <span v-else>Run Backtest</span>
        </button>

        <button
          type="button"
          @click="$emit('reset-config')"
          class="w-full mt-2 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
        >
          Reset to Defaults
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
const props = defineProps({
  config: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['run-backtest', 'reset-config'])

// Default configuration values - must match parent component defaults
const defaultConfig = {
  symbol: 'BTCUSDT',
  tf: '15m',
  lookbackDays: 120,
  initialCapital: 1000,
  posPct: 10,
  smaFastLen: 20,
  smaSlowLen: 50,
  rsiLen: 14,
  atrLen: 14,
  dipPeriod: 20,
  spacingBars: 8,
  atrAvgPeriod: 50,
  profitTargetPct: 5,
  stopLossPct: 3,
  timeExitBars: 50,
  trailMult: 1.5
}

// Computed property to check if current config differs from defaults
const isCustomParameters = computed(() => {
  return (
    props.config.symbol !== defaultConfig.symbol ||
    props.config.tf !== defaultConfig.tf ||
    props.config.initialCapital !== defaultConfig.initialCapital ||
    props.config.posPct !== defaultConfig.posPct ||
    props.config.lookbackDays !== defaultConfig.lookbackDays ||
    props.config.smaFastLen !== defaultConfig.smaFastLen ||
    props.config.smaSlowLen !== defaultConfig.smaSlowLen ||
    props.config.rsiLen !== defaultConfig.rsiLen ||
    props.config.atrLen !== defaultConfig.atrLen ||
    props.config.dipPeriod !== defaultConfig.dipPeriod ||
    props.config.spacingBars !== defaultConfig.spacingBars ||
    props.config.atrAvgPeriod !== defaultConfig.atrAvgPeriod ||
    props.config.profitTargetPct !== defaultConfig.profitTargetPct ||
    props.config.stopLossPct !== defaultConfig.stopLossPct ||
    props.config.timeExitBars !== defaultConfig.timeExitBars ||
    props.config.trailMult !== defaultConfig.trailMult
  )
})
</script>
