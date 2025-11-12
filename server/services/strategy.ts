// BTC Dip-Peak Mean Reversion Strategy
// Based on optimal trades analysis for BTCUSDT 15m timeframe

interface StrategyConfig {
  smaFastLen?: number; // SMA20
  smaSlowLen?: number; // SMA50
  rsiLen?: number; // RSI14
  atrLen?: number; // ATR14
  dipPeriod?: number; // Period for recent high/low (20 bars)
  spacingBars?: number; // Min bars between buys (8)
  atrAvgPeriod?: number; // Period for avg ATR (50)
  profitTargetPct?: number; // 5%
  stopLossPct?: number; // 2-3%
  timeExitBars?: number; // 50 bars
  trailMult?: number; // 1.5 for trailing stop
}

interface SignalResult {
  signal: number;
  position: number;
  indicators: {
    emaFast: number;
    emaSlow: number;
    rsi: number;
    atr: number;
    resistencia: number;
    soporte: number;
    stopLoss: number | null;
    trailingStop: number | null;
  };
}

class RTBMomentumBreakoutStrategy {
  smaFastLen: number;
  smaSlowLen: number;
  rsiLen: number;
  atrLen: number;
  dipPeriod: number;
  spacingBars: number;
  atrAvgPeriod: number;
  profitTargetPct: number;
  stopLossPct: number;
  timeExitBars: number;
  trailMult: number;

  // Internal state
  position: number; // 0: flat, 1: long
  entryPrice: number;
  stopLoss: number;
  trailingStop: number;
  barsSinceEntry: number;
  lastBuyBar: number;
  minLowSinceEntry: number;

  // Historical data for indicators
  closes: number[];
  highs: number[];
  lows: number[];
  smaFastValues: number[];
  smaSlowValues: number[];
  rsiValues: number[];
  atrValues: number[];
  recentHighs: number[];
  recentLows: number[];

  constructor(config: StrategyConfig = {}) {
    this.smaFastLen = config.smaFastLen || 20;
    this.smaSlowLen = config.smaSlowLen || 50;
    this.rsiLen = config.rsiLen || 14;
    this.atrLen = config.atrLen || 14;
    this.dipPeriod = config.dipPeriod || 20;
    this.spacingBars = config.spacingBars || 8;
    this.atrAvgPeriod = config.atrAvgPeriod || 50;
    this.profitTargetPct = config.profitTargetPct || 5;
    this.stopLossPct = config.stopLossPct || 3;
    this.timeExitBars = config.timeExitBars || 50;
    this.trailMult = config.trailMult || 1.5;

    // Internal state
    this.position = 0; // 0: flat, 1: long
    this.entryPrice = 0;
    this.stopLoss = 0;
    this.trailingStop = 0;
    this.barsSinceEntry = 0;
    this.lastBuyBar = -this.spacingBars - 1;
    this.minLowSinceEntry = Infinity;

    // Historical data for indicators
    this.closes = [];
    this.highs = [];
    this.lows = [];
    this.smaFastValues = [];
    this.smaSlowValues = [];
    this.rsiValues = [];
    this.atrValues = [];
    this.recentHighs = [];
    this.recentLows = [];
  }

