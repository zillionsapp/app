/*
  Market Regime Detector – TypeScript Reference Implementation (MVP)
  ------------------------------------------------------------------
  Purpose: Detect dominant trading strategy regimes from limit-order-book (LOB) + trades,
           and map regimes to strategy recommendations.

  Notes:
  - Pure TypeScript with zero runtime deps; suitable for Node or browser (streams/WebSockets).
  - Designed for extensibility and unit testing. Replace placeholders with venue-specific wiring.
  - Compute budget: designed for ~sub-50ms per feature tick on modern hardware.

  Contents
  ========
  1) Domain Types & Enums
  2) Utilities (EWMA, RingBuffer, OnlineStats, ZScoreNormalizer)
  3) Feature Engine (selected features from the spec)
  4) Labeling Functions (heuristics → weak labels)
  5) Ensemble + Hysteresis State Machine
  6) Strategy Policy Mapper (rule-based)
  7) RegimeDetector Orchestrator
  8) Example wiring (usage)

  DISCLAIMER: This is an MVP. Some formulas are simplified for clarity and speed.
*/

// =============================
// 1) Domain Types & Enums
// =============================

export enum Regime {
  MarketMaker = 'MarketMaker',
  Scalper = 'Scalper',
  Momentum = 'Momentum',
  LiquidityHunt = 'LiquidityHunt',
  Swing = 'Swing',
  Unknown = 'Unknown',
}

export type Side = 'buy' | 'sell';

export interface Trade {
  ts: number;            // ms epoch
  price: number;
  qty: number;
  aggressorSide: Side;   // inferred or provided by venue
}

export interface BookLevel { price: number; qty: number; }

export interface BookSnapshot {
  ts: number;            // ms epoch
  bestBid: BookLevel;
  bestAsk: BookLevel;
  bids: BookLevel[];     // top K levels (descending prices)
  asks: BookLevel[];     // top K levels (ascending prices)
}

export interface FeatureVector {
  ts: number;
  spread: number;                 // absolute price units
  mid: number;
  tobi: number;                   // top-of-book imbalance [-1,1]
  kDepthImb: number;              // K-level depth imbalance [-1,1]
  qtr: number;                    // quote-to-trade ratio (approx proxy)
  ctr: number;                    // cancel-to-trade ratio (approx proxy)
  ar: number;                     // aggression ratio (MO volume / total volume)
  ss: number;                     // sweep score [0,1]
  ofi: number;                    // order-flow imbalance (simplified)
  rvS: number;                    // realized volatility (short window)
  rhoShort: number;               // short-lag return autocorr (~1–3 ticks)
  rhoLong: number;                // longer-lag autocorr (≥30s)
  hurst: number;                  // rough H estimate [0,1]
  bp: number;                     // breakout persistence [0,1]
  ats: number;                    // avg trade size
  lts: number;                    // large-trade share [0,1]
}

export interface LabelVote { regime: Regime; confidence: number; reason?: string; }

export interface RegimeDecision {
  ts: number;
  regime: Regime;
  confidence: number; // 0..1
  features: FeatureVector;
  recommendation: StrategyRecommendation;
}

export interface StrategyRecommendation {
  action: 'MeanRevertScalp' | 'FadeImpulse' | 'BreakoutTrend' | 'WaitAndEnterSecondMove' | 'HoldSwing' | 'StandAside';
  params: Record<string, number | string>;
}

export interface DetectorConfig {
  symbol: string;
  kLevels: number;          // number of LOB levels used
  featureIntervalMs: number; // cadence for feature computation
  windows: {
    rvShortSec: number;
    bpLookbackSec: number;
    ofiWindowMs: number;
    rhoShortTicks: number;
    rhoLongSec: number;
  };
  thresholds: {
    momentum: { bp: number; aggressionQuantile: number; };
    mm: { spreadTicks: number; qtrQuantile: number; };
  };
  tickSize: number;
  hysteresis: { minDurationSec: number; cooloffSec: number; };
}

// =============================
// 2) Utilities
// =============================

class EWMA {
  private alpha: number; private v: number | null = null;
  constructor(halfLifeSamples: number) {
    const lambda = Math.log(2) / Math.max(1, halfLifeSamples);
    this.alpha = 1 - Math.exp(-lambda);
  }
  update(x: number) { this.v = this.v === null ? x : this.v + this.alpha * (x - this.v); return this.v; }
  value() { return this.v ?? 0; }
}

