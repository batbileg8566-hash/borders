import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    // AI Studio орчинд HMR-ийг DISABLE_HMR-ээр унтраадаг
    hmr: process.env.DISABLE_HMR !== 'true',
    // Локал хөгжүүлэлтэд /api/chat-ийг `vercel dev` руу дамжуулна
    proxy: process.env.API_PROXY ? { '/api': process.env.API_PROXY } : undefined,
  },
});
