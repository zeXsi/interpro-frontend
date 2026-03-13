import type { Browser } from 'playwright';
import type { LoaderFunctionArgs } from 'react-router';
import { chromium } from 'playwright';
import {
  fetchPresentation,
  getCachedPdf,
  getPresentationFingerprint,
  PDF_RENDER_VERSION,
  primePresentation,
  setCachedPdf,
} from './presentation.server';

let browserPromise: Promise<Browser> | null = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true });
    browserPromise
      .then((browser) => {
        browser.on('disconnected', () => {
          browserPromise = null;
        });
      })
      .catch(() => {
        browserPromise = null;
      });
  }

  return browserPromise;
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { name } = params;
  if (!name) throw new Response('Not Found', { status: 404 });

  const presentation = await fetchPresentation(name);
  if (!presentation) {
    throw new Response('Not Found', { status: 404 });
  }

  const fingerprint = getPresentationFingerprint(presentation);
  const cacheKey = `${PDF_RENDER_VERSION}:${name}:${fingerprint}`;
  const cachedPdf = getCachedPdf(cacheKey);

  if (cachedPdf) {
    return new Response(new Uint8Array(cachedPdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="presentation-${name}.pdf"`,
        'Cache-Control': 'private, max-age=3600',
        ETag: `"${fingerprint}"`,
      },
    });
  }

  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const token = primePresentation(presentation);
  const target = `${origin}/presentation/${name}/print?export=pdf&token=${encodeURIComponent(
    token
  )}`;

  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    screen: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: presentation.theme === 'dark' ? 'dark' : 'light',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });

  try {
    const page = await context.newPage();

    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      if (resourceType === 'media') {
        return route.abort();
      }
      return route.continue();
    });

    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('main', { timeout: 15000 });
    await page.emulateMedia({ media: 'print' });

    await page.evaluate(async (timeoutMs: number) => {
      const imageUrls = Array.from(document.querySelectorAll('img'))
        .map((img) => img.currentSrc || img.getAttribute('src'))
        .filter((src): src is string => Boolean(src));

      const uniqueImageUrls = Array.from(new Set(imageUrls));

      const waitForImage = (src: string) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.decoding = 'sync';
          img.loading = 'eager';

          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
          img.src = src;

          if (img.complete) {
            resolve();
          }
        });

      await Promise.race([
        Promise.all([
          document.fonts?.ready ?? Promise.resolve(),
          ...uniqueImageUrls.map(waitForImage),
        ]).then(() => undefined),
        new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
      ]);
    }, 10000);

    const pdf = await page.pdf({
      width: '1920px',
      height: '1080px',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      printBackground: true,
      preferCSSPageSize: true,
    });

    const pdfBytes = new Uint8Array(pdf);
    setCachedPdf(cacheKey, pdfBytes);

    return new Response(new Uint8Array(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="presentation-${name}.pdf"`,
        'Cache-Control': 'private, max-age=3600',
        ETag: `"${fingerprint}"`,
      },
    });
  } finally {
    await context.close();
  }
}
