import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/super-duper-carnival/', // Exact base URL for GitHub Pages repo
  server: {
    port: 7889,
    host: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
      },
      manifest: {
        name: 'Workout Tracker',
        short_name: 'Tracker',
        description: 'Personal offline workout tracker',
        start_url: '/super-duper-carnival/',
        scope: '/super-duper-carnival/',
        display: 'standalone',
        display_override: ['standalone', 'fullscreen'],
        background_color: '#f1f5f9',
        theme_color: '#f1f5f9',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
