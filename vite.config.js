import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  base: './',
  plugins: [
    legacy({
      targets: ['defaults', 'ie >= 11'],
      renderLegacyChunks: true,
      modernPolyfills: true,
    }),
  ],
});
