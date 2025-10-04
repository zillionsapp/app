<template>
  <div class="bg-base-200/60 rounded-lg shadow-md p-6">
    <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Strategy Analysis & Improvement</h3>

    <div class="grid grid-cols-1 gap-4 mb-6">
      <button
        @click="$emit('analyze-trades')"
        :disabled="analyzing"
        class="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-md transition duration-200 flex items-center justify-center"
      >
        <span v-if="analyzing" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Analyzing Trades...
        </span>
        <span v-else class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          Analyze Trades
        </span>
      </button>

      <button
        @click="$emit('improve-strategy')"
        :disabled="improving || !analysis"
        class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-md transition duration-200 flex items-center justify-center"
      >
        <span v-if="improving" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Improving Strategy...
        </span>
        <span v-else class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          Improve Strategy
        </span>
      </button>

      <button
        @click="$emit('generate-optimal-trades')"
        :disabled="generatingOptimal"
        class="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-md transition duration-200 flex items-center justify-center"
      >
        <span v-if="generatingOptimal" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Generating Optimal Trades...
        </span>
        <span v-else class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
          Generate Optimal Trades
        </span>
      </button>
    </div>

    <!-- Analysis Results -->
    <div v-if="analysis" class="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
      <h4 class="text-md font-semibold mb-3 text-gray-900 dark:text-white">Trade Analysis Results</h4>
      <div class="grid grid-cols-1 gap-4 text-sm">
        <div>
          <h5 class="font-medium text-gray-700 dark:text-gray-300 mb-2">Trade Performance</h5>
          <div class="space-y-1">
            <div class="flex justify-between">
              <span>Total Trades:</span>
              <span class="font-medium">{{ analysis.totalTrades }}</span>
            </div>
            <div class="flex justify-between">
              <span>Win Rate:</span>
              <span :class="analysis.winRate >= 50 ? 'text-green-600' : 'text-red-600'" class="font-medium">
                {{ analysis.winRate.toFixed(1) }}%
              </span>
            </div>
            <div class="flex justify-between">
              <span>Avg Win:</span>
              <span class="text-green-600 font-medium">${{ analysis.avgWin.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Avg Loss:</span>
              <span class="text-red-600 font-medium">${{ analysis.avgLoss.toFixed(2) }}</span>
            </div>
              <div class="flex justify-between">
                <span>Profit Factor:</span>
                <span :class="(analysis.profitFactor || 0) >= 1.5 ? 'text-green-600' : 'text-red-600'" class="font-medium">
                  {{ (analysis.profitFactor || 0).toFixed(2) }}
                </span>
              </div>
          </div>
        </div>

        <!-- Price Pattern Analysis Section -->
        <div v-if="analysis.insights && analysis.insights.some(insight => insight.includes('dip') || insight.includes('peak') || insight.includes('optimal'))">
          <h5 class="font-medium text-gray-700 dark:text-gray-300 mb-2">Dip & Peak Analysis</h5>
          <div class="space-y-2">
            <div v-for="insight in analysis.insights.filter(insight => insight.includes('dip') || insight.includes('peak') || insight.includes('optimal') || insight.includes('recover') || insight.includes('opportunit'))" :key="insight" class="text-gray-600 dark:text-gray-400">
              • {{ insight }}
            </div>
          </div>
        </div>

        <div>
          <h5 class="font-medium text-gray-700 dark:text-gray-300 mb-2">Key Insights</h5>
          <div class="space-y-2">
            <div v-for="insight in analysis.insights.filter(insight => !insight.includes('dip') && !insight.includes('peak') && !insight.includes('optimal') && !insight.includes('recover') && !insight.includes('opportunit'))" :key="insight" class="text-gray-600 dark:text-gray-400">
              • {{ insight }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Optimal Trades Results -->
    <div v-if="optimalTrades" class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 mb-4 border border-purple-200 dark:border-purple-700">
      <h4 class="text-md font-semibold mb-3 text-gray-900 dark:text-white flex items-center">
        <svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
        </svg>
        Optimal Trades Performance
      </h4>

      <!-- Performance Summary -->
      <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div class="bg-white/50 dark:bg-gray-800/50 rounded p-3">
          <div class="text-gray-600 dark:text-gray-400 text-xs">Optimal Return</div>
          <div :class="optimalTrades.performance.totalReturnPct >= 0 ? 'text-green-600' : 'text-red-600'" class="font-bold text-lg">
            {{ optimalTrades.performance.totalReturnPct.toFixed(2) }}%
          </div>
        </div>
        <div class="bg-white/50 dark:bg-gray-800/50 rounded p-3">
          <div class="text-gray-600 dark:text-gray-400 text-xs">vs Buy & Hold</div>
          <div :class="optimalTrades.performance.vsBuyAndHold >= 0 ? 'text-green-600' : 'text-red-600'" class="font-bold text-lg">
            {{ optimalTrades.performance.vsBuyAndHold >= 0 ? '+' : '' }}{{ optimalTrades.performance.vsBuyAndHold.toFixed(2) }}%
          </div>
        </div>
      </div>

      <!-- Opportunities Analysis -->
      <div class="bg-white/30 dark:bg-gray-800/30 rounded p-3 mb-4">
        <h5 class="font-medium text-gray-700 dark:text-gray-300 mb-2 text-xs">Market Opportunities Captured</h5>
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="flex justify-between">
            <span>Best Dips:</span>
            <span class="font-medium text-purple-600">{{ optimalTrades.opportunities.bestDips }}</span>
          </div>
          <div class="flex justify-between">
            <span>Best Peaks:</span>
            <span class="font-medium text-purple-600">{{ optimalTrades.opportunities.bestPeaks }}</span>
          </div>
          <div class="flex justify-between">
            <span>Capture Rate:</span>
            <span class="font-medium text-green-600">100%</span>
          </div>
          <div class="flex justify-between">
            <span>Total Trades:</span>
            <span class="font-medium">{{ optimalTrades.performance.totalTrades }}</span>
          </div>
        </div>
      </div>

      <!-- Trades List -->
      <div class="bg-white/30 dark:bg-gray-800/30 rounded p-3">
        <h5 class="font-medium text-gray-700 dark:text-gray-300 mb-2 text-xs">Optimal Trade Sequence</h5>
        <div class="space-y-1 max-h-32 overflow-y-auto text-xs">
          <div v-for="(trade, index) in optimalTrades.optimalTrades" :key="index"
               :class="trade.type === 'BUY' ? 'text-green-600' : 'text-red-600'"
               class="flex justify-between items-center py-1 px-2 bg-white/20 rounded">
            <div class="flex items-center">
              <span :class="trade.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                    class="px-1.5 py-0.5 rounded text-xs font-medium mr-2">
                {{ trade.type }}
              </span>
              <span class="font-medium">${{ trade.price.toFixed(2) }}</span>
            </div>
            <div class="text-right">
              <div class="font-medium">${{ trade.value.toFixed(0) }}</div>
              <div class="text-gray-500">{{ trade.time }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Insight -->
      <div class="mt-3 p-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-800/30 dark:to-pink-800/30 rounded text-xs text-center">
        <span class="text-purple-700 dark:text-purple-300 font-medium">
          🎯 Perfect Strategy: ${{ optimalTrades.performance.finalValue.toFixed(2) }} final value
          ({{ optimalTrades.performance.totalReturnPct >= 0 ? '+' : '' }}${{ optimalTrades.performance.totalReturn.toFixed(2) }} return)
        </span>
      </div>
    </div>

    <!-- Improvement Suggestions -->
    <div v-if="improvements" class="bg-white dark:bg-gray-800 rounded-lg p-4">
      <h4 class="text-md font-semibold mb-3 text-gray-900 dark:text-white">Strategy Improvements</h4>
      <div class="grid grid-cols-1 gap-4 text-sm">
        <div>
          <h5 class="font-medium text-gray-700 dark:text-gray-300 mb-2">Parameter Changes</h5>
          <div class="space-y-2">
            <div v-for="improvement in improvements.parameterChanges" :key="improvement.param"
                 class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <span>{{ improvement.param }}:</span>
              <div class="text-right">
                <div class="text-gray-500 text-xs">From: {{ improvement.oldValue }}</div>
                <div class="font-medium text-blue-600">To: {{ improvement.newValue }}</div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h5 class="font-medium text-gray-700 dark:text-gray-300 mb-2">Expected Impact</h5>
          <div class="space-y-2">
            <div v-for="impact in improvements.expectedImprovements" :key="impact" class="text-gray-600 dark:text-gray-400">
              • {{ impact }}
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
            <button
              @click="$emit('apply-improvements')"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Apply These Improvements
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  result: {
    type: Object,
    default: null
  },
  analysis: {
    type: Object,
    default: null
  },
  improvements: {
    type: Object,
    default: null
  },
  optimalTrades: {
    type: Object,
    default: null
  },
  analyzing: {
    type: Boolean,
    default: false
  },
  improving: {
    type: Boolean,
    default: false
  },
  generatingOptimal: {
    type: Boolean,
    default: false
  }
})

defineEmits(['analyze-trades', 'improve-strategy', 'apply-improvements', 'generate-optimal-trades'])
</script>
