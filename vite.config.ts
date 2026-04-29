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
    },
  };
});
