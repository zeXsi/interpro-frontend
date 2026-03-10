import type { LoaderFunctionArgs } from 'react-router';
import { chromium } from 'playwright';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { name } = params;
  if (!name) throw new Response('Not Found', { status: 404 });

  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const target = `${origin}/presentation/${name}?export=pdf`;

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });

    // HLS/video requests keep network busy and make networkidle unreliable for PDF export.
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

    // Trigger lazy loaders by walking through the page once.
    await page.evaluate(async () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight || 1080;
      const step = Math.max(Math.floor(viewportHeight * 0.9), 1);

      for (let y = 0; y < scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 40));
      }

      window.scrollTo(0, 0);
    });

    // Wait until images are loaded (or timeout) to avoid blank slides in PDF.
    await page.evaluate(async (timeoutMs: number) => {
      const images = Array.from(document.images);

      images.forEach((img) => {
        img.setAttribute('loading', 'eager');
        img.setAttribute('decoding', 'sync');
      });

      const waitForImage = (img: HTMLImageElement) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }

          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        });

      await Promise.race([
        Promise.all(images.map(waitForImage)).then(() => undefined),
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

    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="presentation-${name}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } finally {
    await browser.close();
  }
}
