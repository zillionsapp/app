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
        <div>
          <h5 class="font-medium text-gray-700 dark:text-gray-300 mb-2">Key Insights</h5>
          <div class="space-y-2">
            <div v-for="insight in analysis.insights" :key="insight" class="text-gray-600 dark:text-gray-400">
              • {{ insight }}
            </div>
          </div>
        </div>
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
  analyzing: {
    type: Boolean,
    default: false
  },
  improving: {
    type: Boolean,
    default: false
  }
})

defineEmits(['analyze-trades', 'improve-strategy', 'apply-improvements'])
</script>
