# Dip-Buy ROC Trend – Triangle Density Strategy API

A Nuxt 4 server API implementation of a sophisticated trading strategy based on trend analysis, overbought/oversold signals, and triangle density patterns.

## Overview

This API provides a REST endpoint that runs a complete backtest simulation using historical market data from Binance. The strategy implements multiple technical indicators and risk management features including trailing stops, partial take-profits, and position sizing.

## Endpoint

```
POST /api/strategy
```

## Request Format

Send a POST request with a JSON body containing your strategy configuration:

```json
{
  "symbol": "BTCUSDT",
  "tf": "15m",
  "htf": "1d",
  "lookbackDays": 120,
  "initialCapital": 1000,
  "posPct": 10,
  "useTrend": true,
  "useHTF": true,
  "enableShorts": false
}
```

## Response Format

### Success Response (200)

```json
{
  "ok": true,
  "config": {
    "symbol": "BTCUSDT",
    "tf": "15m",
    "htf": "1d",
    "lookbackDays": 120,
    "initialCapital": 1000,
    "commissionPct": 0.05,
    "slippagePct": 0,
    "posPct": 10,
    "useTrend": true,
    "useHTF": true,
    "trendLen": 40,
    "upTh": 57,
    "dnTh": 43,
    "htfLongTh": 53,
    "htfShortTh": 47,
    "obosLen": 12,
    "adaptLen": 14,
    "winLen": 20,
    "needBars": 4,
    "minSpacing": 3,
    "enableShorts": false,
    "tpPct": 8,
    "tpPortion": 50,
    "useTrail": true,
    "trailPct": 4,
    "armTrailPct": 0.8,
    "minHoldBars": 2,
    "useATRstop": false,
    "atrLen": 14,
    "atrMult": 3
  },
  "result": {
    "equity": 1056.78,
    "retPct": 5.68,
    "bars": 11520,
    "lastPrice": 43250.67,
    "tradesCount": 23
  },
  "trades": [
    {
      "time": "2024-01-15T10:30:00.000Z",
      "side": "BUY",
      "price": "42150.230000",
      "qty": "0.00023700",
      "note": "entry"
    },
    {
      "time": "2024-01-15T14:45:00.000Z",
      "side": "SELL",
      "price": "42500.120000",
      "qty": "0.00011850",
      "note": "partial TP 50%"
    }
  ],
  "allTrades": [...],
  "data": {
    "ltfCandles": 11520,
    "htfCandles": 120,
    "ltfTimeframe": "15m",
    "htfTimeframe": "1d"
  }
}
```

### Error Response (400, 502, 500)

```json
{
  "ok": false,
  "error": "Error description"
}
```

## Configuration Parameters

### Data Parameters
- `symbol` (string, required): Trading pair symbol (e.g., "BTCUSDT")
- `tf` (string, required): Lower timeframe for strategy (e.g., "15m", "1h")
- `htf` (string, optional): Higher timeframe for gating (default: "1d")
- `lookbackDays` (number, optional): Historical data lookback period (default: 120)
- `limitPerReq` (number, optional): Binance API request limit (default: 1000)

### Trading & Cost Parameters
- `initialCapital` (number, optional): Starting capital for backtest (default: 1000)
- `commissionPct` (number, optional): Commission percentage per trade (default: 0.05)
- `slippagePct` (number, optional): Slippage percentage (default: 0)

### Position Sizing
- `posPct` (number, optional): Position size as % of equity (default: 10)

### Trend & HTF Gates
- `useTrend` (boolean, optional): Enable trend filtering (default: true)
- `useHTF` (boolean, optional): Enable higher timeframe gating (default: true)
- `trendLen` (number, optional): Trend calculation length (default: 40)
- `upTh` (number, optional): Uptrend threshold (default: 57.0)
- `dnTh` (number, optional): Downtrend threshold (default: 43.0)
- `htfLongTh` (number, optional): HTF long threshold (default: 53.0)
- `htfShortTh` (number, optional): HTF short threshold (default: 47.0)

### Triangle (OB/OS) Parameters
- `obosLen` (number, optional): OB/OS oscillator length (default: 12)
- `adaptLen` (number, optional): Adaptive threshold length (default: 14)
- `showOBOS` (boolean, optional): Show OB/OS signals (default: true)

### Triangle Density Trigger
- `winLen` (number, optional): Rolling window length (default: 20)
- `needBars` (number, optional): Required bars for trigger (default: 4)
- `minSpacing` (number, optional): Minimum bars between entries (default: 3)
- `enableShorts` (boolean, optional): Enable short positions (default: false)

