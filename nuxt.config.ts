// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@nuxtjs/i18n',
    ...(process.env.NODE_ENV !== 'test' ? ['@nuxtjs/color-mode'] : []),
    '@nuxt/test-utils/module',
    'nuxt-charts',
    '@vite-pwa/nuxt'
  ],
  colorMode: {
    preference: 'system',
    dataValue: 'theme', // try to use data-theme attribute
    classSuffix: '',
  },
  supabase: {
    redirect: false,
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
  },
  i18n: {
    locales: [
      { code: 'en', file: 'en.json' },
      { code: 'fr', file: 'fr.json' },
      { code: 'de', file: 'de.json' },
      { code: 'es', file: 'es.json' }
    ],
    defaultLocale: 'en',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'en'
    },
    vueI18n: './i18n.config.ts'
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      script: [
        {
          src: 'https://cdn.jsdelivr.net/npm/external-svg-loader@1.6.10/svg-loader.min.js',
          async: true
        }
      ]
    }
  },
  devtools: { enabled: true },
  nitro: {
    preset: 'vercel-edge',
    externals: {
      inline: [
        "@intlify/utils",
        "@intlify/core",
        "@intlify/core-base",
        "@intlify/h3",
        "@intlify/shared",
        "@intlify/message-compiler",
        "@nuxtjs/i18n",
        "vue-i18n"
      ]
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Zillions App',
      short_name: 'Crypto Trading Bot App',
      description: 'Zillions is an on‑chain, autonomous "meta‑trading" app designed to help more people participate in markets - without needing to be a pro.',
      theme_color: '#4A90E2',
      icons: [
        {
          src: '/pwa-icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/pwa-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workbox: {
      runtimeCaching: [
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'image-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
            },
          },
        },
      ],
    },
  }
})
