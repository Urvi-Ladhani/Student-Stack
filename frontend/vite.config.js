import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    // Keeps Excalidraw from looking for a missing environment
    'process.env.IS_PREACT': JSON.stringify('false')
  },
  resolve: {
    // 🔥 THE EXCALIDRAW CRASH FIX: Forces Vite to only use ONE copy of React
    dedupe: ['react', 'react-dom']
  }
})