### Scale-Out & Trail Parameters
- `tpPct` (number, optional): Take-profit percentage (default: 8.0)
- `tpPortion` (number, optional): Portion to sell at TP (default: 50.0)
- `useTrail` (boolean, optional): Enable trailing stop (default: true)
- `trailPct` (number, optional): Trailing stop distance (default: 4.0)
- `armTrailPct` (number, optional): Arm trail after gain % (default: 0.8)
- `minHoldBars` (number, optional): Min bars before arming trail (default: 2)

### Emergency Risk Parameters
- `useATRstop` (boolean, optional): Enable ATR stop loss (default: false)
- `atrLen` (number, optional): ATR calculation length (default: 14)
- `atrMult` (number, optional): ATR multiplier for stop (default: 3.0)

## Supported Timeframes

The following Binance timeframes are supported:
- `1m`, `3m`, `5m`, `15m`, `30m`
- `1h`, `2h`, `4h`, `6h`, `8h`, `12h`
- `1d`, `3d`, `1w`, `1M`

## Usage Examples

### Basic Example

```javascript
const response = await fetch('/api/strategy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    symbol: 'BTCUSDT',
    tf: '15m',
    initialCapital: 10000
  })
})

const result = await response.json()
console.log(`Return: ${result.result.retPct}%`)
```

### Advanced Configuration

```javascript
const config = {
  symbol: 'ETHUSDT',
  tf: '1h',
  htf: '1d',
  lookbackDays: 90,
  initialCapital: 5000,
  posPct: 15,
  useTrend: true,
  useHTF: true,
  trendLen: 50,
  upTh: 60,
  dnTh: 40,
  tpPct: 10,
  trailPct: 5,
  armTrailPct: 1.0,
  minHoldBars: 3,
  useATRstop: true,
  atrLen: 20,
  atrMult: 2.5
}

const response = await fetch('/api/strategy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(config)
})
```

### Frontend Integration (Vue/Nuxt)

```vue
<template>
  <div>
    <h2>Strategy Backtest</h2>
    <div v-if="loading">Running backtest...</div>
    <div v-else-if="result">
      <p>Final Equity: ${{ result.result.equity }}</p>
      <p>Return: {{ result.result.retPct }}%</p>
      <p>Total Trades: {{ result.result.tradesCount }}</p>

      <h3>Recent Trades</h3>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Side</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="trade in result.trades" :key="trade.time">
            <td>{{ new Date(trade.time).toLocaleString() }}</td>
            <td>{{ trade.side }}</td>
            <td>{{ trade.price }}</td>
            <td>{{ trade.qty }}</td>
            <td>{{ trade.note }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const result = ref(null)
const loading = ref(false)

const runBacktest = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/strategy', {
      method: 'POST',
      body: {
        symbol: 'BTCUSDT',
        tf: '15m',
        initialCapital: 1000,
        lookbackDays: 60
      }
    })
    result.value = response
  } catch (error) {
    console.error('Backtest failed:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  runBacktest()
})
</script>
```

## Strategy Features

### Technical Indicators
- **Trend Score**: Custom trend strength indicator using ROC and z-score
- **OB/OS Signals**: Overbought/Oversold oscillator with adaptive thresholds
- **ATR**: Average True Range for volatility measurement
- **RSI**: Relative Strength Index for momentum
- **EMA**: Exponential Moving Averages for smoothing

### Risk Management
- **Position Sizing**: Percentage-based position sizing
- **Trailing Stops**: Dynamic stop losses that follow price
- **Partial Take-Profits**: Scale out portions at target levels
- **ATR Stops**: Emergency stops based on volatility
- **Commission & Slippage**: Realistic trading cost modeling

### Entry/Exit Logic
- **Long-only by default** (shorts can be enabled)
- **Multi-timeframe confirmation** using HTF trend gates
- **Triangle density triggers** for precise entry timing
- **Minimum spacing** between consecutive entries

## Error Handling

The API includes comprehensive error handling:

- **400 Bad Request**: Missing required parameters
- **502 Bad Gateway**: Issues fetching data from Binance
- **500 Internal Server Error**: Strategy execution errors

All errors return a JSON response with an `error` field containing the error message.

## Performance Considerations

- Data is fetched from Binance's free public API (no authentication required)
- Large date ranges may take several seconds to process
- Consider using shorter `lookbackDays` for faster testing
- The API implements rate limiting to respect Binance's terms

## Testing

A test script is provided (`test-strategy.js`) to verify the API functionality:

```bash
# Start the Nuxt development server
npm run dev

# In another terminal, run the test
node test-strategy.js
```

## Security Notes

- This API is designed for backtesting and paper trading only
- No real funds are at risk
- Market data is fetched from public endpoints
- Consider implementing rate limiting in production
- The API does not store any sensitive data

## Future Enhancements

- Short position implementation
- Additional technical indicators
- Performance optimization
- Caching layer for frequently requested symbols/timeframes
- WebSocket support for real-time strategy monitoring
