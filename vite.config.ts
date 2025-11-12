import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],

  server: {
    host: true,   // 🔹 permite que otros dispositivos de la red accedan (no solo localhost)
    port: 5173,   // 🔹 mismo puerto que ya usas
  },
})
