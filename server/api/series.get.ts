// server/api/series.get.ts
import { H3Event, getQuery, setHeaders, setResponseStatus } from 'h3'

// Map our Periods to lookback days (CoinGecko needs UNIX timestamps)
type Period = '1D'|'1W'|'1M'|'6M'|'1Y'|'ALL'
const PERIOD_LOOKBACK: Record<Period, number> = {
  '1D': 1,
  '1W': 7,
  '1M': 30,
  '6M': 182,
  '1Y': 365,
  'ALL': 3650 // ~10 years
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const q = getQuery(event)
    const vs = (q.vs as string | undefined)?.toLowerCase() || 'usd'
    const period = (q.period as Period | undefined) || undefined

    const from = q.from ? Number(q.from) : undefined
    const to = q.to ? Number(q.to) : Date.now()

    let fromUnix: number
    let toUnix: number

    if (from) {
      fromUnix = Math.floor(from / 1000)
      toUnix = Math.floor((q.to ? Number(q.to) : Date.now()) / 1000)
    } else if (period) {
      const lookbackDays = PERIOD_LOOKBACK[period]
      toUnix = Math.floor(Date.now() / 1000)
      fromUnix = Math.floor((Date.now() - lookbackDays * 86400000) / 1000)
    } else {
      setResponseStatus(event, 400)
      return { ok: false, error: 'Provide either ?period= or ?from=' }
    }

    // Fetch from CoinGecko
    const url = `https://api.coingecko.com/api/v3/coins/solana/market_chart/range?vs_currency=${vs}&from=${fromUnix}&to=${toUnix}`
    const res = await fetch(url, {
      headers: { 'cache-control': 'no-cache' }
    })
    if (!res.ok) {
      throw new Error(`CoinGecko ${res.status} ${res.statusText}`)
    }
    const data = await res.json()

    // CoinGecko returns prices as [timestamp, price] in ms
    const prices: [number, number][] = data.prices || []
    const timestamps = prices.map(p => p[0])
    const closes = prices.map(p => p[1])

    setHeaders(event, {
      'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=120',
      'content-type': 'application/json; charset=utf-8'
    })

    return {
      ok: true,
      provider: 'coingecko',
      vs,
      period: period ?? null,
      points: closes.length,
      timestamps,
      closes,
      latest: closes.at(-1) ?? null
    }
  } catch (err: any) {
    setResponseStatus(event, 502)
    return { ok: false, error: err?.message ?? 'CoinGecko fetch failed' }
  }
})
