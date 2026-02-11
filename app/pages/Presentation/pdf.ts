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
    await page.waitForTimeout(1200);
    await page.emulateMedia({ media: 'print' });

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