class RingBuffer<T> {
  private buf: (T | undefined)[]; private i = 0; private filled = false;
  constructor(private capacity: number) { this.buf = new Array(capacity); }
  push(x: T) { this.buf[this.i] = x; this.i = (this.i + 1) % this.capacity; if (this.i === 0) this.filled = true; }
  values(): T[] { return (this.filled ? [...this.buf.slice(this.i), ...this.buf.slice(0, this.i)] : this.buf.slice(0, this.i)) as T[]; }
  size(): number { return this.filled ? this.capacity : this.i; }
  last(): T | undefined { return this.size() ? this.values()[this.size() - 1] : undefined; }
}

class OnlineStats { // mean/var for returns, etc.
  n = 0; mean = 0; m2 = 0;
  add(x: number) { this.n++; const d = x - this.mean; this.mean += d / this.n; this.m2 += d * (x - this.mean); }
  variance() { return this.n > 1 ? this.m2 / (this.n - 1) : 0; }
  std() { return Math.sqrt(this.variance()); }
}

class ZScoreNormalizer { // rolling z-score with EWMA mean/std
  private mean: EWMA; private varEwma: EWMA; private last: number | null = null;
  constructor(halfLifeSamples = 50) { this.mean = new EWMA(halfLifeSamples); this.varEwma = new EWMA(halfLifeSamples); }
  update(x: number): number {
    const mu = this.mean.update(x);
    const dev = x - mu;
    const v = this.varEwma.update(dev * dev);
    const sigma = Math.sqrt(Math.max(1e-12, v));
    this.last = (x - mu) / sigma;
    return this.last;
  }
  value() { return this.last ?? 0; }
}

// Rolling extreme tracker for breakout persistence (BP)
class BreakoutTracker {
  private highs: RingBuffer<number>; private lows: RingBuffer<number>;
  private successes = 0; private trials = 0; private lastCrossUpTs: number | null = null; private lastCrossDnTs: number | null = null;
  constructor(private lookbackSec: number, private kForwardMs: number, private delta: number) {
    this.highs = new RingBuffer<number>(lookbackSec);
    this.lows = new RingBuffer<number>(lookbackSec);
  }
  update(ts: number, high: number, low: number, mid: number) {
    this.highs.push(high); this.lows.push(low);
    const H = Math.max(...this.highs.values());
    const L = Math.min(...this.lows.values());
    if (mid > H && this.lastCrossUpTs === null) { this.lastCrossUpTs = ts; this.trials++; }
    if (mid < L && this.lastCrossDnTs === null) { this.lastCrossDnTs = ts; this.trials++; }
    if (this.lastCrossUpTs !== null && ts - this.lastCrossUpTs >= this.kForwardMs) {
      // success if price stayed above H+delta
      if (mid - H > this.delta) this.successes++;
      this.lastCrossUpTs = null;
    }
    if (this.lastCrossDnTs !== null && ts - this.lastCrossDnTs >= this.kForwardMs) {
      if (L - mid > this.delta) this.successes++;
      this.lastCrossDnTs = null;
    }
  }
  bp(): number { return this.trials ? this.successes / this.trials : 0.5; }
}

// =============================
// 3) Feature Engine (MVP subset)
// =============================

export class FeatureEngine {
  private trades: RingBuffer<Trade>;
  private rets: RingBuffer<number>;
  private midHistory: RingBuffer<number>;
  private ofiWindow: RingBuffer<number>;
  private rvZ = new ZScoreNormalizer(100);
  private rhoShortBuf: RingBuffer<number>;
  private rhoLongBuf: RingBuffer<number>;
  private hurstBuf: RingBuffer<number>;
  private breakout: BreakoutTracker;
  private lastMid: number | null = null;

  // book/trade counters for QTR/CTR/AR/SS approximations
  private quoteEvents = 0; private cancelEvents = 0; private tradeEvents = 0;
  private moVol = 0; private totalVol = 0; private sweepCount = 0; private sweepWindowMs = 150; // tune

