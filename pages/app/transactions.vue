<script setup lang="ts">
definePageMeta({
  layout: 'app',
  middleware: 'auth'
})

// Modal states
const showDepositModal = ref(false)
const showWithdrawModal = ref(false)
const showSendModal = ref(false)

// Form data
const depositAmount = ref('')
const withdrawAmount = ref('')
const sendAmount = ref('')
const sendRecipient = ref('')

// Loading states
const loading = ref(true)
const depositLoading = ref(false)
const withdrawLoading = ref(false)
const sendLoading = ref(false)

// Pagination
const currentPage = ref(1)
const pageSize = ref(20)
const totalTransactions = ref(0)

// Fetch all transactions (we'll paginate on frontend for correct balances)
const { data: transactionsData, pending: transactionsPending, refresh: refreshTransactions } = useFetch('/api/wallet/transactions?limit=1000')
const { data: pnlData, pending: pnlPending, refresh: refreshPnl } = useFetch('/api/wallet/pnl?limit=1000')
const { data: walletData } = useFetch('/api/wallet/summary')

// Watch for data changes to set loading state
watch([transactionsData, pnlData], () => {
  if (transactionsData.value && pnlData.value) {
    loading.value = false
  }
}, { immediate: true })

// Also watch pending states
watch([transactionsPending, pnlPending], () => {
  if (!transactionsPending.value && !pnlPending.value) {
    loading.value = false
  }
}, { immediate: true })

// Combine all transactions
const allTransactions = computed(() => {
  const walletTxs = (transactionsData.value as any)?.transactions || []
  const pnlTxs = (pnlData.value as any)?.transactions || []
  const combined = [...walletTxs, ...pnlTxs]
  totalTransactions.value = combined.length
  return combined
})

// Paginated transactions for display
const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return transactionsWithBalance.value.slice(start, end)
})

