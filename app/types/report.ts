export interface Trade {
  t: string
  side: 'buy' | 'sell'
  qty: number
  px: number
  notional: number
}

export interface Strategy {
  fast: number | null
  slow: number | null
  prevSlow: number | null
  lastMark: number | null
  volEwmaBps: number | null
  lastState: string
  entryTs: number
  lastExitTs: number
  ticks: number
  warmTicks: number
  mid?: number
}

export interface Router {
  lastRegime: string
  lastStrategyKey: string
  lastSwitchTs: number
  detector: {
    lastRegime: string
  }
}

export interface Market {
  position: number
  entryPrice: number
  realizedPnL: number
  feesPaid: number
  trades: Trade[]
  lastMark: number
  router: Router
  strategies: {
    trend: Strategy
    range: Strategy
  }
}

export interface ReportMeta {
  createdAt: string
  network: string
  notes: string
  dayStartDate: string
  dayStartEquity: number
}

export interface Report {
  meta: ReportMeta
  deposit: number
  cash: number
  markets: {
    [key: string]: Market
  }
}
