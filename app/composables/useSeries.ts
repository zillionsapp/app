// composables/useSeries.ts
import { ref, computed } from 'vue'

export type Period = '1D'|'1W'|'1M'|'6M'|'1Y'|'ALL'
export const PERIODS: Period[] = ['1D','1W','1M','6M','1Y','ALL']

type SeriesResponse = {
  ok: boolean
  symbol: string
  period: Period | null
  interval: string
  points: number
  timestamps: number[]
  closes: number[]
  latest: number | null
  error?: string
}

export function useSeries(
  initialSymbol = 'BTCUSDT',
  initialPeriod: Period = '1M',
  // NEW: earnings inputs (USD deposit at a date)
  depositUsd: number = 5000,
  depositAtIso: string = '2025-08-01' // YYYY-MM-DD (local)
) {
  const symbol = ref(initialSymbol.toUpperCase())
  const period = ref<Period>(initialPeriod)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const timestamps = ref<number[]>([])
  const closes = ref<number[]>([])
  const controller = ref<AbortController | null>(null)

  // Earnings-specific state
  const earningsLoading = ref(false)
  const priceAtDeposit = ref<number | null>(null)

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

  // NEW: fetch a lightweight range from deposit date to now to compute priceAt(deposit)
  async function loadForEarnings() {
    earningsLoading.value = true
    try {
      const depositAtMs = new Date(depositAtIso + 'T00:00:00').getTime()
      const url = `/api/series?symbol=${encodeURIComponent(symbol.value)}&from=${depositAtMs}`
      const res = await $fetch<SeriesResponse>(url)
      if (!res.ok) throw new Error(res.error || 'Failed')
      // find the first candle at or after deposit time; if none, use closest previous
      const ts = res.timestamps
      const prices = res.closes
      let idx = ts.findIndex(t => t >= depositAtMs)
      if (idx === -1) idx = ts.length - 1 // fallback to latest if somehow beyond range
      if (idx < 0) {
        priceAtDeposit.value = null
      } else {
        // prefer the candle at or just before deposit time (open of the day)
        if (idx > 0 && (ts[idx] - depositAtMs) > (depositAtMs - ts[idx - 1])) {
          idx = idx - 1
        }
        priceAtDeposit.value = prices[idx] ?? null
      }
    } catch (e) {
      // don’t block UI if earnings range fails
      priceAtDeposit.value = null
    } finally {
      earningsLoading.value = false
    }
  }

  async function setPeriod(p: Period) {
    period.value = p
    await load(p)
  }

  // Earnings computations
  const qtySol = computed(() => {
    if (!priceAtDeposit.value || depositUsd <= 0) return 0
    return depositUsd / priceAtDeposit.value
  })
  const currentValueUsd = computed(() => {
    const lp = latestPrice.value
    if (!lp || qtySol.value === 0) return 0
    return qtySol.value * lp
  })
  const earningsUsd = computed(() => {
    if (depositUsd <= 0) return 0
    return currentValueUsd.value - depositUsd
  })
  const earningsPct = computed(() => {
    if (depositUsd <= 0) return 0
    return (earningsUsd.value / depositUsd) * 100
  })

  // Eager loads
  if (import.meta.client) {
    load()
    loadForEarnings()
  }

  return {
    PERIODS,
    symbol, period,
    loading, error,
    series, seriesTs, latestPrice,
    load, setPeriod,

    // earnings
    earningsLoading,
    priceAtDeposit,
    qtySol, currentValueUsd, earningsUsd, earningsPct,
  }
}
