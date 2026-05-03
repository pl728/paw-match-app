import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Allows the frontend to send requests to the backend without middleware 
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 100
    },
    proxy: {
      '/auth': 'http://localhost:4516',
      '/pets': 'http://localhost:4516',
      '/shelters': 'http://localhost:4516',
      '/users': 'http://localhost:4516',
      '/feed_events': 'http://localhost:4516',
      '/favorites': 'http://localhost:4516',
      '/shelter-follows': 'http://localhost:4516',
      '/shelter-posts': 'http://localhost:4516',
      '/email-notifications': 'http://localhost:4516',
      '/recommendations': 'http://localhost:4516',
      '/api': 'http://localhost:4516'
    }
  }
})