  // SMA calculation
  sma(values: number[], period: number): number[] {
    const result = [];
    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
      } else {
        const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
      }
    }
    return result;
  }

  // RSI calculation
  rsi(values: number[], period: number): number[] {
    const gains = [];
    const losses = [];
    for (let i = 1; i < values.length; i++) {
      const change = values[i] - values[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }
    const avgGain = this.sma(gains, period);
    const avgLoss = this.sma(losses, period);
    const rsi = [];
    for (let i = 0; i < avgGain.length; i++) {
      if (isNaN(avgLoss[i]) || avgLoss[i] === 0) {
        rsi.push(100);
      } else {
        rsi.push(100 - (100 / (1 + avgGain[i] / avgLoss[i])));
      }
    }
    return rsi;
  }

  // ATR calculation
  atr(high: number[], low: number[], close: number[], period: number): number[] {
    const tr = [];
    for (let i = 1; i < high.length; i++) {
      const hl = high[i] - low[i];
      const hc = Math.abs(high[i] - close[i - 1]);
      const lc = Math.abs(low[i] - close[i - 1]);
      tr.push(Math.max(hl, hc, lc));
    }
    return this.sma(tr, period);
  }

  // Highest in period
  highest(values: number[], period: number): number[] {
    const result = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - period + 1);
      result.push(Math.max(...values.slice(start, i + 1)));
    }
    return result;
  }

  // Lowest in period
  lowest(values: number[], period: number): number[] {
    const result = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - period + 1);
      result.push(Math.min(...values.slice(start, i + 1)));
    }
    return result;
  }

  // Update indicators with new bar
  updateIndicators(open: number, high: number, low: number, close: number, volume: number): void {
    this.closes.push(close);
    this.highs.push(high);
    this.lows.push(low);

    // Update SMAs
    if (this.closes.length >= this.smaFastLen) {
      this.smaFastValues = this.sma(this.closes, this.smaFastLen);
    }
    if (this.closes.length >= this.smaSlowLen) {
      this.smaSlowValues = this.sma(this.closes, this.smaSlowLen);
    }

    // Update RSI
    if (this.closes.length >= this.rsiLen + 1) {
      this.rsiValues = this.rsi(this.closes, this.rsiLen);
    }

    // Update ATR
    if (this.closes.length >= this.atrLen + 1) {
      this.atrValues = this.atr(this.highs, this.lows, this.closes, this.atrLen);
    }

    // Update recent highs/lows
    if (this.highs.length >= this.dipPeriod) {
      this.recentHighs = this.highest(this.highs, this.dipPeriod);
    }
    if (this.lows.length >= this.dipPeriod) {
      this.recentLows = this.lowest(this.lows, this.dipPeriod);
    }
  }

  // Generate signal for current bar
  generateSignal(open: number, high: number, low: number, close: number, volume: number): SignalResult | number {
    this.updateIndicators(open, high, low, close, volume);

    const len = this.closes.length - 1; // Current index
    const currentBar = len;

    if (len < Math.max(this.smaSlowLen, this.rsiLen, this.atrLen, this.dipPeriod, this.atrAvgPeriod)) {
      return 0; // Not enough data
    }

    const smaF = this.smaFastValues[len];
    const smaS = this.smaSlowValues[len];
    const rsiVal = this.rsiValues[len - this.rsiLen + 1];
    const atrVal = this.atrValues[len - this.atrLen + 1];
    const recentHigh = this.recentHighs[len];
    const recentLow = this.recentLows[len];

    // Average ATR over last atrAvgPeriod
    const atrAvg = this.atrValues.slice(-this.atrAvgPeriod).reduce((a, b) => a + b, 0) / this.atrAvgPeriod;

    let signal = 0;

    // Entry conditions (Buy)
    const dipThreshold = close <= recentHigh * (1 - 0.02);
    const spacingOk = (currentBar - this.lastBuyBar) > this.spacingBars;

    const buyCondition = dipThreshold && spacingOk && this.position === 0;

    // Debug logging
    if (dipThreshold) {
      console.log(`Potential buy at bar ${currentBar}: close=${close.toFixed(2)}, recentHigh=${recentHigh.toFixed(2)}, smaF=${smaF.toFixed(2)}, smaS=${smaS.toFixed(2)}, spacingOk=${spacingOk}, position=${this.position}, lastBuyBar=${this.lastBuyBar}`);
    }

    if (buyCondition) {
      console.log(`Executing buy at bar ${currentBar}`);
      signal = 1;
      this.position = 1;
      this.entryPrice = close;
      this.stopLoss = this.entryPrice * (1 - this.stopLossPct / 100);
      this.trailingStop = 0; // Will set after profit
      this.barsSinceEntry = 0;
      this.lastBuyBar = currentBar;
      this.minLowSinceEntry = close;
    }

    // Exit conditions (Sell)
    if (this.position === 1) {
      this.barsSinceEntry++;
      this.minLowSinceEntry = Math.min(this.minLowSinceEntry, low);

      const profitTarget = this.entryPrice * (1 + this.profitTargetPct / 100);
      const overbought = rsiVal > 70 || close >= this.minLowSinceEntry * 1.05;
      const timeExit = this.barsSinceEntry >= this.timeExitBars;

      // Set trailing stop after 5% profit
      if (close >= this.entryPrice * 1.05 && this.trailingStop === 0) {
        this.trailingStop = close - (atrVal * this.trailMult);
      } else if (this.trailingStop > 0) {
        this.trailingStop = Math.max(this.trailingStop, close - (atrVal * this.trailMult));
      }

      const trailingHit = this.trailingStop > 0 && close <= this.trailingStop;

      if (close >= profitTarget || overbought || timeExit || close <= this.stopLoss || trailingHit) {
        signal = -1;
        this.position = 0;
        this.trailingStop = 0;
      }
    }

    return {
      signal, // 1: buy, -1: sell, 0: hold
      position: this.position,
      indicators: {
        emaFast: smaF,
        emaSlow: smaS,
        rsi: rsiVal,
        atr: atrVal,
        resistencia: recentHigh,
        soporte: recentLow,
        stopLoss: this.position !== 0 ? this.stopLoss : null,
        trailingStop: this.position !== 0 ? this.trailingStop : null
      }
    };
  }

  // Reset strategy state
  reset() {
    this.position = 0;
    this.entryPrice = 0;
    this.stopLoss = 0;
    this.trailingStop = 0;
    this.barsSinceEntry = 0;
    this.lastBuyBar = -this.spacingBars - 1;
    this.minLowSinceEntry = Infinity;
    this.closes = [];
    this.highs = [];
    this.lows = [];
    this.smaFastValues = [];
    this.smaSlowValues = [];
    this.rsiValues = [];
    this.atrValues = [];
    this.recentHighs = [];
    this.recentLows = [];
  }
}

