import { ref, computed } from 'vue'
import type { Report } from '../types/report'

interface WalletSummary {
  email: string
  balance: number
  tradeCount: number
  recentTrades: string[]
}

interface DashboardMetrics {
  totalWallets: number
  totalBalance: number
  totalTrades: number
  activeWallets: number
  avgBalance: number
  topPerformers: Array<{
    email: string
    balance: number
    tradeCount: number
    pnl: number
  }>
}

interface DashboardData {
  metrics: DashboardMetrics
  report: Report
  wallets: WalletSummary[]
}

export const useDashboard = () => {
  const data = ref<DashboardData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchDashboardData = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/dashboard')

      if (response.success) {
        data.value = response as DashboardData
      } else {
        throw new Error('Failed to fetch dashboard data')
      }
    } catch (err: any) {
      error.value = err.message || 'An error occurred while fetching dashboard data'
      console.error('Dashboard fetch error:', err)
    } finally {
      loading.value = false
    }
  }

  // Computed properties for easy access
  const metrics = computed(() => data.value?.metrics || null)
  const report = computed(() => data.value?.report || null)
  const wallets = computed(() => data.value?.wallets || [])

  // Key metrics for the dashboard
  const netPnl = computed(() => {
    if (!report.value) return 0
    return Number(report.value.cash || 0) - Number(report.value.deposit || 0)
  })

  const totalBalance = computed(() => metrics.value?.totalBalance || 0)
  const totalWallets = computed(() => metrics.value?.totalWallets || 0)
  const totalTrades = computed(() => metrics.value?.totalTrades || 0)
  const activeWallets = computed(() => metrics.value?.activeWallets || 0)

  // Calculate trading metrics from the report data
  const tradeExpectancy = computed(() => {
    if (!report.value || !report.value.markets.SUMMARY) return 0

    const trades = report.value.markets.SUMMARY.trades
    if (trades.length === 0) return 0

    const winningTrades = trades.filter(trade => {
      // This is a simplified calculation - in a real scenario you'd need more sophisticated PnL tracking
      return trade.notional > 0
    })

    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, trade) => sum + trade.notional, 0) / winningTrades.length : 0
    const losingTrades = trades.filter(trade => trade.notional <= 0)
    const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.notional, 0) / losingTrades.length) : 0

    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0

    return winRate > 0 ? (avgWin * (winRate / 100)) - (avgLoss * ((100 - winRate) / 100)) : 0
  })

  const profitFactor = computed(() => {
    if (!report.value || !report.value.markets.SUMMARY) return 1

    const trades = report.value.markets.SUMMARY.trades
    if (trades.length === 0) return 1

    const grossProfit = trades
      .filter(trade => trade.notional > 0)
      .reduce((sum, trade) => sum + trade.notional, 0)

    const grossLoss = Math.abs(trades
      .filter(trade => trade.notional <= 0)
      .reduce((sum, trade) => sum + trade.notional, 0))

    return grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 1
  })

  const winRate = computed(() => {
    if (!report.value || !report.value.markets.SUMMARY) return 0

    const trades = report.value.markets.SUMMARY.trades
    if (trades.length === 0) return 0

    const winningTrades = trades.filter(trade => trade.notional > 0)
    return (winningTrades.length / trades.length) * 100
  })

  const avgWin = computed(() => {
    if (!report.value || !report.value.markets.SUMMARY) return 0

    const trades = report.value.markets.SUMMARY.trades
    const winningTrades = trades.filter(trade => trade.notional > 0)

    return winningTrades.length > 0
      ? winningTrades.reduce((sum, trade) => sum + trade.notional, 0) / winningTrades.length
      : 0
  })

  const avgLoss = computed(() => {
    if (!report.value || !report.value.markets.SUMMARY) return 0

    const trades = report.value.markets.SUMMARY.trades
    const losingTrades = trades.filter(trade => trade.notional <= 0)

    return losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.notional, 0) / losingTrades.length)
      : 0
  })

  const topPerformers = computed(() => metrics.value?.topPerformers || [])

  return {
    // State
    data,
    loading,
    error,

    // Methods
    fetchDashboardData,

    // Computed data
    metrics,
    report,
    wallets,

    // Key metrics
    netPnl,
    totalBalance,
    totalWallets,
    totalTrades,
    activeWallets,

    // Trading metrics
    tradeExpectancy,
    profitFactor,
    winRate,
    avgWin,
    avgLoss,
    topPerformers,

    // Utility functions
    refresh: fetchDashboardData
  }
}
