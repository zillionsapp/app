// server/cron/solana-price.ts
import { defineCronHandler } from '#nuxt/cron'
import type { Server } from 'socket.io'

const every10s = () => '*/10 * * * * *' // custom cron: every 10 seconds

export default defineCronHandler(every10s, async () => {
  const {
    public: { coingeckoUrl }
  } = useRuntimeConfig()

  try {
    // CoinGecko simple price endpoint: returns { solana: { usd: number } }
    const data = await $fetch<{ solana: { usd: number } }>(coingeckoUrl, {
      headers: { accept: 'application/json' }
    })

    const price = data?.solana?.usd
    if (typeof price === 'number' && globalThis.$io) {
      ;(globalThis.$io as Server).emit('solana:price', {
        usd: price,
        ts: Date.now()
      })
    }
  } catch (err) {
    console.error('SOL price cron error:', err)
  }
})
