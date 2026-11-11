import http from 'node:http';
import https from 'node:https';
import { writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { chromium } from 'playwright';

const baseURL = process.env.METRICS_URL || 'http://localhost:5031';
const output = process.argv[2];
if (!output) throw new Error('Usage: node tests/data-metrics.mjs <output.json>');
const routes = ['/', '/projects', '/services', '/about-us', '/faq', '/blog'];
const bytes = (value) => Buffer.byteLength(value, 'utf8');

function documentRequest(route) {
  return new Promise((resolve, reject) => {
    const url = new URL(route, baseURL);
    const start = performance.now();
    (url.protocol === 'https:' ? https : http).get(url, {
      headers: { 'accept-encoding': 'identity', 'user-agent': 'data-metrics/1.0' },
    }, (response) => {
      const ttfbMs = performance.now() - start;
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => {
        const body = Buffer.concat(chunks);
        const html = body.toString('utf8');
        const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
          .filter((match) => !/\bsrc\s*=/.test(match[1])).map((match) => match[2]);
        const ssrScripts = inline.filter((text) => text.includes('__SSR_STATE__'));
        const routerScripts = inline.filter((text) => /__reactRouterContext|streamController\.enqueue/.test(text));
        const hydration = inline.filter((text) => /__SSR_STATE__|__reactRouterContext|streamController\.enqueue/.test(text));
        const serialized = ssrScripts.map((text) => text.match(/window\[['"]__SSR_STATE__['"]\]\s*=\s*([\s\S]*?);?\s*$/)?.[1]?.replace(/;$/, '') || '');
        const state = serialized.map((text) => { try { return JSON.parse(text); } catch { return null; } });
        resolve({ route, status: response.statusCode, htmlBytes: body.length,
          contentEncoding: response.headers['content-encoding'] || 'identity',
          ssrSerializedBytes: serialized.reduce((sum, text) => sum + bytes(text), 0),
          ssrScriptBytes: ssrScripts.reduce((sum, text) => sum + bytes(text), 0),
          routerHydrationScriptBytes: routerScripts.reduce((sum, text) => sum + bytes(text), 0),
          allHydrationScriptBytes: hydration.reduce((sum, text) => sum + bytes(text), 0),
          allInlineScriptBytes: inline.reduce((sum, text) => sum + bytes(text), 0),
          ssrStateKeys: state.flatMap((item) => item ? Object.keys(item) : []),
          title: html.match(/<title>([\s\S]*?)<\/title>/i)?.[1],
          ttfbMs, totalMs: performance.now() - start });
      });
    }).on('error', reject).setTimeout(120_000, function () { this.destroy(new Error('Document timed out')); });
  });
}

const result = {
  measuredAt: new Date().toISOString(), baseURL,
  conditions: { node: process.version, samples: 3, warmupPasses: 1,
    documentAcceptEncoding: 'identity', browser: 'installed Playwright Chromium, headless, fresh context, 1440x1000',
    browserSettleMs: 5000, networkMocks: false,
    bytes: 'Document UTF-8 uncompressed response bytes; script bytes exclude script tags. SSR serialized bytes are literal JSON UTF-8. RR bytes include context/bootstrap + all inline stream enqueue scripts. Browser decodedBodyBytes uses response.body(); encodedBodyBytes/responseHeadersBytes use request.sizes(), not TCP/TLS overhead.' },
  warmup: [], documents: [], browser: {},
};
for (const route of routes) result.warmup.push(await documentRequest(route));
for (const route of routes) {
  const samples = [];
  for (let i = 0; i < 3; i++) samples.push(await documentRequest(route));
  const median = (key) => samples.map((sample) => sample[key]).sort((a, b) => a - b)[1];
  result.documents.push({ ...samples[0], ttfbMs: median('ttfbMs'), totalMs: median('totalMs'), samples });
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  let phase = 'home';
  const requests = [];
  const errors = [];
  const consoleErrors = [];
  const pending = [];
  page.on('pageerror', (error) => errors.push({ phase, message: error.message }));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push({ phase, message: message.text() });
  });
  page.on('request', (request) => {
    if (!/\/wp-json\/|\.data(?:\?|$)/.test(request.url())) return;
    const record = { phase, url: request.url(), resourceType: request.resourceType() };
    requests.push(record);
    request.__metricsRecord = record;
  });
  page.on('requestfailed', (request) => {
    if (request.__metricsRecord) request.__metricsRecord.failure = request.failure();
  });
  page.on('response', (response) => {
    const record = response.request().__metricsRecord;
    if (!record) return;
    pending.push((async () => {
      record.status = response.status();
      record.contentEncoding = response.headers()['content-encoding'] || 'identity';
      try {
        record.decodedBodyBytes = (await response.body()).length;
        const sizes = await response.request().sizes();
        record.encodedBodyBytes = sizes.responseBodySize;
        record.responseHeadersBytes = sizes.responseHeadersSize;
        record.timing = response.request().timing();
      } catch (error) { record.bodyError = error.message; }
    })());
  });
  const start = performance.now();
  await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForTimeout(5000);
  result.browser.home = { elapsedIncludingSettleMs: performance.now() - start,
    navigation: await page.evaluate(() => performance.getEntriesByType('navigation')[0].toJSON()),
    title: await page.title() };
  const links = page.locator('a[href="/projects"]');
  let link;
  for (const candidate of await links.all()) if (await candidate.isVisible()) { link = candidate; break; }
  if (!link) throw new Error('No visible home link to /projects');
  phase = 'home-to-projects';
  const navStart = performance.now();
  await link.click();
  await page.waitForURL('**/projects', { timeout: 120_000 });
  const clickToURLMs = performance.now() - navStart;
  await page.waitForTimeout(5000);
  result.browser.projects = { clickToURLMs, elapsedIncludingSettleMs: performance.now() - navStart,
    url: page.url(), title: await page.title(),
    heading: await page.locator('h1').allTextContents(),
    projectLinks: await page.locator('a[href^="/projects/"]').count() };
  await Promise.all(pending);
  result.browser.requests = requests;
  result.browser.errors = errors;
  result.browser.consoleErrors = consoleErrors;
  result.browser.summary = ['home', 'home-to-projects'].map((current) => {
    const wp = requests.filter((request) => request.phase === current && request.url.includes('/wp-json/'));
    const router = requests.filter((request) => request.phase === current && /\.data(?:\?|$)/.test(request.url));
    const sum = (items, key) => items.reduce((total, item) => total + (item[key] || 0), 0);
    const failed = wp.filter((request) => request.failure || request.bodyError || request.status === undefined).length;
    return { phase: current, wpRequestCount: wp.length, wpFailedOrUnreadableCount: failed,
      wpDecodedBodyBytes: failed ? null : sum(wp, 'decodedBodyBytes'),
      wpEncodedBodyBytes: failed ? null : sum(wp, 'encodedBodyBytes'),
      wpMeasuredDecodedBodyBytes: sum(wp, 'decodedBodyBytes'),
      wpResponseHeadersBytes: sum(wp, 'responseHeadersBytes'),
      routerRequestCount: router.length, routerDecodedBodyBytes: sum(router, 'decodedBodyBytes'),
      routerEncodedBodyBytes: sum(router, 'encodedBodyBytes') };
  });
} finally { await browser.close(); }

await writeFile(output, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ output, documents: result.documents.map(({ samples, ssrStateKeys, ...entry }) => entry),
  browser: result.browser }, null, 2));
