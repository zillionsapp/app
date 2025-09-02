import { H3Event, getQuery, setResponseStatus, setHeaders } from 'h3'

// Binance REST (server-side avoids CORS)
const BINANCE_BASE = 'https://api.binance.com'

// “UI klines” are fine for charts; fall back to /klines if ever needed.
type Kline = [ number, string, string, string, string, string, number, string, number, string, string, string ]
type Period = '1D'|'1W'|'1M'|'6M'|'1Y'|'ALL'

const PERIOD_CFG: Record<Period, { interval: string; lookbackMs?: number }> = {
  '1D':  { interval: '5m', lookbackMs: 24*60*60*1000 },
  '1W':  { interval: '1h', lookbackMs: 7*24*60*60*1000 },
  '1M':  { interval: '4h', lookbackMs: 30*24*60*1000*24 },
  '6M':  { interval: '1d', lookbackMs: 182*24*60*60*1000 },
  '1Y':  { interval: '1d', lookbackMs: 365*24*60*60*1000 },
  'ALL': { interval: '1w' },
}

async function fetchKlines(params: {
  symbol: string
  interval: string
  startTime?: number
  endTime?: number
  limit?: number
}): Promise<Kline[]> {
  const url = new URL('/api/v3/uiKlines', BINANCE_BASE)
  Object.entries({ limit: 1000, ...params }).forEach(([k, v]) => {
    if (v !== undefined) url.searchParams.set(k, String(v))
  })
  const res = await fetch(url, {
    headers: {
      'cache-control': 'no-cache',
      'user-agent': 'zillions-wallet/1.0 (+nuxt-server)'
    }
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Upstream ${res.status} ${res.statusText} ${text}`.trim())
  }
  return await res.json()
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const q = getQuery(event)
    const symbol = (q.symbol as string | undefined)?.toUpperCase() || 'SOLUSDT'
    const period = (q.period as Period) || '1M'
    if (!(period in PERIOD_CFG)) {
      setResponseStatus(event, 400)
      return { error: 'Invalid period', allowed: Object.keys(PERIOD_CFG) }
    }

    const cfg = PERIOD_CFG[period]
    const now = Date.now()

    let klines: Kline[] = []

    if (period === 'ALL') {
      // Walk back in time page-by-page (weekly candles = light)
      let end = now
      let safety = 24 // ~24k weeks is overkill; this caps requests hard.
      while (safety-- > 0) {
        const batch = await fetchKlines({ symbol, interval: cfg.interval, endTime: end, limit: 1000 })
        if (!batch.length) break
        // Prepend older candles
        klines = [...batch, ...klines]
        // Next page ends just before first open time
        const firstOpen = Number(batch[0][0])
        end = firstOpen - 1
        if (batch.length < 1000) break
        // Tiny delay to be polite
        await new Promise(r => setTimeout(r, 100))
      }
    } else {
      const start = now - (cfg.lookbackMs as number)
      klines = await fetchKlines({ symbol, interval: cfg.interval, startTime: start, endTime: now })
    }

    // Normalize
    const candles = klines.map(k => ({
      t: Number(k[0]),                   // open time (ms)
      o: Number(k[1]),
      h: Number(k[2]),
      l: Number(k[3]),
      c: Number(k[4]),
      v: Number(k[5]),
    }))

    const closes = candles.map(c => c.c)
    const timestamps = candles.map(c => c.t)

    // Cache strategy
    // Short periods: 15s; longer: 60s; ALL: 6h (data rarely changes)
    const cacheControl =
      period === '1D' ? 'public, max-age=0, s-maxage=15, stale-while-revalidate=30' :
      period === '1W' ? 'public, max-age=0, s-maxage=30, stale-while-revalidate=60' :
      period === '1M' ? 'public, max-age=0, s-maxage=60, stale-while-revalidate=120' :
      period === '6M' || period === '1Y' ? 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' :
      'public, max-age=0, s-maxage=21600, stale-while-revalidate=86400'

    setHeaders(event, {
      'cache-control': cacheControl,
      'content-type': 'application/json; charset=utf-8'
    })

    return {
      ok: true,
      symbol,
      period,
      interval: cfg.interval,
      points: closes.length,
      timestamps,
      closes,
      candles,
      latest: closes.at(-1) ?? null
    }
  } catch (err: any) {
    setResponseStatus(event, 502)
    return { ok: false, error: err?.message ?? 'Upstream error' }
  }
})
