import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://vishalgupta-git.github.io/GwentTracker/
  base: '/GwentTracker/',
  plugins: [
    tailwindcss(),
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Gwent Tracker',
        short_name: 'Gwent',
        description: "Find the Witcher 3 Gwent cards you're missing, where to get them, and which are missable.",
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#211a14',
        theme_color: '#211a14',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell is precached; card images (~6 MB) are cached as you view them.
        globPatterns: ['**/*.{js,css,html,woff2,svg,png}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/cards/'),
            handler: 'CacheFirst',
            options: { cacheName: 'card-images', expiration: { maxEntries: 300 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
    },
  },
})
