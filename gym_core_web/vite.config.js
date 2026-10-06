import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 🚨 IMPORTAMOS EL NUEVO MOTOR

// https://vite.dev
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 🚨 LE DAMOS SÚPER PODERES DE DISEÑO A REACT
  ],
})
