/** Sample data (your app can pass real-time data via the prop) */
export const SAMPLE_REPORT = {
  meta: {
    createdAt: '2025-09-03T14:47:18.412Z',
    network: 'mainnet-beta',
    notes: 'paper trading state (multi-market, router)',
    dayStartDate: '2025-09-03',
    dayStartEquity: 10000,
  },
  deposit: 10000,
  cash: 9999.826677213112,
  markets: {
    'SOL-PERP': {
      position: 0,
      entryPrice: 0,
      realizedPnL: -1399.6332494522635,
      feesPaid: 0.4000733346239127,
      trades: [
        { t: '2025-09-03T15:05:06.914Z', side: 'sell', qty: 0.47133323680742867, px: 212.1429005883, notional: 99.99 },
        { t: '2025-09-03T15:06:12.018Z', side: 'buy', qty: 0.47133323680742867, px: 212.1216020392, notional: -99.9799612859134 },
        { t: '2025-09-03T15:23:52.680Z', side: 'buy', qty: 0.47276842859430823, px: 211.54119850464997, notional: -100.01 },
        { t: '2025-09-03T15:27:04.965Z', side: 'sell', qty: 0.47253817910021095, px: 211.6019496888, notional: 99.99 },
        { t: '2025-09-03T15:51:28.118Z', side: 'sell', qty: 0.0002302494940972788, px: 211.30297808895003, notional: 0.04865240380622913 },
        { t: '2025-09-03T15:52:54.243Z', side: 'buy', qty: 0.473839472009774, px: 211.06304119370003, notional: -100.01 },
        { t: '2025-09-03T15:54:41.386Z', side: 'sell', qty: 0.4737188312697963, px: 211.07457293175, notional: 99.99 },
        { t: '2025-09-03T16:01:04.898Z', side: 'sell', qty: 0.00012064073997769542, px: 211.75097028525002, notional: 0.025545793746207558 },
        { t: '2025-09-03T16:02:19.012Z', side: 'buy', qty: 0.4729998142742579, px: 211.43771515735, notional: -100.01 },
        { t: '2025-09-03T16:07:35.421Z', side: 'sell', qty: 0.4720533623093534, px: 211.81927295429998, notional: 99.99 },
        { t: '2025-09-03T16:13:03.856Z', side: 'sell', qty: 0.0009464519649045045, px: 210.91302808785, notional: 0.19961904985770457 },
        { t: '2025-09-03T16:16:29.148Z', side: 'buy', qty: 0.47457986174506245, px: 210.73376276915002, notional: -100.01 },
        { t: '2025-09-03T16:18:55.376Z', side: 'sell', qty: 0.4745376435005393, px: 210.7103648562, notional: 99.99 },
        { t: '2025-09-03T16:31:25.456Z', side: 'sell', qty: 0.00004221824452316225, px: 210.3144704496, notional: 0.008879107740200594 },
        { t: '2025-09-03T16:40:29.191Z', side: 'buy', qty: 0.47624765992735746, px: 209.9957824785, notional: -100.01 },
        { t: '2025-09-03T16:42:15.328Z', side: 'sell', qty: 0.47624765992735746, px: 209.8975571451, notional: 99.96322041482266 },
        { t: '2025-09-03T16:43:33.429Z', side: 'buy', qty: 0.47701498068408926, px: 209.6579857022, notional: -100.01 },
        { t: '2025-09-03T16:44:59.553Z', side: 'sell', qty: 0.47691298687501366, px: 209.66088731444998, notional: 99.99 },
        { t: '2025-09-03T16:53:43.265Z', side: 'sell', qty: 0.00010199380907560673, px: 209.82063633794996, notional: 0.02140040592277518 },
        { t: '2025-09-03T16:54:48.345Z', side: 'buy', qty: 0.47690506051375586, px: 209.70630903405, notional: -100.01 },
        { t: '2025-09-03T16:55:37.404Z', side: 'sell', qty: 0.4761531933954334, px: 209.9954413557, notional: 99.99 },
        { t: '2025-09-03T17:00:53.802Z', side: 'sell', qty: 0.0007518671183224801, px: 210.09673472535002, notional: 0.15796482650691146 },
        { t: '2025-09-03T17:04:09.050Z', side: 'buy', qty: 0.4756408460134307, px: 210.26369126670002, notional: -100.01 },
        { t: '2025-09-03T17:11:12.577Z', side: 'sell', qty: 0.4749059415539336, px: 210.54695519880002, notional: 99.99 },
        { t: '2025-09-03T17:30:25.085Z', side: 'sell', qty: 0.0007349044594970877, px: 211.26918346875, notional: 0.15526266508549277 },
        { t: '2025-09-03T17:31:51.198Z', side: 'buy', qty: 0.4733072630170945, px: 211.30037042425002, notional: -100.01 },
        { t: '2025-09-03T17:41:05.911Z', side: 'sell', qty: 0.4733072630170945, px: 210.8485860327, notional: 99.79616716616162 },
      ],
      lastMark: 210.714662,
      router: {
        lastRegime: 'sideways',
        lastStrategyKey: 'range',
        lastSwitchTs: 0,
        detector: { lastRegime: 'sideways' }
      },
      strategies: {
        trend: { fast: null, slow: null, prevSlow: null, lastMark: null, volEwmaBps: null, lastState: 'flat', entryTs: 0, lastExitTs: 0, ticks: 0, warmTicks: 120 },
        range: { mid: 210.97963403571933, lastMark: 210.8140215, volEwmaBps: 1.7530006321008496, lastState: 'flat', entryTs: 1756921174780, lastExitTs: 1756921265911, ticks: 1522, warmTicks: 120 }
      }
    }
  }
}
