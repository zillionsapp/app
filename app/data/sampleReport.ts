/** Sample data (your app can pass real-time data via the prop) */
export const SAMPLE_REPORT = {
  "meta": {
    "createdAt": "2025-09-04T10:52:46.128Z",
    "network": "mainnet-beta",
    "notes": "paper trading state (multi-market, router)",
    "dayStartDate": "2025-09-04",
    "dayStartEquity": 10000
  },
  "deposit": 10000,
  "cash": 10099.793450966978,
  "markets": {
    "SOL-PERP": {
      "position": -0.48120704936856384,
      "entryPrice": 207.78997342455,
      "realizedPnL": -0.05657374652095191,
      "feesPaid": 0.1399752865044379,
      "trades": [
        {
          "t": "2025-09-04T11:11:26.453Z",
          "side": "sell",
          "qty": 0.48086940534503997,
          "px": 207.93587383304998,
          "notional": 99.99
        },
        {
          "t": "2025-09-04T11:12:44.606Z",
          "side": "buy",
          "qty": 0.48086940534503997,
          "px": 207.93025194610001,
          "notional": -99.98729660656545
        },
        {
          "t": "2025-09-04T11:15:15.861Z",
          "side": "sell",
          "qty": 0.4802562074657638,
          "px": 208.20136928085,
          "notional": 99.99000000000001
        },
        {
          "t": "2025-09-04T11:16:42.993Z",
          "side": "buy",
          "qty": 0.4802562074657638,
          "px": 208.1684837669,
          "notional": -99.97420652778982
        },
        {
          "t": "2025-09-04T11:53:22.803Z",
          "side": "buy",
          "qty": 0.4821194421942658,
          "px": 207.43822224805,
          "notional": -100.01
        },
        {
          "t": "2025-09-04T12:01:14.319Z",
          "side": "sell",
          "qty": 0.4821194421942658,
          "px": 207.28251267570002,
          "notional": 99.93492938783432
        },
        {
          "t": "2025-09-04T12:08:19.709Z",
          "side": "sell",
          "qty": 0.48120704936856384,
          "px": 207.78997342455,
          "notional": 99.99
        }
      ],
      "lastMark": 207.7195405,
      "router": {
        "lastRegime": "sideways",
        "lastStrategyKey": "range",
        "lastSwitchTs": 0,
        "detector": {
          "lastRegime": "sideways"
        }
      },
      "strategies": {
        "trend": {
          "fast": null,
          "slow": null,
          "prevSlow": null,
          "lastMark": null,
          "volEwmaBps": null,
          "lastState": "flat",
          "entryTs": 0,
          "lastExitTs": 0,
          "ticks": 0,
          "warmTicks": 120
        },
        "range": {
          "mid": 207.50762164611663,
          "lastMark": 207.7748785,
          "volEwmaBps": 2.168063967524974,
          "lastState": "short",
          "entryTs": 1756987699706,
          "lastExitTs": 1756987274316,
          "ticks": 459,
          "warmTicks": 120
        }
      }
    }
  }
}
