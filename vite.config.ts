import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

import path from 'path';
import svgr from 'vite-plugin-svgr';

const setPath = (dir: string) => {
  return path.resolve(__dirname, dir);
};

export default defineConfig(({ command }) => {
  const assetBaseUrl = process.env.VITE_ASSET_BASE_URL?.trim().replace(/\/+$/, '');

  if (command === 'build' && assetBaseUrl) {
    const parsedAssetBaseUrl = new URL(assetBaseUrl);
    if (
      parsedAssetBaseUrl.protocol !== 'https:' ||
      parsedAssetBaseUrl.origin !== assetBaseUrl ||
      parsedAssetBaseUrl.username ||
      parsedAssetBaseUrl.password
    ) {
      throw new Error('VITE_ASSET_BASE_URL must be an HTTPS origin without credentials, path, query, or hash');
    }
  }

  return {
    base: command === 'build' && assetBaseUrl ? `${assetBaseUrl}/` : '/',
    plugins: [
    svgr(),
    reactRouter(),
    tsconfigPaths(),
    {
      name: 'configure-hls-response-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || '';
          
          if (url.includes('/videos/') && url.endsWith('.ts')) {
            // Устанавливаем правильный MIME-тип для HLS сегментов
            const originalWriteHead = res.writeHead;
            res.writeHead = function(statusCode: number, headers?: any) {
              res.setHeader('Content-Type', 'video/mp2t');
              res.setHeader('Access-Control-Allow-Origin', '*');
              return originalWriteHead.call(this, statusCode, headers);
            };
          } else if (url.endsWith('.m3u8')) {
            // Устанавливаем правильный MIME-тип для плейлистов
            const originalWriteHead = res.writeHead;
            res.writeHead = function(statusCode: number, headers?: any) {
              res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
              res.setHeader('Access-Control-Allow-Origin', '*');
              return originalWriteHead.call(this, statusCode, headers);
            };
          }
          
          next();
        });
      },
    },
  ],
    css: {
      modules: {
        generateScopedName: '[local]-[hash:base64:8]',
      },
    },
    build: {
      // Lighthouse showed many tiny render-blocking stylesheets. The total CSS
      // footprint is small enough that a single production stylesheet is cheaper
      // than the request waterfall on the critical path.
      cssCodeSplit: false,
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
    assetsInclude: ['**/*.m3u8'],
    server: {
      host: '0.0.0.0',
      port: 5027,
      strictPort: true,
      hmr: {
        host: 'localhost',
      },
      allowedHosts: ['interpro.murukae.ru', 'desktop-3unaitt.taile5ae1a.ts.net','tech.interpro.pro'],
    },
  };
});