  constructor(private cfg: DetectorConfig) {
    const sec = (s: number) => Math.max(1, Math.round(s));
    this.trades = new RingBuffer<Trade>(1000);
    this.rets = new RingBuffer<number>(sec(cfg.windows.rhoLongSec) * 2 * 1000 / cfg.featureIntervalMs + 100);
    this.midHistory = new RingBuffer<number>(sec(cfg.windows.rhoLongSec) * 2 + 100);
    this.ofiWindow = new RingBuffer<number>(Math.max(1, Math.round(cfg.windows.ofiWindowMs / cfg.featureIntervalMs)));
    this.rhoShortBuf = new RingBuffer<number>(Math.max(5, cfg.windows.rhoShortTicks * 3));
    this.rhoLongBuf = new RingBuffer<number>(Math.max(10, (cfg.windows.rhoLongSec * 1000) / cfg.featureIntervalMs));
    this.hurstBuf = new RingBuffer<number>(Math.max(30, (cfg.windows.rhoLongSec * 1000) / cfg.featureIntervalMs));
    this.breakout = new BreakoutTracker(cfg.windows.bpLookbackSec, 3000, cfg.tickSize * 1);
  }

  // Wire these from your market data adapter:
  onBookSnapshot(s: BookSnapshot) {
    // update counters for QTR/CTR approximations
    this.quoteEvents += 1; // each snapshot counts as quote update (approx)
    // NOTE: for real CTR, parse cancel/modify messages separately.

    const spread = s.bestAsk.price - s.bestBid.price;
    const mid = (s.bestAsk.price + s.bestBid.price) / 2;

    // OFI (simplified): change in best sizes with direction
    const lastMid = this.lastMid ?? mid;
    const ofi = (s.bestBid.qty - s.bestAsk.qty) * Math.sign(mid - lastMid);
    this.ofiWindow.push(ofi);

    this.midHistory.push(mid);
    if (this.lastMid !== null) {
      const r = (mid - this.lastMid);
      this.rets.push(r);
      this.rhoShortBuf.push(r);
      this.rhoLongBuf.push(r);
      this.hurstBuf.push(mid);
    }
    this.lastMid = mid;

    // breakout tracker requires synthetic high/low; with snapshots use best quotes as proxy
    const high = s.bestAsk.price; const low = s.bestBid.price;
    this.breakout.update(s.ts, high, low, mid);
  }

  onTrade(t: Trade) {
    this.tradeEvents += 1;
    this.totalVol += t.qty;
    this.moVol += t.qty; // assuming all prints are MO-aggressed; refine if needed

    // naive sweep: big trade relative to avg triggers sweep flag (replace with multi-level cross logic)
    const avgSize = this.trades.size() ? this.trades.values().reduce((a, b) => a + b.qty, 0) / this.trades.size() : 0;
    if (avgSize && t.qty > 2 * avgSize) this.sweepCount += 1;

    this.trades.push(t);
  }

  computeFeatures(latest: BookSnapshot): FeatureVector {
    const s = latest;
    const spread = Math.max(0, s.bestAsk.price - s.bestBid.price);
    const mid = (s.bestAsk.price + s.bestBid.price) / 2;

    const tobi = (s.bestBid.qty - s.bestAsk.qty) / Math.max(1, (s.bestBid.qty + s.bestAsk.qty));

    const k = Math.min(this.cfg.kLevels, Math.min(s.bids.length, s.asks.length));
    const sumB = s.bids.slice(0, k).reduce((a, x) => a + x.qty, 0);
    const sumA = s.asks.slice(0, k).reduce((a, x) => a + x.qty, 0);
    const kDepthImb = (sumB - sumA) / Math.max(1, sumB + sumA);

    const qtr = this.tradeEvents ? this.quoteEvents / this.tradeEvents : 0; // rough
    const ctr = this.tradeEvents ? this.cancelEvents / this.tradeEvents : 0; // requires venue cancels

    const ar = this.totalVol ? this.moVol / this.totalVol : 0;
    const ss = Math.min(1, this.tradeEvents ? this.sweepCount / this.tradeEvents : 0);
    const ofi = this.ofiWindow.values().reduce((a, b) => a + b, 0);

    // realized volatility over short window
    const rvWindow = Math.max(2, Math.round(this.cfg.windows.rvShortSec * 1000 / this.cfg.featureIntervalMs));
    const rets = this.rets.values().slice(-rvWindow);
    const rv = Math.sqrt(rets.reduce((a, r) => a + r * r, 0));
    const rvS = this.rvZ.update(rv);

    // autocorr short (lag-1) using last few returns
    const shortVals = this.rhoShortBuf.values();
    const rhoShort = autocorr(shortVals, 1);

    const longVals = this.rhoLongBuf.values();
    const longLag = Math.max(1, Math.round((this.cfg.windows.rhoLongSec * 1000) / this.cfg.featureIntervalMs / 5));
    const rhoLong = autocorr(longVals, longLag);

    const hurst = approximateHurst(this.hurstBuf.values());
    const bp = this.breakout.bp();

    // trade size stats
    const sizes = this.trades.values().map(t => t.qty);
    const ats = sizes.length ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0;
    const thresh = quantile(sizes, 0.9);
    const lts = sizes.length ? sizes.filter(x => x >= thresh).length / sizes.length : 0;

    // decay sweeping counters for next cycle
    this.quoteEvents = Math.floor(this.quoteEvents * 0.5);
    this.cancelEvents = Math.floor(this.cancelEvents * 0.5);
    this.tradeEvents = Math.floor(this.tradeEvents * 0.5);
    this.moVol *= 0.5; this.totalVol *= 0.5; this.sweepCount = Math.floor(this.sweepCount * 0.5);

    return { ts: s.ts, spread, mid, tobi, kDepthImb, qtr, ctr, ar, ss, ofi, rvS, rhoShort, rhoLong, hurst, bp, ats, lts };
  }
}

