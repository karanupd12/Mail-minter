import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Output straight into Spring Boot's static resources so the jar serves the UI
    outDir: '../target/classes/static',
    emptyOutDir: true,
  },
  server: {
    // During `npm run dev`, forward API calls to the Spring Boot backend
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
