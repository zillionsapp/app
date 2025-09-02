import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    baseURL: '/',            // keep '/' for zillions.app or username.github.io root
    // buildAssetsDir: 'assets/' // optional workaround if you don't want to use .nojekyll
  },
  ssr: true,
  vite: {
    plugins: [tailwindcss()],
  },
  css: ["~/assets/app.css"]
})
