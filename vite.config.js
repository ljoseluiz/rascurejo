import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
    ,
    proxy: {
      // Proxy `/api/*` to local mock backend at http://localhost:3000
      // This helps avoid CORS during development. Production should use
      // a real `VITE_API_BASE_URL` and not rely on the dev proxy.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
