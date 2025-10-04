<template>
  <div class="bg-base-200/60 rounded-lg shadow-md p-6">
    <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
      Strategy Configuration
    </h2>

    <!-- Strategy Explanation -->
    <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <h3 class="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">How This Strategy Works</h3>
      <div class="text-sm text-blue-800 dark:text-blue-200 space-y-2">
        <p><strong>Multi-Timeframe Trend Analysis:</strong> Uses ROC (Rate of Change) and EMA indicators to identify the overall trend direction and strength across different timeframes.</p>
        <p><strong>OBOS Signals:</strong> Detects overbought/oversold conditions using RSI and pivot points to find potential entry opportunities when momentum diverges from price.</p>
        <p><strong>HTF Confirmation:</strong> Requires higher timeframe alignment before entering trades, reducing false signals and improving accuracy.</p>
        <p><strong>Risk Management:</strong> Implements trailing stops and take-profit levels to lock in gains while protecting against downside risk.</p>
        <p><strong>Position Sizing:</strong> Uses percentage-based position sizing to maintain consistent risk exposure across different trade sizes.</p>
      </div>
    </div>

    <form @submit.prevent="$emit('run-backtest')" class="space-y-4">
      <!-- Basic Settings -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Basic Settings</h3>
        <p class="italic">{{ isCustomParameters ? 'Custom Algo Trading Bot Parameters.' : 'Current Zillions Apps default Algo Trading Bot Parameters.' }}</p>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Symbol
          </label>
          <select
            v-model="config.symbol"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="BTCUSDT">BTCUSDT</option>
            <option value="ETHUSDT">ETHUSDT</option>
            <option value="SOLUSDT">SOLUSDT</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Timeframe
            </label>
            <select
              v-model="config.tf"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="15m">15m</option>
              <option value="30m">30m</option>
              <option value="1h">1h</option>
              <option value="4h">4h</option>
              <option value="1d">1d</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              HTF
            </label>
            <select
              v-model="config.htf"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="1h">1h</option>
              <option value="4h">4h</option>
              <option value="1d">1d</option>
              <option value="3d">3d</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Initial Capital ($)
            </label>
            <input
              v-model.number="config.initialCapital"
              type="number"
              step="100"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Position Size (%)
            </label>
            <input
              v-model.number="config.posPct"
              type="number"
              step="1"
              max="100"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Lookback Days
          </label>
          <input
            v-model.number="config.lookbackDays"
            type="number"
            min="30"
            max="365"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <!-- Advanced Settings -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Advanced Settings</h3>

        <div class="flex items-center">
          <input
            v-model="config.useTrend"
            type="checkbox"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Use Trend Filter
          </label>
        </div>

        <div class="flex items-center">
          <input
            v-model="config.useHTF"
            type="checkbox"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Use HTF Confirmation
          </label>
        </div>

        <div class="flex items-center">
          <input
            v-model="config.useTrail"
            type="checkbox"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Enable Trailing Stop
          </label>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              TP % (Take Profit)
            </label>
            <input
              v-model.number="config.tpPct"
              type="number"
              step="0.1"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trail % (Stop Loss)
            </label>
            <input
              v-model.number="config.trailPct"
              type="number"
              step="0.1"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="pt-4">
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
        >
          <span v-if="loading" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
  htf: '1h',
  lookbackDays: 120,
  initialCapital: 1000,
  posPct: 10,
  useTrend: true,
  useHTF: true,
  useTrail: true,
  tpPct: 10,
  trailPct: 3.4
}

// Computed property to check if current config differs from defaults
const isCustomParameters = computed(() => {
  return (
    props.config.symbol !== defaultConfig.symbol ||
    props.config.tf !== defaultConfig.tf ||
    props.config.htf !== defaultConfig.htf ||
    props.config.initialCapital !== defaultConfig.initialCapital ||
    props.config.posPct !== defaultConfig.posPct ||
    props.config.lookbackDays !== defaultConfig.lookbackDays ||
    props.config.useTrend !== defaultConfig.useTrend ||
    props.config.useHTF !== defaultConfig.useHTF ||
    props.config.useTrail !== defaultConfig.useTrail ||
    props.config.tpPct !== defaultConfig.tpPct ||
    props.config.trailPct !== defaultConfig.trailPct
  )
})
</script>
