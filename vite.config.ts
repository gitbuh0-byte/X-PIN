import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const inlineEnv = {
      VITE_SUPABASE_URL: env.VITE_SUPABASE_URL || env.SUPABASE_URL || process.env.SUPABASE_URL || '',
      VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
      VITE_BACKEND_URL: env.VITE_BACKEND_URL || env.BACKEND_URL || process.env.BACKEND_URL || '',
      VITE_BACKEND_WS_URL: env.VITE_BACKEND_WS_URL || env.BACKEND_WS_URL || process.env.BACKEND_WS_URL || '',
    };

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'favicon-32x32.png', 'favicon-192x192.png', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'masked-icon.svg'],
          manifest: {
            id: '/',
            name: 'X-SPIN Tournament',
            short_name: 'X-SPIN',
            description: 'Ultimate tournament gaming experience - Hyper-Competitive Betting Engine',
            theme_color: '#050006',
            background_color: '#000000',
            display: 'standalone',
            display_override: ['standalone', 'fullscreen', 'minimal-ui'],
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            categories: ['games', 'entertainment'],
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable any'
              }
            ]
          }
        })
      ],
      define: {
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(inlineEnv.VITE_SUPABASE_URL),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(inlineEnv.VITE_SUPABASE_ANON_KEY),
        'import.meta.env.VITE_BACKEND_URL': JSON.stringify(inlineEnv.VITE_BACKEND_URL),
        'import.meta.env.VITE_BACKEND_WS_URL': JSON.stringify(inlineEnv.VITE_BACKEND_WS_URL),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
