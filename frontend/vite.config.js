import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // <-- FIXED: Changed from '@vitejs/react-vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})