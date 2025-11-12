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