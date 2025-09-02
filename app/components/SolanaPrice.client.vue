<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
const nuxtApp = useNuxtApp()

let socket: any
const price = ref<number | null>(null)
const ts = ref<number | null>(null)

function onPrice(p: { usd: number; ts: number }) {
  price.value = p.usd
  ts.value = p.ts
}

onMounted(() => {
  socket = nuxtApp.$nuxtSocket({ name: 'main' }) // root "/" namespace
  socket.on('solana:price', onPrice)
})

onBeforeUnmount(() => {
  if (socket) socket.off('solana:price', onPrice)
})
</script>

<template>
  <div class="p-4 rounded-xl shadow max-w-sm">
    <div class="text-sm opacity-70">Solana (USD)</div>
    <div class="text-3xl font-semibold">
      <span v-if="price !== null">${{ price.toFixed(2) }}</span>
      <span v-else>—</span>
    </div>
    <div v-if="ts" class="text-xs opacity-60">updated {{ new Date(ts).toLocaleTimeString() }}</div>
  </div>
</template>
