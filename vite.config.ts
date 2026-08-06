import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Ensures assets are loaded with relative paths, fixing GitHub Pages white screen
  server: {
    port: 7889,
    host: true, // Listens on 0.0.0.0, 127.0.0.1, and localhost
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Workout Tracker',
        short_name: 'Tracker',
        description: 'Personal offline workout tracker',
        theme_color: '#0f1115',
        background_color: '#0f1115',
        display: 'standalone'
      }
    })
  ],
})
