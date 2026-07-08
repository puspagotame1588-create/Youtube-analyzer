import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// DEPLOY_BASE lets the same build work at a sub-path (GitHub Pages)
// or at the domain root (Vercel, custom domain) — defaults to '/'.
export default defineConfig({
  base: process.env.DEPLOY_BASE || '/',
  plugins: [react(), tailwindcss()],
})
