export const SAMPLE_REPORT = {
  "meta": {
    "createdAt": "2025-09-05T12:25:22.919Z",
    "network": "mainnet-beta",
    "notes": "paper trading state (multi-market)",
    "dayStartDate": "2025-09-05",
    "dayStartEquity": 10000
  },
  "deposit": 10000,
  "cash": 9999.94,
  "markets": {
    "SOL-PERP": {
      "position": -0.007374363422568586,
      "entryPrice": 27120.9850314561,
      "realizedPnL": 0,
      "feesPaid": 0.04,
      "trades": [
        {
          "t": "2025-09-05T12:31:31.685Z",
          "side": "sell",
          "qty": 0.4871365065634325,
          "px": 205.26074037315,
          "notional": 99.99000000000001
        },
        {
          "t": "2025-09-05T12:51:41.886Z",
          "side": "buy",
          "qty": 0.4797621431408639,
          "px": 208.4574646621,
          "notional": -100.00999999999999
        }
      ],
      "lastMark": 209.0208245,
      "strategy": {
        "fast": 208.80692857960062,
        "slow": 208.59046302771483,
        "prevSlow": 208.57641191001025,
        "lastState": "flat",
        "entryTs": 1757075491684,
        "lastExitTs": 1757076701886,
        "lastMark": 209.004971,
        "volEwmaBps": 2.0056618896428997,
        "ticks": 857,
        "warmTicks": 120
      }
    }
  }
}
