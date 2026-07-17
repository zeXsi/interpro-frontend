import { PassThrough } from 'node:stream';

import { createReadableStreamFromReadable } from '@react-router/node';
import { isbot } from 'isbot';
import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import { renderToPipeableStream } from 'react-dom/server';
import type { AppLoadContext, EntryContext } from 'react-router';
import { ServerRouter } from 'react-router';

import { startSitemapScheduler } from 'create-sitemap';

export const streamTimeout = 5_000;

void startSitemapScheduler();

/** Сколько общий кэш (CDN/прокси) держит HTML свежим. Браузер всегда ревалидирует. */
const HTML_S_MAXAGE = Number(process.env.HTML_S_MAXAGE ?? 60);
const HTML_STALE_WHILE_REVALIDATE = Number(process.env.HTML_SWR ?? 300);

function applyCacheControl(request: Request, headers: Headers, status: number) {
  // Роут-специфичный headers()-экспорт имеет приоритет.
  if (headers.has('Cache-Control')) return;

  const url = new URL(request.url);

  // Персональные презентации не должны попадать в общий кэш.
  if (url.pathname.startsWith('/presentation')) {
    headers.set('Cache-Control', 'private, no-store');
    return;
  }

  const isCacheable =
    request.method === 'GET' && status === 200 && !headers.has('Set-Cookie') && !url.search;

  if (!isCacheable) {
    headers.set('Cache-Control', 'private, no-store');
    return;
  }

  // max-age=0 — пользователь никогда не видит устаревшую страницу из своего браузера;
  // s-maxage/stale-while-revalidate работают только для общего кэша перед приложением.
  headers.set(
    'Cache-Control',
    `public, max-age=0, s-maxage=${HTML_S_MAXAGE}, stale-while-revalidate=${HTML_STALE_WHILE_REVALIDATE}`
  );
  headers.set('Vary', 'Accept-Encoding');
}

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const userAgent = request.headers.get('user-agent');
    const readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode ? 'onAllReady' : 'onShellReady';
    let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => abort(),
      streamTimeout + 1_000
    );

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = undefined;
              callback();
            },
          });
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set('Content-Type', 'text/html');
          applyCacheControl(request, responseHeaders, responseStatusCode);
          pipe(body);

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );
  });
}
