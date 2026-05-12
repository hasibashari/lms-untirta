import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['lucide-react', 'motion', 'react-hot-toast'],
          'media-vendor': ['react-player', 'dashjs', 'hls.js'],
          'markdown-vendor': ['react-markdown', 'react-syntax-highlighter', 'remark-gfm'],
          'form-vendor': ['react-hook-form', 'zod', '@hookform/resolvers'],
          'utils-vendor': ['axios', 'clsx', 'tailwind-merge'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
