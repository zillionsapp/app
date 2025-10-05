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
    '@clerk/nuxt'
  ],
  runtimeConfig: {
    public: {
      clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY,
      clerkSecretKey: process.env.CLERK_SECRET_KEY
    }
  },
  router: {
    middleware: ['auth']
  }
})