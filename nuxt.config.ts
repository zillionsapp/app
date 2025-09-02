import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    baseURL: '/',            // keep '/' for zillions.app or username.github.io root
    // buildAssetsDir: 'assets/' // optional workaround if you don't want to use .nojekyll
  },
  nitro: {
    preset: 'github_pages'    // optional, helps for GH Pages pipelines
  },
  vite: {
    plugins: [tailwindcss()],
  },
  css: ["~/assets/app.css"],
  modules: [
    'nuxt-cron',
    'nuxt-socket-io'
  ],

  // nuxt-socket-io: declare a default socket pointing at your app
  // In dev this is fine; in prod set SOCKET_URL (e.g. https://your.domain)
  io: {
    sockets: [
      {
        name: 'main',
        url: process.env.SOCKET_URL || 'http://localhost:3000',
        default: true,
        // If you proxy /socket.io, keep the path default. Otherwise set path here.
        // path: '/socket.io'
      }
    ],
    // Optional: CORS if your client & server are on different origins
    // server: { cors: { origin: ['https://your-client.app'], credentials: true } }
  },

  // (Good practice) enable Nitro websocket support; the module runs its own server,
  // but Nuxt’s docs recommend this when using sockets in Nuxt 3.
  /* nitro: {
    experimental: { websocket: true }
  }, */

  runtimeConfig: {
    public: {
      coingeckoUrl:
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
    }
  }
})
