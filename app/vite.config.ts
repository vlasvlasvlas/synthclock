import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/synthclock/', // Base path for GitHub Pages
  build: {
    target: ['es2020', 'safari14', 'chrome87', 'firefox78'],
  },
  esbuild: {
    target: 'es2020',
  },
})
