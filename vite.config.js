import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({
    // enable JSX in .js files
    include: '**/*.{js,jsx,ts,tsx}'
  })]
})
