<!-- app/components/DepositModal.vue -->
<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="closeModal"></div>

    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div class="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-base-100 p-6 text-left shadow-xl transition-all">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-base-content">Deposit Funds</h3>
          <button
            @click="closeModal"
            class="text-base-content/60 hover:text-base-content transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Info Text -->
        <div class="mb-6 p-3 bg-info/10 border border-info/20 rounded-lg">
          <div class="text-sm text-base-content/80">
            Paper Trading Mode - Test with virtual funds. No real money required.
          </div>
        </div>

        <!-- User Info -->
        <div class="mb-6 p-3 bg-base-200 rounded-lg">
          <div class="text-sm text-base-content/60 mb-1">Depositing to:</div>
          <div class="font-medium text-base-content">{{ userEmail }}</div>
        </div>

        <!-- Amount Input -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-base-content mb-2">
            Amount ($)
          </label>
          <input
            v-model.number="depositAmount"
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter amount"
            class="w-full px-3 py-2 border border-base-300 rounded-lg bg-base-100 text-base-content focus:ring-2 focus:ring-primary focus:border-transparent"
            :class="{ 'border-error': amountError }"
            @input="clearErrors"
          />
          <div v-if="amountError" class="text-error text-sm mt-1">{{ amountError }}</div>
        </div>

        <!-- Quick Amount Buttons -->
        <div class="mb-6">
          <div class="text-sm font-medium text-base-content mb-2">Quick Select:</div>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="amount in quickAmounts"
              :key="amount"
              @click="depositAmount = amount"
              class="px-3 py-2 text-sm bg-base-200 hover:bg-base-300 rounded-lg transition-colors"
              :class="{ 'bg-primary text-primary-content': depositAmount === amount }"
            >
              ${{ amount }}
            </button>
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg">
          <div class="text-error text-sm">{{ error }}</div>
        </div>

        <!-- Buttons -->
        <div class="flex gap-3">
          <button
            @click="closeModal"
            class="flex-1 px-4 py-2 text-base-content border border-base-300 rounded-lg hover:bg-base-200 transition-colors"
            :disabled="loading"
          >
            Cancel
          </button>
          <button
            @click="handleDeposit"
            class="flex-1 px-4 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="loading || !depositAmount || depositAmount <= 0"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
            <span v-else>Deposit</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWallet } from '@/composables/useWallet'

interface Props {
  show: boolean
  userEmail: string
}

interface Emits {
  (e: 'close'): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { loading, error, deposit, clearError } = useWallet()

const depositAmount = ref<number>(0)
const amountError = ref<string>('')

const quickAmounts = [100, 500, 1000, 2500, 5000]

const clearErrors = () => {
  amountError.value = ''
  clearError()
}

const validateAmount = (): boolean => {
  if (!depositAmount.value || depositAmount.value <= 0) {
    amountError.value = 'Please enter a valid amount greater than 0'
    return false
  }
  return true
}

const handleDeposit = async () => {
  if (!validateAmount()) return

  const success = await deposit({
    amount: depositAmount.value,
    email: props.userEmail
  })

  if (success) {
    emit('success')
    closeModal()
  }
}

const closeModal = () => {
  if (!loading.value) {
    depositAmount.value = 0
    clearErrors()
    emit('close')
  }
}

// Reset form when modal opens
watch(() => props.show, (newShow) => {
  if (newShow) {
    depositAmount.value = 0
    clearErrors()
  }
})
</script>
