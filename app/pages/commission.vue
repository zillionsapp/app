<template>
  <div class="bg-base-300 text-white min-h-screen">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-white mb-8">
        Commission Calculator
      </h1>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left Column: Calculator Inputs -->
        <div class="bg-base-200 rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4">Commission Structure</h2>

          <div class="space-y-4">
            <!-- Profit Amount -->
            <div>
              <label class="block text-sm font-medium mb-2">Investor Profit Amount ($)</label>
              <input
                v-model.number="profitAmount"
                type="number"
                step="100"
                min="0"
                class="w-full px-3 py-2 bg-base-100 border border-gray-600 rounded-md text-white"
                placeholder="Enter profit amount"
                @input="calculateCommissions"
              />
            </div>

            <!-- Commission Type -->
            <div>
              <label class="block text-sm font-medium mb-2">Commission Type</label>
              <select
                v-model="commissionType"
                class="w-full px-3 py-2 bg-base-100 border border-gray-600 rounded-md text-white"
                @change="calculateCommissions"
              >
                <option value="direct">Direct Rep</option>
                <option value="sub">Sub Rep</option>
              </select>
            </div>

            <!-- Commission Rates -->
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Direct Rep (%)</label>
                <input
                  v-model.number="directRepRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  class="w-full px-3 py-2 bg-base-100 border border-gray-600 rounded-md text-white"
                  @input="calculateCommissions"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Sub Rep (%)</label>
                <input
                  v-model.number="subRepRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  class="w-full px-3 py-2 bg-base-100 border border-gray-600 rounded-md text-white"
                  @input="calculateCommissions"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Override (%)</label>
                <input
                  v-model.number="overrideRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  class="w-full px-3 py-2 bg-base-100 border border-gray-600 rounded-md text-white"
                  @input="calculateCommissions"
                />
              </div>
            </div>

            <!-- Reset Button -->
            <button
              @click="resetDefaults"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        <!-- Right Column: Results -->
        <div class="bg-base-200 rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4">Commission Breakdown</h2>

          <div v-if="calculations" class="space-y-4">
            <!-- Total Commission Pool -->
            <div class="bg-base-100 rounded-lg p-4">
              <h3 class="font-semibold text-green-400 mb-2">Total Performance Fee Pool</h3>
              <p class="text-2xl font-bold">${{ calculations.totalCommission.toLocaleString() }}</p>
            </div>

            <!-- Commission Distribution -->
            <div class="space-y-2">
              <div class="flex justify-between items-center py-2 border-b border-gray-600">
                <span>Investor Keeps</span>
                <span class="font-semibold">${{ calculations.investorKeeps.toLocaleString() }}</span>
              </div>
              <div v-if="calculations.type === 'direct'" class="flex justify-between items-center py-2 border-b border-gray-600">
                <span>Direct Rep Commission (L1)</span>
                <span class="font-semibold text-blue-400">${{ calculations.directRepCommission.toLocaleString() }}</span>
              </div>
              <div v-if="calculations.type === 'sub'" class="flex justify-between items-center py-2 border-b border-gray-600">
                <span>Sub Rep Commission (L2)</span>
                <span class="font-semibold text-blue-400">${{ calculations.subRepCommission.toLocaleString() }}</span>
              </div>
              <div v-if="calculations.type === 'sub'" class="flex justify-between items-center py-2 border-b border-gray-600">
                <span>Recruiter Override (L1)</span>
                <span class="font-semibold text-blue-400">${{ calculations.recruiterOverride.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span>Owner Override (L0)</span>
                <span class="font-semibold text-purple-400">${{ calculations.ownerOverride.toLocaleString() }}</span>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8">
            <p class="text-gray-500">Enter a profit amount to see commission calculations</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// Protect this page with authentication
definePageMeta({
  layout: 'app',
  middleware: 'auth'
})

const profitAmount = ref(10000)
const commissionType = ref('sub') // 'direct' or 'sub'
const directRepRate = ref(15)
const subRepRate = ref(10)
const overrideRate = ref(5)

const calculations = ref(null)

const calculateCommissions = () => {
  if (!profitAmount.value || profitAmount.value <= 0) {
    calculations.value = null
    return
  }

  const profit = profitAmount.value

  let directRepCommission = 0
  let subRepCommission = 0
  let recruiterOverride = 0
  let ownerOverride = 0

  if (commissionType.value === 'direct') {
    directRepCommission = profit * (directRepRate.value / 100)
    ownerOverride = profit * (overrideRate.value / 100)
  } else if (commissionType.value === 'sub') {
    subRepCommission = profit * (subRepRate.value / 100)
    recruiterOverride = profit * (overrideRate.value / 100)
    ownerOverride = profit * (overrideRate.value / 100)
  }

  // Total commission pool
  const totalCommission = directRepCommission + subRepCommission + recruiterOverride + ownerOverride

  // Investor keeps the remainder
  const investorKeeps = profit - totalCommission

  calculations.value = {
    totalCommission,
    investorKeeps,
    directRepCommission,
    subRepCommission,
    recruiterOverride,
    ownerOverride,
    type: commissionType.value
  }
}

const resetDefaults = () => {
  profitAmount.value = 10000
  commissionType.value = 'sub'
  directRepRate.value = 15
  subRepRate.value = 10
  overrideRate.value = 5
  calculateCommissions()
}

// Initialize on mount
calculateCommissions()
</script>

<style scoped>
</style>
