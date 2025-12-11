import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

import path from 'path';
import svgr from 'vite-plugin-svgr';

const setPath = (dir: string) => {
  return path.resolve(__dirname, dir);
};

export default defineConfig({
  plugins: [svgr(), reactRouter(), tsconfigPaths()],
  css: {
    modules: {
      generateScopedName: '[local]-[hash:base64:8]',
    },
  },
  resolve: {
    alias: {
      app: setPath('./app/app'),
      shared: setPath('./app/shared'),
      pages: setPath('./app/pages'),
      assets: setPath('./app/assets'),
      store: setPath('./app/store'),
      api: setPath('./app/api'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5027,
    strictPort: true,
    hmr: {
      host: 'localhost',
    },
    allowedHosts: ['interpro.murukae.ru', 'desktop-3unaitt.taile5ae1a.ts.net','tech.interpro.pro'],
  },
});
