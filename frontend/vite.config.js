import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use '/' for local dev, '/Architecture-Bulletin/' for GitHub Pages
  base: process.env.NODE_ENV === 'production' ? '/Architecture-Bulletin/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  preview: {
    port: 8080,
  },
})
