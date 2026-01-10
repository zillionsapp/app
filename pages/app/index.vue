<script setup lang="ts">
definePageMeta({
  layout: 'app',
  middleware: 'auth'
})

const currentPeriod = ref('all')

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

const { data: walletData, pending: summaryPending, refresh: refreshSummary } = await useFetch('/api/wallet/summary')
const { data: chartData, pending: chartPending, refresh: refreshChart } = await useFetch('/api/wallet/chart', {
  query: computed(() => ({ period: currentPeriod.value }))
})

const refreshData = async (period = currentPeriod.value) => {
  currentPeriod.value = period
  // Wait a bit for the query to update, then refresh
  await nextTick()
  await refreshChart()
  await refreshSummary()
}

// Chart data for performance
const performanceData = computed(() => {
  if (!chartData.value?.data) return []
  return chartData.value.data.map((point: any) => ({
    date: point.date,
    equity: point.equity
  }))
})

const equityCategories = computed(() => ({
  equity: {
    name: 'Equity',
    color: (walletData.value?.pnl ?? 0) >= 0 ? '#00ff9d' : '#ff006e', // Green for profit, red for loss
  },
}))

const xFormatter = (tick: number): string => {
  const dateStr = performanceData.value[tick]?.date
  if (!dateStr) return ''

  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const yFormatter = (value: number): string => {
  return `$${value.toLocaleString()}`
}

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
      await refreshSummary()
      closeModals()
      // You could add a toast notification here
    }
  } catch (error: any) {
    console.error('Deposit error:', error)
    // You could add error handling/toast here
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
      await refreshSummary()
      closeModals()
      // You could add a toast notification here
    }
  } catch (error: any) {
    console.error('Withdraw error:', error)
    // You could add error handling/toast here
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
      await refreshSummary()
      closeModals()
      // You could add a toast notification here
    }
  } catch (error: any) {
    console.error('Send error:', error)
    // You could add error handling/toast here
  } finally {
    sendLoading.value = false
  }
}
</script>

<template>
  <!-- stats -->
  <section class="stats stats-vertical col-span-12 w-full xl:stats-horizontal bg-base-100 rounded-box">
    <div class="stat">
      <div class="stat-title text-primary uppercase text-xs font-bold tracking-widest">{{ $t('app.wallet.total_deposited') }}</div>
      <div class="stat-value text-2xl">${{ (walletData?.totalDeposited ?? 0).toLocaleString() }}</div>
      <div class="stat-desc mt-1">{{ $t('app.wallet.paper_money_invested') }}</div>
    </div>
    <div class="stat">
      <div class="stat-title text-secondary uppercase text-xs font-bold tracking-widest">{{ $t('app.wallet.balance_left') }}</div>
      <div class="stat-value text-2xl">${{ (walletData?.balanceLeft ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
      <div class="stat-desc mt-1">{{ $t('app.wallet.available_to_trade') }}</div>
    </div>
    <div class="stat">
      <div class="stat-title text-accent uppercase text-xs font-bold tracking-widest">{{ $t('app.wallet.current_equity') }}</div>
      <div class="stat-value text-2xl">${{ (walletData?.currentEquity ?? walletData?.totalEquity ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</div>
      <div class="stat-desc mt-1">
        <span v-if="walletData?.unrealizedPnL !== undefined" :class="walletData.unrealizedPnL >= 0 ? 'text-success' : 'text-error'">
          {{ walletData.unrealizedPnL >= 0 ? '+' : '-' }}${{ Math.abs(walletData.unrealizedPnL).toFixed(2) }}
        </span>
        {{ $t('app.wallet.current_portfolio_value') }}
      </div>
    </div>
    <div class="stat">
      <div class="stat-title text-info uppercase text-xs font-bold tracking-widest">{{ $t('app.wallet.total_pnl') }}</div>
      <div class="stat-value text-2xl" :class="(walletData?.pnl ?? 0) >= 0 ? 'text-success' : 'text-error'">
        {{ (walletData?.pnl ?? 0) >= 0 ? '+' : '-' }}${{ Math.abs(walletData?.pnl ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
      </div>
      <div class="stat-desc mt-1" :class="(walletData?.pnl ?? 0) >= 0 ? 'text-success' : 'text-error'">
        {{ (walletData?.pnlPercentage ?? 0) >= 0 ? '+' : '-' }}{{ Math.abs(walletData?.pnlPercentage ?? 0).toFixed(2) }}%
      </div>
    </div>
  </section>

  <!-- Performance Chart -->
  <div class="card bg-base-100 rounded-box col-span-12">
    <div class="card-body">
      <div class="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h2 class="card-title">{{ $t('app.wallet.portfolio_performance') }}</h2>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="period in ['1d', '1w', '1m', '1y', 'all']"
            :key="period"
            @click="refreshData(period)"
            class="btn btn-xs"
            :class="currentPeriod === period ? 'btn-active btn-primary' : 'btn-outline'"
          >
            {{ period.toUpperCase() }}
          </button>
        </div>
      </div>
      <AreaChart
        v-if="performanceData.length > 0"
        :data="performanceData"
        :height="300"
        :categories="equityCategories"
        :y-grid-line="true"
        :x-formatter="xFormatter"
        :y-formatter="yFormatter"
        :curve-type="CurveType.MonotoneX"
        :legend-position="LegendPosition.BottomCenter"
        :hide-legend="true"
      />
      <div v-else class="flex items-center justify-center h-80 text-base-content/50">
        <div class="text-center">
          <div class="text-4xl mb-2">📈</div>
          <p>{{ $t('app.wallet.no_performance_data') }}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Additional Info -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 col-span-12">
    <div class="card bg-base-100 rounded-box">
      <div class="card-body">
        <h3 class="card-title">{{ $t('app.wallet.wallet_overview') }}</h3>
        <div class="space-y-4">
          <div class="flex justify-between">
            <span>{{ $t('app.wallet.current_shares') }}</span>
            <span class="font-mono">{{ (walletData?.currentShares ?? 0).toLocaleString() }}</span>
          </div>
          <div class="flex justify-between">
            <span>{{ $t('app.wallet.portfolio_value') }}</span>
            <span class="font-mono">${{ (walletData?.currentEquity ?? walletData?.totalEquity ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          </div>
          <div class="flex justify-between">
            <span>{{ $t('app.wallet.available_balance') }}</span>
            <span class="font-mono">${{ (walletData?.balanceLeft ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-base-100 rounded-box">
      <div class="card-body">
        <h3 class="card-title">{{ $t('app.wallet.quick_actions') }}</h3>
        <div class="space-y-2">
          <button class="btn btn-primary btn-block" @click="showDepositModal = true">
            <svg data-src="https://unpkg.com/heroicons/20/solid/plus.svg" class="h-5 w-5"></svg>
            {{ $t('app.wallet.deposit_funds') }}
          </button>
          <button class="btn btn-outline btn-block" @click="showWithdrawModal = true">
            <svg data-src="https://unpkg.com/heroicons/20/solid/minus.svg" class="h-5 w-5"></svg>
            {{ $t('app.wallet.withdraw_funds') }}
          </button>
          <button class="btn btn-outline btn-block" @click="showSendModal = true">
            <svg data-src="https://unpkg.com/heroicons/20/solid/paper-airplane.svg" class="h-5 w-5"></svg>
            {{ $t('app.wallet.send_funds') }}
          </button>
        </div>
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
</template>
