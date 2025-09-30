<template>
  <footer class="w-full">
    <div class="max-w-3xl mx-auto px-4 lg:px-6">
      <div class="grid grid-cols-3 gap-3 py-4">
        <button class="btn btn-lg rounded-2xl btn-primary gap-2" @click="handleDeposit">
          Deposit
        </button>
        <button class="btn btn-lg rounded-2xl btn-ghost gap-2" @click="handleWithdraw">
          Withdraw
        </button>
        <button class="btn btn-lg rounded-2xl btn-ghost gap-2" @click="handleSend">
          Send
        </button>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'deposit'): void
  (e: 'withdraw'): void
  (e: 'send'): void
}>()

console.log('WalletActions component mounted')

const handleDeposit = () => {
  console.log('Deposit clicked')
  emit('deposit')
}

const handleWithdraw = () => {
  console.log('Withdraw clicked')
  emit('withdraw')
}

const handleSend = () => {
  console.log('Send clicked')
  emit('send')
}
</script>
