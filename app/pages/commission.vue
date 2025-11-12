<template>
  <div class="text-base-content min-h-screen">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-base-content mb-8">
        Sales Rep Dashboard
      </h1>

      <!-- Referral Code Section -->
      <div class="bg-base-200 rounded-lg shadow-md p-6 mb-8">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Your Referral Code</h2>
          <div class="text-sm text-base-content/70">
            Level: {{ userLevel }} | Total Earnings: ${{ totalEarnings.toLocaleString() }}
          </div>
        </div>

        <div v-if="referralCode" class="flex items-center space-x-4">
          <div class="flex-1">
            <input
              :value="referralLink"
              readonly
              class="w-full px-3 py-2 bg-base-100 border border-gray-600 rounded-md text-base-content font-mono text-sm"
            />
          </div>
          <button
            @click="copyReferralLink"
            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {{ copied ? 'Copied!' : 'Copy Link' }}
          </button>
        </div>

        <div v-else class="text-center py-4">
          <p class="text-gray-500">Loading referral code...</p>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <!-- Left Column: Calculator -->
        <div class="xl:col-span-2 space-y-8">
          <!-- Commission Calculator -->
          <div class="bg-base-200 rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold mb-4">Commission Calculator</h2>

            <div class="space-y-4">
              <!-- Profit Amount -->
              <div>
                <label class="block text-sm font-medium mb-2">Investor Profit Amount ($)</label>
                <input
                  v-model.number="profitAmount"
                  type="number"
                  step="100"
                  min="0"
                  class="w-full px-3 py-2 bg-base-100 border border-gray-600 rounded-md text-base-content"
                  placeholder="Enter profit amount"
                  @input="calculateCommissions"
                />
              </div>

              <!-- Commission Type -->
              <div>
                <label class="block text-sm font-medium mb-2">Commission Type</label>
                <select
                  v-model="commissionType"
                  class="w-full px-3 py-2 bg-base-100 border border-gray-600 rounded-md text-base-content"
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
                    class="w-full px-3 py-2 bg-base-100 border border-gray-600 rounded-md text-base-content"
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
                    class="w-full px-3 py-2 bg-base-100 border border-gray-600 rounded-md text-base-content"
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
                    class="w-full px-3 py-2 bg-base-100 border border-gray-600 rounded-md text-base-content"
                    @input="calculateCommissions"
                  />
                </div>
              </div>

              <!-- Reset Button -->
              <button
                @click="resetDefaults"
                class="w-full bg-blue-600 hover:bg-blue-700 text-base-content font-medium py-2 px-4 rounded-md transition-colors"
              >
                Reset to Defaults
              </button>
            </div>
          </div>

          <!-- Commission Results -->
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

        <!-- Right Column: Referral History -->
        <div class="bg-base-200 rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4">Referral History</h2>

          <div v-if="referrals.length > 0" class="space-y-4">
            <div class="text-sm text-base-content/70 mb-4">
              Total Referrals: {{ referrals.length }} | Your Earnings: ${{ totalEarnings.toLocaleString() }}
            </div>

            <div class="space-y-2 max-h-96 overflow-y-auto">
              <div
                v-for="referral in referrals"
                :key="referral.id"
                class="bg-base-100 rounded-lg p-3"
              >
                <div class="flex justify-between items-start mb-2">
                  <div class="font-medium">{{ referral.email }}</div>
                  <div class="text-sm text-base-content/70">L{{ referral.level }}</div>
                </div>
                <div class="text-sm text-green-400">
                  Earned: ${{ referral.totalEarnings.toLocaleString() }}
                </div>
                <div class="text-xs text-base-content/50 mt-1">
                  {{ new Date(referral.createdAt).toLocaleDateString() }}
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8">
            <p class="text-gray-500">No referrals yet</p>
            <p class="text-sm text-base-content/70 mt-2">Share your referral link to start earning!</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useUser } from '@clerk/vue'

// Protect this page with authentication
definePageMeta({
  layout: 'app',
  middleware: 'auth'
})

const { user } = useUser()

const profitAmount = ref(10000)
const commissionType = ref('sub') // 'direct' or 'sub'
const directRepRate = ref(15)
const subRepRate = ref(10)
const overrideRate = ref(5)

const calculations = ref(null)
const referralCode = ref('')
const userLevel = ref(1)
const totalEarnings = ref(0)
const referrals = ref([])
const copied = ref(false)

const referralLink = computed(() => {
  if (!referralCode.value) return ''
  const baseUrl = window.location.origin
  return `${baseUrl}/sign-up?invite=${referralCode.value}`
})

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

const loadReferralData = async () => {
  if (!user.value?.id) return

  try {
    const userEmail = user.value.primaryEmailAddress?.emailAddress || ''

    // Load referral code
    const codeResponse = await $fetch(`/api/referrals/code?userId=${user.value.id}&email=${encodeURIComponent(userEmail)}`)
    if (codeResponse.success) {
      referralCode.value = codeResponse.referralCode
      userLevel.value = codeResponse.level
      totalEarnings.value = codeResponse.totalEarnings
    }

    // Load referrals
    const listResponse = await $fetch(`/api/referrals/list?userId=${user.value.id}&email=${encodeURIComponent(userEmail)}`)
    if (listResponse.success) {
      referrals.value = listResponse.referrals
      totalEarnings.value = listResponse.totalEarnings
    }
  } catch (error) {
    console.error('Error loading referral data:', error)
  }
}

const copyReferralLink = async () => {
  try {
    await navigator.clipboard.writeText(referralLink.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('Error copying to clipboard:', error)
  }
}

// Watch for user changes
watch(() => user.value?.id, (newUserId) => {
  if (newUserId) {
    loadReferralData()
  }
}, { immediate: true })

// Initialize on mount
calculateCommissions()
</script>

<style scoped>
</style>