// Calculate running balance for all transactions (chronological order)
const transactionsWithBalance = computed(() => {
  // Sort by timestamp ascending (oldest first) for balance calculation
  const sortedForBalance = allTransactions.value.sort((a, b) => a.timestamp - b.timestamp)

  let cashBalance = 0
  const transactionsWithCalculatedBalance = sortedForBalance.map((tx: any) => {
    cashBalance += tx.amountChange || 0
    return {
      ...tx,
      balance: `$${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  })

  // Set loading to false when we have data
  if (transactionsWithCalculatedBalance.length > 0 || (!transactionsPending.value && !pnlPending.value)) {
    loading.value = false
  }

  // Return sorted by timestamp descending (newest first) for display
  return transactionsWithCalculatedBalance.sort((a, b) => b.timestamp - a.timestamp)
})

// Modal functions
const closeModals = () => {
  showDepositModal.value = false
  showWithdrawModal.value = false
  showSendModal.value = false
  depositAmount.value = ''
  withdrawAmount.value = ''
  sendAmount.value = ''
  sendRecipient.value = ''
}

const handleDeposit = async () => {
  if (!depositAmount.value || parseFloat(depositAmount.value) <= 0) return

  depositLoading.value = true
  try {
    const response = await $fetch('/api/wallet/deposit', {
      method: 'POST',
      body: { amount: parseFloat(depositAmount.value) }
    })

    if (response.success) {
      await refreshTransactions()
      await refreshPnl()
      closeModals()
    }
  } catch (error: any) {
    console.error('Deposit error:', error)
  } finally {
    depositLoading.value = false
  }
}

const handleWithdraw = async () => {
  if (!withdrawAmount.value || parseFloat(withdrawAmount.value) <= 0) return

  withdrawLoading.value = true
  try {
    const response = await $fetch('/api/wallet/withdraw', {
      method: 'POST',
      body: { amount: parseFloat(withdrawAmount.value) }
    })

    if (response.success) {
      await refreshTransactions()
      await refreshPnl()
      closeModals()
    }
  } catch (error: any) {
    console.error('Withdraw error:', error)
  } finally {
    withdrawLoading.value = false
  }
}

const handleSend = async () => {
  if (!sendAmount.value || !sendRecipient.value || parseFloat(sendAmount.value) <= 0) return

  sendLoading.value = true
  try {
    const response = await $fetch('/api/wallet/send', {
      method: 'POST',
      body: {
        amount: parseFloat(sendAmount.value),
        recipientEmail: sendRecipient.value
      }
    })

    if (response.success) {
      await refreshTransactions()
      await refreshPnl()
      closeModals()
    }
  } catch (error: any) {
    console.error('Send error:', error)
  } finally {
    sendLoading.value = false
  }
}

// Pagination methods
const nextPage = () => {
  if (currentPage.value * pageSize.value < totalTransactions.value) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}
</script>

<template>
  <div class="col-span-12">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center min-h-96">
      <div class="text-center">
        <span class="loading loading-spinner loading-lg"></span>
        <p class="mt-4">{{ $t('app.transactions.loading_transactions') }}</p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-8">
      <!-- Action Buttons -->
    <div class="flex flex-wrap gap-4 w-full">
      <button class="btn btn-primary" @click="showDepositModal = true">
        <svg data-src="https://unpkg.com/heroicons/20/solid/plus.svg" class="h-5 w-5"></svg>
        {{ $t('app.wallet.deposit_funds') }}
      </button>
      <button class="btn btn-outline" @click="showWithdrawModal = true">
        <svg data-src="https://unpkg.com/heroicons/20/solid/minus.svg" class="h-5 w-5"></svg>
        {{ $t('app.wallet.withdraw_funds') }}
      </button>
      <button class="btn btn-outline" @click="showSendModal = true">
        <svg data-src="https://unpkg.com/heroicons/20/solid/paper-airplane.svg" class="h-5 w-5"></svg>
        {{ $t('app.wallet.send_funds') }}
      </button>
    </div>

    <!-- Transactions Table -->
    <div class="card bg-base-100">
      <div class="card-body">
        <div class="overflow-x-auto">
          <table class="table table-zebra w-full">
            <thead>
              <tr class="bg-base-200">
                <th class="text-xs font-bold uppercase py-4">{{ $t('app.transactions.date') }}</th>
                <th class="text-xs font-bold uppercase py-4">{{ $t('app.transactions.time') }}</th>
                <th class="text-xs font-bold uppercase py-4">{{ $t('app.transactions.description') }}</th>
                <th class="text-xs font-bold uppercase py-4">{{ $t('app.transactions.amount') }}</th>
                <th class="text-xs font-bold uppercase py-4">{{ $t('app.transactions.shares') }}</th>
                <th class="text-xs font-bold uppercase py-4">{{ $t('app.transactions.balance') }}</th>
                <th class="text-xs font-bold uppercase py-4">{{ $t('app.transactions.type') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transaction in paginatedTransactions" :key="transaction.id" class="hover">
                <td class="font-mono text-sm">{{ transaction.date }}</td>
                <td class="font-mono text-sm opacity-70">{{ transaction.time }}</td>
                <td class="font-semibold">{{ transaction.description }}</td>
                <td :class="transaction.amount.startsWith('+') ? 'text-success font-semibold' : 'text-error font-semibold'">
                  {{ transaction.amount }}
                </td>
                <td class="font-mono">{{ transaction.shares }}</td>
                <td class="font-mono font-semibold">{{ transaction.balance }}</td>
                <td>
                  <span
                    class="badge badge-sm"
                    :class="{
                      'badge-success': transaction.type === 'deposit' || transaction.type === 'received' || transaction.type === 'profit',
                      'badge-error': transaction.type === 'withdrawal' || transaction.type === 'sent' || transaction.type === 'loss',
                      'badge-info': transaction.type === 'transfer',
                      'badge-warning': transaction.type === 'commission'
                    }"
                  >
                    {{ transaction.type }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!transactionsWithBalance.length && !transactionsPending && !pnlPending" class="text-center py-12 opacity-60">
          <div class="text-4xl mb-2">📜</div>
          <p>{{ $t('app.transactions.no_transactions_yet') }}</p>
          <p class="text-sm opacity-70">{{ $t('app.transactions.history_appears_here') }}</p>
        </div>

        <!-- Pagination -->
        <div v-if="totalTransactions > pageSize" class="flex justify-center mt-6">
          <div class="join">
            <button
              class="btn btn-outline"
              :disabled="currentPage <= 1"
              @click="prevPage"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              {{ $t('app.dashboard.previous') }}
            </button>

            <button class="btn btn-outline btn-active px-6">
              {{ $t('app.dashboard.page') }} {{ currentPage }} {{ $t('app.dashboard.of') }} {{ Math.ceil(totalTransactions / pageSize) }}
            </button>

            <button
              class="btn btn-outline"
              :disabled="currentPage >= Math.ceil(totalTransactions / pageSize)"
              @click="nextPage"
            >
              {{ $t('app.dashboard.next') }}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="transactionsPending || pnlPending" class="text-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
          <p class="mt-4">{{ $t('app.transactions.loading_transactions') }}</p>
        </div>
      </div>
    </div>

    <!-- Deposit Modal -->
    <div v-if="showDepositModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">{{ $t('app.wallet.deposit_funds') }}</h3>
        <p class="py-4">{{ $t('app.wallet.deposit_funds_desc') }}</p>
        <div class="form-control">
          <label class="label">
            <span class="label-text">{{ $t('app.wallet.amount_dollar') }}</span>
          </label>
          <input
            v-model="depositAmount"
            type="number"
            step="0.01"
            min="0"
            placeholder="100.00"
            class="input input-bordered"
            @keydown.enter="handleDeposit"
          />
        </div>
        <div class="modal-action">
          <button class="btn" @click="closeModals">{{ $t('app.wallet.cancel') }}</button>
          <button
            class="btn btn-primary"
            :disabled="!depositAmount || parseFloat(depositAmount) <= 0 || depositLoading"
            @click="handleDeposit"
          >
            <span v-if="depositLoading" class="loading loading-spinner loading-sm"></span>
            {{ $t('app.wallet.deposit') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Withdraw Modal -->
    <div v-if="showWithdrawModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">{{ $t('app.wallet.withdraw_funds') }}</h3>
        <p class="py-4">{{ $t('app.wallet.withdraw_funds_desc') }} ${{ (walletData?.balanceLeft ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</p>
        <div class="form-control">
          <label class="label">
            <span class="label-text">{{ $t('app.wallet.amount_dollar') }}</span>
          </label>
          <input
            v-model="withdrawAmount"
            type="number"
            step="0.01"
            min="0"
            :max="walletData?.balanceLeft ?? 0"
            placeholder="50.00"
            class="input input-bordered"
            @keydown.enter="handleWithdraw"
          />
        </div>
        <div class="modal-action">
          <button class="btn" @click="closeModals">{{ $t('app.wallet.cancel') }}</button>
          <button
            class="btn btn-primary"
            :disabled="!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > (walletData?.balanceLeft ?? 0) || withdrawLoading"
            @click="handleWithdraw"
          >
            <span v-if="withdrawLoading" class="loading loading-spinner loading-sm"></span>
            {{ $t('app.wallet.withdraw') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Send Modal -->
    <div v-if="showSendModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">{{ $t('app.wallet.send_funds') }}</h3>
        <p class="py-4">{{ $t('app.wallet.send_funds_desc') }} ${{ (walletData?.balanceLeft ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</p>
        <div class="form-control">
          <label class="label">
            <span class="label-text">{{ $t('app.wallet.recipient_email') }}</span>
          </label>
          <input
            v-model="sendRecipient"
            type="email"
            placeholder="user@example.com"
            class="input input-bordered"
          />
        </div>
        <div class="form-control mt-4">
          <label class="label">
            <span class="label-text">{{ $t('app.wallet.amount_dollar') }}</span>
          </label>
          <input
            v-model="sendAmount"
            type="number"
            step="0.01"
            min="0"
            :max="walletData?.balanceLeft ?? 0"
            placeholder="25.00"
            class="input input-bordered"
            @keydown.enter="handleSend"
          />
        </div>
        <div class="modal-action">
          <button class="btn" @click="closeModals">{{ $t('app.wallet.cancel') }}</button>
          <button
            class="btn btn-primary"
            :disabled="!sendAmount || !sendRecipient || parseFloat(sendAmount) <= 0 || parseFloat(sendAmount) > (walletData?.balanceLeft ?? 0) || sendLoading"
            @click="handleSend"
          >
            <span v-if="sendLoading" class="loading loading-spinner loading-sm"></span>
            {{ $t('app.wallet.send') }}
          </button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>