// Utility functions still needed by other parts
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

const INTERVALS = new Set([
  "1m","3m","5m","15m","30m","1h","2h","4h","6h","8h","12h","1d","3d","1w","1M"
])

function nowMs() { return Date.now() }
function days(n: number) { return n * 24*60*60*1000 }

function pct(a: number, b: number) { return (a / b - 1) * 100 }
function pctFrom(a: number, p: number) { return a * (1 + p/100) }
function applyCommission(amount: number, commissionPct: number) {
  return amount * (1 - commissionPct / 100)
}
function applySlippagePx(px: number, slippagePct: number, side: string) {
  if (!slippagePct) return px
  return side === "buy" ? px * (1 + slippagePct/100) : px * (1 - slippagePct/100)
}

// Market data fetching
export async function fetchKlines(symbol: string, interval: string, startTimeMs: number, endTimeMs: number, limitPerReq = 1000) {
  if (!INTERVALS.has(interval)) throw new Error(`Unsupported interval ${interval}`)

  const out = []
  let start = startTimeMs
  let safety = 0

  while (true) {
    const url = new URL("https://api.binance.com/api/v3/klines")
    url.searchParams.set("symbol", symbol)
    url.searchParams.set("interval", interval)
    url.searchParams.set("limit", limitPerReq.toString())
    if (start) url.searchParams.set("startTime", String(start))
    if (endTimeMs) url.searchParams.set("endTime", String(endTimeMs))

    const res = await fetch(url, { headers: { "User-Agent": "paper-bot/1.0" } })
    if (!res.ok) {
      await sleep(350)
      continue
    }
    const raw = await res.json()
    if (!Array.isArray(raw) || raw.length === 0) break

    for (const k of raw) {
      const [t, o, h, l, c, v] = [k[0], k[1], k[2], k[3], k[4], k[5]]
      out.push({
        time: Number(t),
        open: Number(o),
        high: Number(h),
        low:  Number(l),
        close:Number(c),
        volume:Number(v),
      })
    }

    const last = raw[raw.length - 1][0]
    const nextStart = Number(last) + 1
    if (start && nextStart <= start) break
    start = nextStart

    if (raw.length < limitPerReq) break
    if (++safety > 1000) break
    await sleep(50)
  }

  return out
}

export {
  RTBMomentumBreakoutStrategy,
  sleep,
  INTERVALS,
  nowMs,
  days,
  pct,
  pctFrom,
  applyCommission,
  applySlippagePx
}
