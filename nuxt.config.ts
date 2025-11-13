import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    baseURL: '/',            // keep '/' for zillions.app or username.github.io root
    // buildAssetsDir: 'assets/' // optional workaround if you don't want to use .nojekyll
  },
  ssr: true,
  // Make Nitro target Vercel Node functions (not edge)
  nitro: {
    preset: 'vercel',
    experimental: {
      tasks: true
    },
    scheduledTasks: {
      // Run paper trading every 5 minutes
      '0,5,10,15,20,25,30,35,40,45,50,55 * * * *': 'paper-trading',
      // Run crypto research daily at 9:00 AM UTC
      /* '0 9 * * *': 'crypto-research', */
      // Run BTC day trader every hour (24/7 for crypto)
      /* '0,5,10,15,20,25,30,35,40,45,50,55 * * * *': 'btc-day-trader' */
    }
  },
  // Optional: make sure this route is always dynamic and never cached/prerendered
  routeRules: {
    '/api/series': { swr: false, cache: false, isr: false }
  },
  vite: {
    plugins: [tailwindcss()],
  },
  css: ["~/assets/app.css"],
  modules: [
    '@clerk/nuxt',
    '@nuxtjs/i18n'
  ],
  i18n: {
    locales: [
      { code: 'en', file: 'en.json' },
      { code: 'de', file: 'de.json' }
    ],
    defaultLocale: 'en',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
      alwaysRedirect: false
    },
  },
  runtimeConfig: {
    // Private keys (only available on server-side)
    airtableApiKey: process.env.AIRTABLE_API_KEY,
    airtableBaseId: process.env.AIRTABLE_BASE_ID,
    airtableWalletTable: process.env.AIRTABLE_WALLET_TABLE,
    airtableCryptoResearchTable: process.env.AIRTABLE_CRYPTO_RESEARCH_TABLE,
    airtableReferralTable: process.env.AIRTABLE_REFERRAL_TABLE,
    airtableReferralBaseId: process.env.AIRTABLE_REFERRAL_BASE_ID,
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    anthropicApiKey: process.env.ANTHROPHIC_API_KEY,

    // Public keys (available on both client and server)
    public: {
      clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY,
      clerkSecretKey: process.env.CLERK_SECRET_KEY
    }
  },
  router: {
    middleware: ['auth']
  }
})
