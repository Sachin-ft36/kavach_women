import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'mapbox-gl': 'mapbox-gl/dist/mapbox-gl.js', // Force browser bundle
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: false,
    },
    server: {
      port: 8085,
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/mappls-token': {
          target: 'https://outpost.mappls.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/mappls-token/, '/api/security/oauth/token')
        },
        '/mappls-api': {
          target: 'https://atlas.mappls.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/mappls-api/, '/api/places')
        },
        '/mappls-search': {
          target: 'http://localhost:3000',
          changeOrigin: true
        },
        '/mappls-route': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    },
  };
});
