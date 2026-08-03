import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  root: 'frontend',
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  define: {
    // Keeps Excalidraw from looking for a missing environment
    'process.env.IS_PREACT': JSON.stringify('false')
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'frontend/src'),
    },
    dedupe: ['react', 'react-dom']
  }
})