// helpers
function quantile(arr: number[], q: number): number { if (!arr.length) return 0; const a = [...arr].sort((x, y) => x - y); const i = Math.min(a.length - 1, Math.max(0, Math.floor(q * (a.length - 1)))); return a[i]; }
function mean(arr: number[]): number { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
function variance(arr: number[]): number { const m = mean(arr); return arr.length ? arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length : 0; }
function autocorr(arr: number[], lag: number): number { const n = arr.length; if (n <= lag || lag <= 0) return 0; const a = arr.slice(lag); const b = arr.slice(0, n - lag); const ma = mean(a), mb = mean(b); const num = a.reduce((s, x, i) => s + (x - ma) * (b[i] - mb), 0); const den = Math.sqrt(a.reduce((s, x) => s + (x - ma) ** 2, 0) * b.reduce((s, x) => s + (x - mb) ** 2, 0)); return den ? num / den : 0; }
function approximateHurst(series: number[]): number { // very rough DFA-like proxy
  const n = series.length; if (n < 20) return 0.5; const m = mean(series); const cum = series.map((x, i) => (i === 0 ? x - m : (x - m) + (cum as any)[i - 1])); const windows = [Math.floor(n / 4), Math.floor(n / 2)]; const rs: number[] = []; for (const w of windows) { if (w < 5) continue; let rOverS = 0; const k = Math.floor(n / w); for (let i = 0; i < k; i++) { const seg = cum.slice(i * w, (i + 1) * w); const segMean = mean(seg); const dev = seg.map(x => x - segMean); const R = Math.max(...dev) - Math.min(...dev); const S = Math.sqrt(variance(seg)); rOverS += S > 0 ? R / S : 0; } rOverS /= Math.max(1, k); rs.push(Math.log(rOverS) / Math.log(w)); } if (!rs.length) return 0.5; return Math.max(0, Math.min(1, mean(rs)));
}

// =============================
// 4) Labeling Functions (LFs)
// =============================

export class LabelingFunctions {
  constructor(private cfg: DetectorConfig) {}

  lfMarketMaker(f: FeatureVector): LabelVote | null {
    const spreadTicks = Math.round(f.spread / this.cfg.tickSize);
    const cond = spreadTicks <= this.cfg.thresholds.mm.spreadTicks && f.qtr >= 1.0 && Math.abs(f.tobi) < 0.2 && f.rvS < 0.2 && Math.abs(f.rhoShort) < 0.1;
    if (!cond) return null; return { regime: Regime.MarketMaker, confidence: 0.7, reason: 'tight spread + high QTR + low RV' };
  }

  lfScalper(f: FeatureVector): LabelVote | null {
    const cond = f.ss < 0.15 && f.rvS < 0.6 && f.rhoShort < -0.1 && Math.abs(f.tobi) < 0.4 && f.ar < 0.6;
    if (!cond) return null; return { regime: Regime.Scalper, confidence: 0.6, reason: 'neg short autocorr + low sweeps' };
  }

  lfMomentum(f: FeatureVector): LabelVote | null {
    const cond = f.bp >= this.cfg.thresholds.momentum.bp && f.ar > 0.6 && f.ss > 0.2 && f.rvS > 0.4 && f.rhoShort > 0;
    if (!cond) return null; return { regime: Regime.Momentum, confidence: 0.75, reason: 'high BP + high aggression' };
  }

  lfLiquidityHunt(f: FeatureVector): LabelVote | null {
    const wickProxy = Math.abs(f.ofi) > quantile([Math.abs(f.ofi)], 0.5); // placeholder; replace with wick ratio
    const cond = wickProxy && f.rvS > 0.5 && f.bp < 0.55;
    if (!cond) return null; return { regime: Regime.LiquidityHunt, confidence: 0.65, reason: 'OFI spikes + breakout failures' };
  }

  lfSwing(f: FeatureVector): LabelVote | null {
    const cond = f.rhoLong > 0.1 && f.hurst > 0.55 && f.ats > 0 && f.lts > 0.1 && f.rvS >= 0.2;
    if (!cond) return null; return { regime: Regime.Swing, confidence: 0.6, reason: 'pos long autocorr + H>0.55' };
  }

  vote(f: FeatureVector): LabelVote[] {
    const votes = [this.lfMarketMaker(f), this.lfScalper(f), this.lfMomentum(f), this.lfLiquidityHunt(f), this.lfSwing(f)].filter(Boolean) as LabelVote[];
    return votes.length ? votes : [{ regime: Regime.Unknown, confidence: 0.2, reason: 'no LF matched' }];
  }
}

// =============================
// 5) Ensemble + Hysteresis
// =============================

export class Ensemble {
  decide(votes: LabelVote[]): { regime: Regime; confidence: number } {
    const weight: Record<Regime, number> = { [Regime.MarketMaker]: 0, [Regime.Scalper]: 0, [Regime.Momentum]: 0, [Regime.LiquidityHunt]: 0, [Regime.Swing]: 0, [Regime.Unknown]: 0 };
    for (const v of votes) weight[v.regime] += v.confidence;
    // tie-breakers: Momentum > Scalper when both high
    if (weight[Regime.Momentum] === weight[Regime.Scalper] && weight[Regime.Momentum] > 0) {
      weight[Regime.Momentum] += 0.05;
    }
    let best: Regime = Regime.Unknown; let bestW = -1;
    for (const k of Object.keys(weight) as Regime[]) { if (weight[k] > bestW) { best = k; bestW = weight[k]; } }
    const total = Object.values(weight).reduce((a, b) => a + b, 0) || 1;
    return { regime: best, confidence: Math.min(1, bestW / total) };
  }
}

export class Hysteresis {
  private current: Regime = Regime.Unknown;
  private enteredAt = 0; private lastSwitchAt = 0;
  constructor(private cfg: DetectorConfig) {}
  update(ts: number, proposal: Regime, conf: number): { regime: Regime; confidence: number } {
    const now = ts;
    if (this.current === Regime.Unknown) {
      this.current = proposal; this.enteredAt = now; this.lastSwitchAt = now; return { regime: this.current, confidence: conf };
    }
    if (proposal !== this.current) {
      const held = (now - this.enteredAt) / 1000;
      if (held >= this.cfg.hysteresis.minDurationSec && (now - this.lastSwitchAt) / 1000 >= this.cfg.hysteresis.cooloffSec) {
        this.current = proposal; this.enteredAt = now; this.lastSwitchAt = now; return { regime: this.current, confidence: conf * 0.95 };
      }
      return { regime: this.current, confidence: conf * 0.5 };
    }
    return { regime: this.current, confidence: conf };
  }
}

// =============================
// 6) Strategy Policy Mapper (rule-based MVP)
// =============================

export class PolicyMapper {
  constructor(private cfg: DetectorConfig) {}
  map(f: FeatureVector, regime: Regime): StrategyRecommendation {
    switch (regime) {
      case Regime.MarketMaker:
        return { action: 'MeanRevertScalp', params: { entryMicroDevSpreads: 0.4, targetSpreads: 0.7, timeStopSec: 4 } };
      case Regime.Scalper:
        return { action: 'FadeImpulse', params: { bandSpreads: 1.2, timeStopSec: 6, maxInventory: 2 } };
      case Regime.Momentum:
        return { action: 'BreakoutTrend', params: { minBP: this.cfg.thresholds.momentum.bp, trailATRmult: 1.2, addOn: 0.5 } };
      case Regime.LiquidityHunt:
        return { action: 'WaitAndEnterSecondMove', params: { waitMs: 1500, minOFI: 2.0, reduceSize: 0.5 } };
      case Regime.Swing:
        return { action: 'HoldSwing', params: { holdMinSec: 120, pyramidStepATR: 0.7 } };
      default:
        return { action: 'StandAside', params: {} };
    }
  }
}

// =============================
// 7) Orchestrator
// =============================

export class RegimeDetector {
  private fe: FeatureEngine; private lfs: LabelingFunctions; private ens = new Ensemble(); private hyst: Hysteresis; private policy: PolicyMapper;
  private latestBook: BookSnapshot | null = null;

  constructor(private cfg: DetectorConfig) {
    this.fe = new FeatureEngine(cfg);
    this.lfs = new LabelingFunctions(cfg);
    this.hyst = new Hysteresis(cfg);
    this.policy = new PolicyMapper(cfg);
  }

  onBookSnapshot(s: BookSnapshot) { this.latestBook = s; this.fe.onBookSnapshot(s); }
  onTrade(t: Trade) { this.fe.onTrade(t); }

  // Invoke every featureIntervalMs
  tick(): RegimeDecision | null {
    if (!this.latestBook) return null;
    const f = this.fe.computeFeatures(this.latestBook);
    const votes = this.lfs.vote(f);
    const { regime: rawRegime, confidence: ensConf } = this.ens.decide(votes);
    const { regime, confidence } = this.hyst.update(f.ts, rawRegime, ensConf);
    const rec = this.policy.map(f, regime);
    return { ts: f.ts, regime, confidence, features: f, recommendation: rec };
  }
}

// =============================
// 8) Example Usage (remove or adapt in production)
// =============================

if (require?.main === module) {
  // Example config for a futures symbol with 0.25 tick size
  const cfg: DetectorConfig = {
    symbol: 'ES',
    kLevels: 10,
    featureIntervalMs: 500,
    windows: { rvShortSec: 30, bpLookbackSec: 300, ofiWindowMs: 2000, rhoShortTicks: 3, rhoLongSec: 60 },
    thresholds: { momentum: { bp: 0.65, aggressionQuantile: 0.75 }, mm: { spreadTicks: 1, qtrQuantile: 0.8 } },
    tickSize: 0.25,
    hysteresis: { minDurationSec: 20, cooloffSec: 10 },
  };

  const det = new RegimeDetector(cfg);

  // Mock feed (replace with real adapter)
  let ts = Date.now();
  for (let i = 0; i < 2000; i++) {
    ts += 200; // 5 Hz snapshots
    const bidPx = 5000 + Math.sin(i / 30) * 2 + (Math.random() - 0.5) * 0.5;
    const askPx = bidPx + cfg.tickSize;
    const book: BookSnapshot = {
      ts,
      bestBid: { price: bidPx, qty: 50 + Math.round(Math.random() * 20) },
      bestAsk: { price: askPx, qty: 50 + Math.round(Math.random() * 20) },
      bids: Array.from({ length: cfg.kLevels }, (_, k) => ({ price: bidPx - (k + 1) * cfg.tickSize, qty: 30 + Math.round(Math.random() * 30) })),
      asks: Array.from({ length: cfg.kLevels }, (_, k) => ({ price: askPx + (k) * cfg.tickSize, qty: 30 + Math.round(Math.random() * 30) })),
    };
    det.onBookSnapshot(book);

    if (Math.random() < 0.5) {
      const trade: Trade = { ts, price: (bidPx + askPx) / 2, qty: 1 + Math.round(Math.random() * 5), aggressorSide: Math.random() < 0.5 ? 'buy' : 'sell' };
      det.onTrade(trade);
    }

    if (i % Math.round(cfg.featureIntervalMs / 200) === 0) {
      const d = det.tick();
      if (d && i % 10 === 0) {
        // eslint-disable-next-line no-console
        console.log(new Date(d.ts).toISOString(), d.regime, `conf=${d.confidence.toFixed(2)}`, d.recommendation);
      }
    }
  }
}
