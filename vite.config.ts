import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { FAN_DISCLAIMER, FAQ, SITE_DESCRIPTION, SITE_TITLE, SITE_URL, STEPS } from './src/lib/content/site.ts'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * SEO: meta / Open Graph tags, JSON-LD (WebApplication + FAQPage), and a
 * static copy of the landing text inside #app for crawlers and no-JS users.
 * main.ts clears #app before mounting, so visitors never see it twice.
 */
function seo(): Plugin {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Gwent Tracker',
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: 'GameApplication',
      operatingSystem: 'Any (web browser)',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ]
  const image = `${SITE_URL}og-image.jpg`
  const head = [
    `<title>${esc(SITE_TITLE)}</title>`,
    `<meta name="description" content="${esc(SITE_DESCRIPTION)}" />`,
    `<link rel="canonical" href="${SITE_URL}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Gwent Tracker" />`,
    `<meta property="og:title" content="${esc(SITE_TITLE)}" />`,
    `<meta property="og:description" content="${esc(SITE_DESCRIPTION)}" />`,
    `<meta property="og:url" content="${SITE_URL}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(SITE_TITLE)}" />`,
    `<meta name="twitter:description" content="${esc(SITE_DESCRIPTION)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ')
  const fallback = `
      <main style="max-width:48rem;margin:0 auto;padding:3rem 1rem;font-family:system-ui,sans-serif">
        <h1>Witcher 3 Gwent Card Tracker</h1>
        <p>${esc(SITE_DESCRIPTION)}</p>
        <h2>How it works</h2>
        <ol>${STEPS.map((s) => `<li><strong>${esc(s.title)}.</strong> ${esc(s.text)}</li>`).join('')}</ol>
        <h2>Frequently asked questions</h2>
        ${FAQ.map(({ q, a }) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('\n        ')}
        <p><small>${esc(FAN_DISCLAIMER)}</small></p>
      </main>
    `
  return {
    name: 'gwent-seo',
    transformIndexHtml(html) {
      return html
        .replace(/<title>.*<\/title>/, head)
        .replace('<div id="app"></div>', `<div id="app">${fallback}</div>`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Served from https://vishalgupta-git.github.io/GwentTracker/
  base: '/GwentTracker/',
  plugins: [
    tailwindcss(),
    svelte(),
    seo(),
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
