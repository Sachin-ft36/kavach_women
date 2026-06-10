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
      minify: 'esbuild',
      // Zego SDK is 5 MB but loaded async (dynamic import in CallContext).
      // Mapbox + vendor-misc are also large native/transitive bundles.
      // Suppress all expected-large-chunk warnings; only unexpected bloat matters.
      chunkSizeWarningLimit: 6000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            // ── Heavy map SDK (monolithic, cannot be split further) ───────
            if (id.includes('mapbox-gl'))
              return 'vendor-mapbox';

            // ── Zego VoIP SDK (≈5 MB, async-loaded via dynamic import()) ───
            // manualChunks keeps it isolated from vendor-misc.
            // The dynamic import() in CallContext.tsx ensures it is NOT
            // downloaded at startup — only when a call is placed/answered.
            if (id.includes('@zegocloud') || id.includes('zego-zim') || id.includes('zego-express'))
              return 'vendor-zego';

            // ── PDF / canvas generation ─────────────────────────────────
            if (id.includes('jspdf') || id.includes('html2canvas'))
              return 'vendor-pdf';

            // ── Firebase platform ────────────────────────────────────────
            if (id.includes('firebase/firestore') || id.includes('@firebase/firestore'))
              return 'vendor-firebase-firestore';
            if (id.includes('firebase/storage') || id.includes('@firebase/storage'))
              return 'vendor-firebase-storage';
            if (id.includes('firebase') || id.includes('@firebase'))
              return 'vendor-firebase-core';

            // ── Supabase ─────────────────────────────────────────────────
            if (id.includes('@supabase'))
              return 'vendor-supabase';

            // ── Capacitor / native bridge ────────────────────────────────
            if (id.includes('@capacitor') || id.includes('capgo'))
              return 'vendor-capacitor';

            // ── Animation ────────────────────────────────────────────────
            if (id.includes('framer-motion') || id.includes('motion'))
              return 'vendor-motion';

            // ── Icons ────────────────────────────────────────────────────
            if (id.includes('lucide-react'))
              return 'vendor-lucide';

            // ── AI / ML SDKs ─────────────────────────────────────────────
            if (id.includes('@google/generative-ai') || id.includes('@google/genai'))
              return 'vendor-ai';

            // ── UI utilities ─────────────────────────────────────────────
            if (id.includes('sonner') || id.includes('radix-ui') || id.includes('@radix'))
              return 'vendor-ui';

            // ── Date / utility libs ──────────────────────────────────────
            if (id.includes('date-fns') || id.includes('dayjs') || id.includes('zustand'))
              return 'vendor-utils';

            // ── React core ───────────────────────────────────────────────
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('react-router'))
              return 'vendor-react';

            // ── Everything else ──────────────────────────────────────────
            return 'vendor-misc';
          }
        }
      }
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
          target: 'https://atlas.mappls.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/mappls-search/, '/api/places')
        },
        '/mappls-adv-route': {
          target: 'https://apis.mappls.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/mappls-adv-route/, '/advancedmaps/v1')
        }
      },
      headers: {
        // 🔑 Allow Firebase Google popup to communicate back with opener window
        // 'same-origin-allow-popups' allows window.closed polling from popups
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'unsafe-none'
      }
    },
  };
});
