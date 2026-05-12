import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'xpin-favicon.svg'],
          manifest: {
            id: '/',
            name: 'X-SPIN Tournament',
            short_name: 'X-SPIN',
            description: 'Ultimate tournament gaming experience',
            theme_color: '#00FFFF',
            background_color: '#000000',
            display: 'standalone',
            display_override: ['standalone', 'fullscreen', 'minimal-ui'],
            orientation: 'portrait',
            scope: '/',
            start_url: '/',
            categories: ['games', 'entertainment'],
            icons: [
              {
                src: 'xpin-favicon.svg',
                sizes: 'any',
                type: 'image/svg+xml'
              },
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png'
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
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
