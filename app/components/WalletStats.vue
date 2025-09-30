<template>
  <section class="mt-6">
    <div class="grid grid-cols-2 md:grid-cols-2 gap-3">
      <div class="stat bg-base-100 rounded-2xl p-4 border border-base-300/60">
        <div class="stat-title text-xs uppercase opacity-70 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M2 12h20" stroke-linecap="round"/>
          </svg>
          Deposited
        </div>
        <div class="stat-value text-xl">{{ currency }}{{ formatMoney(deposited) }}</div>
        <div class="stat-desc text-xs opacity-70">On {{ depositAt }}</div>
      </div>

      <div class="stat bg-base-100 rounded-2xl p-4 border border-base-300/60">
        <div class="stat-title text-xs uppercase opacity-70 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20V4m-7 5l7-5 7 5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Earnings
        </div>
        <div class="stat-value text-xl" :class="earningsUsd >= 0 ? 'text-success' : 'text-error'">
          {{ currency }}{{ formatMoney(earningsUsd) }}
        </div>
        <div class="stat-desc text-xs opacity-70">{{ earningsUsd >= 0 ? '+' : ''}}{{ earningsPct.toFixed(2) }}%</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Props {
  currency: string
  deposited: number
  depositAt: string
  earningsUsd: number
  earningsPct: number
}

const props = defineProps<Props>()

/* Utils */
function formatMoney(n: number) {
  const s = Math.abs(n).toFixed(2)
  const parts = s.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const sign = n < 0 ? '-' : ''
  return sign + parts.join('.')
}
</script>
