<template>
  <div class="bg-base-100 text-white min-h-screen">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Strategy Backtest
      </h1>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Configuration and Analysis -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Configuration Panel -->
          <div class="bg-base-200/60 rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Strategy Configuration
            </h2>

            <form @submit.prevent="runBacktest" class="space-y-4">
              <!-- Basic Settings -->
              <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">Basic Settings</h3>

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
                    <option value="ADAUSDT">ADAUSDT</option>
                    <option value="SOLUSDT">SOLUSDT</option>
                    <option value="DOTUSDT">DOTUSDT</option>
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
                  @click="resetConfig"
                  class="w-full mt-2 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  Reset to Defaults
                </button>
              </div>
            </form>
          </div>

          <!-- Analysis and Improvement Section -->
          <div v-if="result && !loading" class="bg-base-200/60 rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Strategy Analysis & Improvement</h3>

            <div class="grid grid-cols-1 gap-4 mb-6">
              <button
                @click="analyzeTrades"
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
                @click="improveStrategy"
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
                      <span :class="analysis.profitFactor >= 1.5 ? 'text-green-600' : 'text-red-600'" class="font-medium">
                        {{ analysis.profitFactor.toFixed(2) }}
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
                      @click="applyImprovements"
                      class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                    >
                      Apply These Improvements
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Results Panel -->
        <div class="lg:col-span-2">
          <div v-if="loading" class="bg-base-200/60 rounded-lg shadow-md p-8 text-center">
            <div class="animate-pulse">
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto mb-4"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto mb-8"></div>
              <div class="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div class="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>

          <div v-else-if="result" class="space-y-6">
            <!-- Performance Chart -->
            <BacktestChart
              :trades="result.allTrades"
              :initial-capital="result.config.initialCapital"
              :price-data="result.priceData"
              @data-ready="handleChartDataReady"
            />

            <!-- Summary Cards -->
            <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Portfolio Value</div>
                <div class="text-2xl font-bold text-primary">
                  ${{ result.result.equity.toFixed(2) }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  Final Balance
                </div>
              </div>

              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Strategy PnL</div>
                <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${{ (result.result.equity - result.config.initialCapital).toFixed(2) }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ result.result.retPct.toFixed(2) }}%
                </div>
              </div>

              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Buy & Hold PnL</div>
                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${{ buyHoldPnL.toFixed(2) }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                  {{ buyHoldReturn.toFixed(2) }}%
                </div>
              </div>

              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400">vs Buy & Hold</div>
                <div :class="strategyVsBuyHold >= 0 ? 'text-2xl font-bold text-green-600 dark:text-green-400' : 'text-2xl font-bold text-red-600 dark:text-red-400'">
                  {{ strategyVsBuyHold >= 0 ? '+' : '' }}${{ strategyVsBuyHold.toFixed(2) }}
                </div>
                <div :class="strategyVsBuyHoldPct >= 0 ? 'text-sm text-green-600 dark:text-green-400' : 'text-sm text-red-600 dark:text-red-400'">
                  {{ strategyVsBuyHoldPct >= 0 ? '+' : '' }}{{ strategyVsBuyHoldPct.toFixed(2) }}%
                </div>
              </div>

              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Trades</div>
                <div class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ result.result.tradesCount }}
                </div>
              </div>

              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Win Rate</div>
                <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {{ winRate.toFixed(1) }}%
                </div>
              </div>
            </div>

            <!-- Configuration Summary -->
            <div class="bg-base-200/60 rounded-lg shadow-md p-6">
              <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Configuration Used</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span class="font-medium text-gray-700 dark:text-gray-300">Symbol:</span>
                  {{ result.config.symbol }}
                </div>
                <div>
                  <span class="font-medium text-gray-700 dark:text-gray-300">Timeframe:</span>
                  {{ result.config.tf }}
                </div>
                <div>
                  <span class="font-medium text-gray-700 dark:text-gray-300">HTF:</span>
                  {{ result.config.htf }}
                </div>
                <div>
                  <span class="font-medium text-gray-700 dark:text-gray-300">Capital:</span>
                  ${{ result.config.initialCapital }}
                </div>
                <div>
                  <span class="font-medium text-gray-700 dark:text-gray-300">Position Size:</span>
                  {{ result.config.posPct }}%
                </div>
                <div>
                  <span class="font-medium text-gray-700 dark:text-gray-300">Trend Filter:</span>
                  {{ result.config.useTrend ? 'On' : 'Off' }}
                </div>
              </div>
            </div>

            <!-- Trades Table -->
            <div class="bg-base-200/60 rounded-lg shadow-md p-6">
              <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Recent Trades ({{ result.trades.length }} of {{ result.result.tradesCount }})
              </h3>

              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Time
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Side
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Price
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Note
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-base-200/60 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr v-for="trade in result.trades" :key="trade.time" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {{ formatDate(trade.time) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span :class="trade.side === 'BUY' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="font-medium">
                          {{ trade.side }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ${{ trade.price }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {{ trade.qty }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {{ trade.note }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-if="result.result.tradesCount > result.trades.length" class="mt-4 text-center">
                <button
                  @click="showAllTrades = !showAllTrades"
                  class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                >
                  {{ showAllTrades ? 'Show Less' : `Show All ${result.result.tradesCount} Trades` }}
                </button>
              </div>
            </div>

            <!-- All Trades (Collapsible) -->
            <div v-if="showAllTrades && result.result.tradesCount > result.trades.length" class="bg-base-200/60 rounded-lg shadow-md p-6">
              <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">All Trades</h3>
              <div class="max-h-96 overflow-y-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Side</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Note</th>
                    </tr>
                  </thead>
                  <tbody class="bg-base-200/60 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr v-for="trade in result.allTrades" :key="trade.time">
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{{ formatDate(trade.time) }}</td>
                      <td class="px-6 py-4 whitespace-nowrap"><span :class="trade.side === 'BUY' ? 'text-green-600' : 'text-red-600'" class="font-medium">{{ trade.side }}</span></td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">${{ trade.price }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{{ trade.qty }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ trade.note }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>


          </div>

          <!-- No Results State -->
          <div v-else class="bg-base-200/60 rounded-lg shadow-md p-8 text-center">
            <div class="text-gray-500 dark:text-gray-400">
              <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 class="text-lg font-medium mb-2">No Backtest Results</h3>
              <p class="mb-4">Configure your strategy parameters and run a backtest to see results.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

const loading = ref(false)
const result = ref(null)
const showAllTrades = ref(false)
const analyzing = ref(false)
const improving = ref(false)
const analysis = ref(null)
const improvements = ref(null)

const handleChartDataReady = (ready) => {
  console.log('Chart data ready:', ready)
}

// Default configuration
const defaultConfig = {
  symbol: 'BTCUSDT',
  tf: '15m',
  htf: '1d',
  lookbackDays: 120,
  initialCapital: 1000,
  commissionPct: 0.05,
  slippagePct: 0,
  posPct: 10,
  useTrend: true,
  useHTF: true,
  trendLen: 40,
  upTh: 57.0,
  dnTh: 43.0,
  htfLongTh: 53.0,
  htfShortTh: 47.0,
  obosLen: 12,
  adaptLen: 14,
  showOBOS: true,
  winLen: 20,
  needBars: 4,
  minSpacing: 3,
  enableShorts: false,
  tpPct: 8.0,
  tpPortion: 50.0,
  useTrail: true,
  trailPct: 4.0,
  armTrailPct: 0.8,
  minHoldBars: 2,
  useATRstop: false,
  atrLen: 14,
  atrMult: 3.0,
}

const config = reactive({ ...defaultConfig })

const runBacktest = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/strategy', {
      method: 'POST',
      body: config
    })
    result.value = response
  } catch (error) {
    console.error('Backtest failed:', error)
    // You could add a toast notification here
  } finally {
    loading.value = false
  }
}

const resetConfig = () => {
  Object.assign(config, defaultConfig)
  result.value = null
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

// Buy & Hold Calculations
const buyHoldPnL = computed(() => {
  if (!result.value || !result.value.priceData.length) return 0

  const firstPrice = result.value.priceData[0].price
  const lastPrice = result.value.priceData[result.value.priceData.length - 1].price
  const initialCapital = result.value.config.initialCapital

  // Calculate how many units could be bought initially
  const initialUnits = initialCapital / firstPrice
  const finalValue = initialUnits * lastPrice

  return finalValue - initialCapital
})

const buyHoldReturn = computed(() => {
  if (!result.value || !result.value.priceData.length) return 0

  const firstPrice = result.value.priceData[0].price
  const lastPrice = result.value.priceData[result.value.priceData.length - 1].price

  return ((lastPrice - firstPrice) / firstPrice) * 100
})

const strategyVsBuyHold = computed(() => {
  if (!result.value) return 0
  return result.value.result.equity - result.value.config.initialCapital - buyHoldPnL.value
})

const strategyVsBuyHoldPct = computed(() => {
  if (!result.value || buyHoldReturn.value === 0) return 0
  return result.value.result.retPct - buyHoldReturn.value
})

const winRate = computed(() => {
  if (!result.value || !result.value.allTrades.length) return 0

  const winningTrades = result.value.allTrades.filter(trade =>
    trade.note.includes('TP') || trade.note.includes('trailing stop')
  ).length

  return (winningTrades / result.value.allTrades.length) * 100
})

const analyzeTrades = async () => {
  if (!result.value) return

  analyzing.value = true
  try {
    const response = await $fetch('/api/strategy/analyze', {
      method: 'POST',
      body: {
        trades: result.value.allTrades,
        config: result.value.config,
        performance: {
          totalReturn: result.value.result.retPct,
          totalTrades: result.value.result.tradesCount,
          winRate: winRate.value,
          finalEquity: result.value.result.equity
        }
      }
    })
    analysis.value = response.analysis
  } catch (error) {
    console.error('Trade analysis failed:', error)
    // You could add a toast notification here
  } finally {
    analyzing.value = false
  }
}

const improveStrategy = async () => {
  if (!result.value || !analysis.value) return

  improving.value = true
  try {
    const response = await $fetch('/api/strategy/improve', {
      method: 'POST',
      body: {
        currentConfig: result.value.config,
        analysis: analysis.value,
        trades: result.value.allTrades
      }
    })
    improvements.value = response.improvements
  } catch (error) {
    console.error('Strategy improvement failed:', error)
    // You could add a toast notification here
  } finally {
    improving.value = false
  }
}

const applyImprovements = () => {
  if (!improvements.value) return

  // Apply the suggested parameter changes to the current config
  improvements.value.parameterChanges.forEach(change => {
    if (config.hasOwnProperty(change.param)) {
      config[change.param] = change.newValue
    }
  })

  // Clear the improvements and analysis to reset the state
  improvements.value = null
  analysis.value = null

  // Optionally run a new backtest with the improved parameters
  // runBacktest()
}

// Auto-run backtest on mount with default config
onMounted(() => {
  runBacktest()
})
</script>

<style scoped>
/* Custom scrollbar for trade tables */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.dark .overflow-y-auto::-webkit-scrollbar-track {
  background: #374151;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #6b7280;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
