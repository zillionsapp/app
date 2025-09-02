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
  nitro: { preset: 'vercel' },
  // Optional: make sure this route is always dynamic and never cached/prerendered
  routeRules: {
    '/api/series': { swr: false, cache: false, isr: false }
  },
  vite: {
    plugins: [tailwindcss()],
  },
  css: ["~/assets/app.css"]
})
