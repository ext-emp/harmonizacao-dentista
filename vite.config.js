import { defineConfig } from 'vite';
import montarHtml from './vite/montar-html.js';

export default defineConfig({
  plugins: [montarHtml()],
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    target: 'es2020',
    // Three.js fica num pedaço separado, carregado só depois do conteúdo.
    chunkSizeWarningLimit: 900,
  },
});
