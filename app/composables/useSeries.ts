// composables/useSeries.ts
import { ref, computed, watchEffect } from 'vue'

export type Period = '1D'|'1W'|'1M'|'6M'|'1Y'|'ALL'
export const PERIODS: Period[] = ['1D','1W','1M','6M','1Y','ALL']

type SeriesResponse = {
  ok: boolean
  symbol: string
  period: Period
  interval: string
  points: number
  timestamps: number[]
  closes: number[]
  latest: number | null
  error?: string
}

export function useSeries(initialSymbol = 'SOLUSDT', initialPeriod: Period = '1M') {
  const symbol = ref(initialSymbol.toUpperCase())
  const period = ref<Period>(initialPeriod)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const timestamps = ref<number[]>([])
  const closes = ref<number[]>([])
  const controller = ref<AbortController | null>(null)

  const latestPrice = computed(() => closes.value.at(-1) ?? null)
  const series = computed(() => closes.value)
  const seriesTs = computed(() => timestamps.value)

  function abortInFlight() {
    try { controller.value?.abort() } catch {}
    controller.value = null
  }

  async function load(p = period.value) {
    abortInFlight()
    const ctrl = new AbortController()
    controller.value = ctrl
    loading.value = true
    error.value = null

    try {
      const url = `/api/series?symbol=${encodeURIComponent(symbol.value)}&period=${encodeURIComponent(p)}`
      const res = await $fetch<SeriesResponse>(url, { signal: ctrl.signal })
      if (!res.ok) throw new Error(res.error || 'Failed')
      timestamps.value = res.timestamps
      closes.value = res.closes
    } catch (e: any) {
      if (e?.name !== 'AbortError') error.value = e?.message ?? 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  async function setPeriod(p: Period) {
    period.value = p
    await load(p)
  }

  // Auto-load on first use and whenever symbol/period changes in SSR-safe way
  watchEffect(() => { /* track deps without auto-fetch */ })
  if (import.meta.client) {
    // eager load on client mount
    load()
  }

  return {
    PERIODS,
    symbol, period,
    loading, error,
    series, seriesTs, latestPrice,
    load, setPeriod
  }
}
