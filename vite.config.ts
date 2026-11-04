import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// På GitHub Pages bygges med --base=/<repo>/ (se .github/workflows/pages.yml).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // En ny version vises som en knap på forsiden i stedet for at genindlæse midt i en session.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      // Skrifterne gemmes offline sammen med resten af appen (SPEC-design-som-forsiden.md).
      workbox: { globPatterns: ['**/*.{js,css,html,woff2}'] },
      manifest: {
        name: 'Fordelingstræneren',
        short_name: 'Fordeling',
        description: 'Træn hånd-fordelinger i bridge – fem minutter om dagen.',
        lang: 'da',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#f2f3f4',
        background_color: '#f2f3f4',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
