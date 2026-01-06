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
const depositLoading = ref(false)
const withdrawLoading = ref(false)
const sendLoading = ref(false)

// Fetch transactions
const { data: transactionsData, pending: transactionsPending, refresh: refreshTransactions } = await useFetch('/api/wallet/transactions')
const { data: walletData } = await useFetch('/api/wallet/summary')

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
      closeModals()
    }
  } catch (error: any) {
    console.error('Send error:', error)
  } finally {
    sendLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-8 col-span-12">
    <!-- Action Buttons -->
    <div class="flex flex-wrap gap-4">
      <button class="btn btn-primary" @click="showDepositModal = true">
        <svg data-src="https://unpkg.com/heroicons/20/solid/plus.svg" class="h-5 w-5"></svg>
        {{ $t('app.wallet.deposit_funds') }}
      </button>
      <button class="btn btn-outline" @click="showWithdrawModal = true">
        <svg data-src="https://unpkg.com/heroicons/20/solid/minus.svg" class="h-5 w-5"></svg>
        {{ $t('app.wallet.withdraw_funds') }}
      </button>
      <button class="btn btn-secondary" @click="showSendModal = true">
        <svg data-src="https://unpkg.com/heroicons/20/solid/paper-airplane.svg" class="h-5 w-5"></svg>
        {{ $t('app.wallet.send_funds') }}
      </button>
    </div>

    <!-- Transactions Table -->
    <div class="card bg-base-100">
      <div class="card-body">
        <h2 class="card-title">{{ $t('app.transactions.transaction_history') }}</h2>

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
              <tr v-for="transaction in transactionsData?.transactions || []" :key="transaction.id" class="hover">
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
                      'badge-success': transaction.type === 'deposit' || transaction.type === 'received',
                      'badge-error': transaction.type === 'withdrawal' || transaction.type === 'sent',
                      'badge-info': transaction.type === 'transfer'
                    }"
                  >
                    {{ transaction.type }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!transactionsData?.transactions?.length && !transactionsPending" class="text-center py-12 opacity-60">
          <div class="text-4xl mb-2">📜</div>
          <p>{{ $t('app.transactions.no_transactions_yet') }}</p>
          <p class="text-sm opacity-70">{{ $t('app.transactions.history_appears_here') }}</p>
        </div>

        <div v-if="transactionsPending" class="text-center py-12">
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
            class="btn btn-outline"
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
            class="btn btn-secondary"
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
</template>
