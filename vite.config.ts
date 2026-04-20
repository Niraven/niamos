import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite configuration for niamOS
 * PWA-enabled React application with TypeScript
 */

export default defineConfig({
  base: './',
  plugins: [react()],
  
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    // Enable HTTPS for localhost (required for some APIs like Web Speech)
    // https: true,
  },

  preview: {
    port: 4173,
    host: true,
  },

  build: {
    target: 'ES2020',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          // Code splitting strategy
          openclaw: ['./src/services/openclaw.ts'],
          components: ['./src/components/OpenClawChat.tsx', './src/components/OpenClawSettings.tsx'],
        },
      },
    },
    sourcemap: false,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@services': path.resolve(__dirname, './src/services'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },

  // PWA configuration via manifest
  publicDir: 'public',
});
