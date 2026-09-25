import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { brotliCompressSync, constants as zlibConstants } from 'node:zlib';
import test from 'node:test';

import { chromium } from 'playwright';

const projectRoot = path.resolve(import.meta.dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const processOutput = new Map();

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  return `http://127.0.0.1:${address.port}`;
}

async function closeServer(server) {
  server.close();
  await once(server, 'close');
}

function article(slug, title, id) {
  const date = '2026-01-01T00:00:00';
  return {
    id,
    slug,
    date,
    date_gmt: date,
    modified: date,
    modified_gmt: date,
    status: 'publish',
    type: 'blog',
    link: `/blog/${slug}`,
    title: { rendered: title },
    guid: { rendered: `/blog/${slug}` },
    featured_media: 0,
    template: '',
    news_category: [],
    class_list: [],
    payload: {
      id,
      slug,
      date,
      title,
      subtitle: `${title} subtitle`,
      subtitle_photos: [],
      cover: {
        id: 0,
        url: `https://api.interpro.pro/wp-content/uploads/${slug}.webp`,
        width: 0,
        height: 0,
        alt: '',
        caption: '',
        mime: '',
      },
      blocks: [],
      categories: [],
      related_services: [],
      related_projects: [],
      seo: {
        title,
        description: `${title} description`,
      },
    },
    _links: {
      self: [],
      collection: [],
      about: [],
      'wp:attachment': [],
      'wp:term': [],
    },
  };
}

function sendJson(response, data) {
  response.writeHead(200, {
    'content-type': 'application/json',
    'x-wp-totalpages': '1',
    'access-control-allow-origin': '*',
  });
  response.end(JSON.stringify(data));
}

function createMockApi() {
  const firstListBlocked = deferred();
  const releaseFirstList = deferred();
  let articleRequestCount = 0;
  let listRequestCount = 0;
  const requestPaths = [];

  const homeData = {
    schema_version: 1,
    projects: {
      total: 12,
      items: [
        {
          id: 501,
          slug: 'compact-project',
          title: 'COMPACT PROJECT',
          exhibition: 'Compact Expo',
          year: 2026,
          area: 42,
          cover: {
            id: 601,
            url: 'https://api.interpro.pro/wp-content/uploads/compact-project.webp',
            width: 1200,
            height: 800,
            srcset: '',
            sizes: '',
          },
        },
      ],
    },
    services_navigation: [
      {
        id: 701,
        slug: 'compact-services',
        name: 'Compact services',
        children: [],
        posts: [{ id: 702, slug: 'compact-service', title: 'Compact service' }],
      },
    ],
    feedbacks: [
      {
        title: 'Compact person',
        company: 'Compact company',
        person: { name: 'Compact person', position: 'Director' },
        text: 'Compact feedback',
        pdf: null,
        date: '2026-01-01T00:00:00+00:00',
      },
    ],
    faqs: [{ id: 801, question: 'Compact question?', answer: 'Compact answer.' }],
  };
  const presentationData = {
    id: 1001,
    title: 'Compact presentation',
    theme: 'light',
    project_size: 42,
    tax: { year: ['2026'], stand_type: [], expo: [] },
    slides: [
      {
        id: 1002,
        type: 'text',
        slide_title: 'Overview',
        fields: { text_heading: 'Overview', text_body: 'Presentation body' },
      },
    ],
  };

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://mock-api');
    requestPaths.push(`${url.pathname}${url.search}`);
    const slug = url.searchParams.get('slug');

    if (url.pathname.endsWith('/interpro/v1/home')) {
      sendJson(response, homeData);
      return;
    }

    if (url.pathname.endsWith('/presentations/demo/')) {
      sendJson(response, presentationData);
      return;
    }

    if (url.pathname.endsWith('/projects')) {
      sendJson(response, [
        {
          id: 901,
          slug: 'full-project',
          title: { rendered: 'Full project' },
          payload: { title: 'Full project', seo: { title: 'Full project' } },
        },
      ]);
      return;
    }

    if (url.pathname.endsWith('/faqs')) {
      sendJson(response, [
        {
          id: 902,
          slug: 'full-question',
          payload: { question: 'Full question?', answer: 'Full answer.' },
        },
      ]);
      return;
    }

    if (url.pathname.endsWith('/service_category')) {
      sendJson(response, [
        {
          id: 903,
          slug: 'full-services',
          name: 'Full services',
          payload: {
            name: 'Full services',
            description: 'Full services description',
            children: [],
            posts: [{ id: 904, slug: 'full-service', title: 'Full service' }],
          },
        },
      ]);
      return;
    }

    if (url.pathname.endsWith('/blog') && slug) {
      articleRequestCount += 1;
      const title = slug === 'alpha' ? 'ALPHA' : 'BETA';
      sendJson(response, [article(slug, title, articleRequestCount)]);
      return;
    }

    const isArticleList =
      url.pathname.endsWith('/blog') &&
      url.searchParams.get('page') === '1' &&
      url.searchParams.get('per_page') === '10' &&
      !slug;

    if (isArticleList) {
      listRequestCount += 1;
      if (listRequestCount === 1) {
        firstListBlocked.resolve();
        await releaseFirstList.promise;
      }
      sendJson(response, []);
      return;
    }

    sendJson(response, []);
  });

  return {
    server,
    firstListBlocked: firstListBlocked.promise,
    releaseFirstList: releaseFirstList.resolve,
    requestPaths,
    homeEndpointDecodedBytes: Buffer.byteLength(JSON.stringify(homeData), 'utf8'),
    clearRequestPaths: () => requestPaths.splice(0),
  };
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: { ...process.env, ...options.env },
      shell: process.platform === 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    processOutput.set(child, output);

    const append = (chunk) => {
      output += chunk;
      processOutput.set(child, output);
    };
    child.stdout.on('data', append);
    child.stderr.on('data', append);
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with ${code ?? signal}\n${output}`));
    });
  });
}

async function waitForServer(origin, child) {
  const timeoutAt = Date.now() + 15_000;
  while (Date.now() < timeoutAt) {
    if (child.exitCode !== null) {
      throw new Error(`SSR server exited early\n${processOutput.get(child) ?? ''}`);
    }
    try {
      const response = await fetch(origin, { signal: AbortSignal.timeout(500) });
      await response.body?.cancel();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  throw new Error(`SSR server did not start\n${processOutput.get(child) ?? ''}`);
}

async function stopProcess(child) {
  if (!child || child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    once(child, 'exit'),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (child.exitCode === null) child.kill('SIGKILL');
}

function readSSRState(html) {
  const match = html.match(/window\['__SSR_STATE__'\]\s*=\s*(\{.*?\});<\/script>/s);
  assert.ok(match, 'inline __SSR_STATE__ script is present');
  return JSON.parse(match[1]);
}

async function getHtml(origin, slug) {
  const response = await fetch(`${origin}/blog/${slug}`, {
    headers: { 'user-agent': 'Googlebot' },
  });
  assert.equal(response.status, 200);
  return response.text();
}

async function assertHydrates(origin, slug, title) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ serviceWorkers: 'block' });
    const hydrationErrors = [];
    const hydrationPattern =
      /hydration|hydrated|server rendered html|did not match|Minified React error #(418|423|425)/i;

    page.on('console', (message) => {
      if (message.type() === 'error' && hydrationPattern.test(message.text())) {
        hydrationErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      if (hydrationPattern.test(error.message)) hydrationErrors.push(error.message);
    });

    await page.route('**/*', async (route) => {
      if (new URL(route.request().url()).origin === origin) {
        await route.continue();
      } else {
        await route.abort();
      }
    });
    await page.goto(`${origin}/blog/${slug}`, { waitUntil: 'load' });
    await assert.doesNotReject(() =>
      page.waitForFunction(
        () =>
          window.__SSR_STATE__ &&
          !Object.prototype.hasOwnProperty.call(window.__SSR_STATE__, 'parent-/blog')
      )
    );
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );

    assert.equal(await page.locator('h1.Feed_header-title').textContent(), title);
    assert.deepStrictEqual(hydrationErrors, []);
  } finally {
    await browser.close();
  }
}

async function assertHomeHydratesAndNavigates(origin) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ serviceWorkers: 'block' });
    const hydrationErrors = [];
    const hydrationPattern =
      /hydration|hydrated|server rendered html|did not match|Minified React error #(418|423|425)/i;

    page.on('console', (message) => {
      if (message.type() === 'error' && hydrationPattern.test(message.text())) {
        hydrationErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      if (hydrationPattern.test(error.message)) hydrationErrors.push(error.message);
    });
    await page.route('**/*', async (route) => {
      const requestOrigin = new URL(route.request().url()).origin;
      if (requestOrigin === origin || requestOrigin.startsWith('http://127.0.0.1:')) {
        await route.continue();
      } else {
        await route.abort();
      }
    });

    await page.goto(origin, { waitUntil: 'load' });
    await page.locator('.Header .qntyProjects').waitFor();
    assert.equal(await page.locator('.Header .qntyProjects').textContent(), '12');
    assert.equal(await page.locator('.Project-title').first().textContent(), 'COMPACT PROJECT');
    await page.locator('.Header .__menu-self').hover();
    const desktopMenu = page.locator('.MWNav_desktop');
    await desktopMenu.getByText('Услуги', { exact: true }).hover();
    await desktopMenu.getByText('Compact service', { exact: true }).waitFor();
    await page.locator('.Header .__menu-self').click();

    await page.locator('a[href="/faq"]').first().evaluate((link) => link.click());
    await page.waitForURL(`${origin}/faq`);
    await page.waitForFunction(
      () => document.querySelectorAll('.FAQSection_right-items .Accordion').length > 0
    );
    assert.notEqual(await page.locator('.Header .qntyProjects').textContent(), '0');
    assert.match(await page.locator('.FAQSection').textContent(), /Full question\?/);
    await page.locator('.Header_list-li.__logo svg').click();
    await page.waitForURL(`${origin}/`);
    await page.waitForFunction(
      () => document.querySelector('.Header .qntyProjects')?.textContent === '12'
    );
    assert.equal(await page.locator('.Header .qntyProjects').textContent(), '12');
    assert.deepStrictEqual(hydrationErrors, []);
  } finally {
    await browser.close();
  }
}

test('parallel SSR requests isolate route state and hydrate without mismatch', { timeout: 120_000 }, async () => {
  const mockApi = createMockApi();
  const mockOrigin = await listen(mockApi.server);
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'interpro-ssr-test-'));
  let appServer;
  let warmAppServer;

  try {
    await run(npmCommand, ['run', 'build'], {
      env: {
        VITE_BASE_URL: `${mockOrigin}/wp-json/wp/v2`,
        VITE_CDN_ORIGIN: 'https://cdn.interpro.pro',
      },
    });

    const portServer = createServer();
    const appOrigin = await listen(portServer);
    const appPort = new URL(appOrigin).port;
    await closeServer(portServer);

    appServer = spawn(
      process.execPath,
      ['node_modules/@react-router/serve/bin.js', './build/server/index.js'],
      {
        cwd: projectRoot,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          HOST: '127.0.0.1',
          PORT: appPort,
          SSR_QUERY_TTL_MS: '0',
          SSR_QUERY_POLL_INTERVAL_MS: '0',
          SITEMAP_PATH: path.join(tempDirectory, 'sitemap.xml'),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    let serverOutput = '';
    processOutput.set(appServer, serverOutput);
    const append = (chunk) => {
      serverOutput += chunk;
      processOutput.set(appServer, serverOutput);
    };
    appServer.stdout.on('data', append);
    appServer.stderr.on('data', append);
    await waitForServer(appOrigin, appServer);

    mockApi.clearRequestPaths();
    const homeResponse = await fetch(appOrigin, { headers: { 'user-agent': 'Googlebot' } });
    assert.equal(homeResponse.status, 200);
    const homeHtml = await homeResponse.text();
    const homeState = readSSRState(homeHtml);
    assert.deepStrictEqual(Object.keys(homeState), ['home-data']);
    assert.equal(homeState['home-data'].projects.total, 12);
    assert.equal(homeState['home-data'].projects.items.length, 1);
    assert.equal(
      homeState['home-data'].projects.items[0].cover.url,
      'https://cdn.interpro.pro/wp-content/uploads/compact-project.webp'
    );
    assert.equal((homeHtml.match(/"schema_version":1/g) ?? []).length, 1);
    assert.match(homeHtml, /qntyProjects[^>]*>12</);
    assert.match(homeHtml, /Compact question\?/);
    assert.match(homeHtml, /Compact company/);
    const bodyIndex = homeHtml.indexOf('<body>');
    const homeContentIndex = homeHtml.indexOf('Compact question?');
    const stateScriptIndex = homeHtml.indexOf("window['__SSR_STATE__']");
    const reactRouterScriptsIndex = homeHtml.indexOf('window.__reactRouterContext');
    assert.ok(bodyIndex >= 0, 'body is present');
    assert.ok(stateScriptIndex > homeContentIndex, '__SSR_STATE__ follows the rendered route content');
    assert.ok(stateScriptIndex > bodyIndex, '__SSR_STATE__ is emitted after body starts');
    assert.ok(
      reactRouterScriptsIndex > stateScriptIndex,
      '__SSR_STATE__ is emitted before the React Router client scripts'
    );
    const decodedHtmlBytes = Buffer.byteLength(homeHtml, 'utf8');
    const bytesBeforeBody = Buffer.byteLength(homeHtml.slice(0, bodyIndex), 'utf8');
    const stateMatch = homeHtml.match(/window\['__SSR_STATE__'\]\s*=\s*(\{.*?\});<\/script>/s);
    assert.ok(stateMatch, '__SSR_STATE__ payload is present');
    const ssrStateBytes = Buffer.byteLength(stateMatch[1], 'utf8');
    const brotliHtmlBytes = brotliCompressSync(Buffer.from(homeHtml), {
      params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 4 },
    }).byteLength;
    assert.ok(decodedHtmlBytes < 1_000_000, 'decoded HTML remains below 1 MB');
    assert.ok(brotliHtmlBytes < 200_000, 'Brotli HTML remains below 200 KB');
    assert.ok(bytesBeforeBody < 100_000, 'content before body remains below 100 KB');
    assert.ok(ssrStateBytes < 150_000, '__SSR_STATE__ remains below 150 KB');
    assert.ok(
      mockApi.homeEndpointDecodedBytes < 100_000,
      'decoded home endpoint remains below 100 KB'
    );
    console.info(
      `SSR_METRICS ${JSON.stringify({
        decodedHtmlBytes,
        brotliHtmlBytes,
        bytesBeforeBody,
        ssrStateBytes,
        homeEndpointDecodedBytes: mockApi.homeEndpointDecodedBytes,
        coldHomeWordPressRequests: mockApi.requestPaths.length,
      })}`
    );
    assert.deepStrictEqual(mockApi.requestPaths, ['/wp-json/interpro/v1/home']);
    assert.doesNotMatch(
      mockApi.requestPaths.join('\n'),
      /\/wp-json\/wp\/v2\/(projects|service(?:_category)?|news|blog|licenses)/
    );

    await assertHomeHydratesAndNavigates(appOrigin);

    mockApi.clearRequestPaths();
    const presentationResponse = await fetch(`${appOrigin}/presentation/demo`, {
      headers: { 'user-agent': 'Googlebot' },
    });
    assert.equal(presentationResponse.status, 200);
    const presentationHtml = await presentationResponse.text();
    const presentationState = readSSRState(presentationHtml);
    assert.equal(Object.hasOwn(presentationState, 'home-data'), false);
    assert.doesNotMatch(presentationHtml, /home-data/);
    assert.match(presentationHtml, /Compact presentation/);
    assert.deepStrictEqual(mockApi.requestPaths, ['/wp-json/interpro/v1/presentations/demo/']);

    const presentationPrintResponse = await fetch(`${appOrigin}/presentation/demo/print`, {
      headers: { 'user-agent': 'Googlebot' },
    });
    assert.equal(presentationPrintResponse.status, 200);
    const presentationPrintHtml = await presentationPrintResponse.text();
    assert.doesNotMatch(presentationPrintHtml, /__SSR_STATE__/);
    assert.doesNotMatch(presentationPrintHtml, /window\.__reactRouterContext/);

    const presentationExportResponse = await fetch(
      `${appOrigin}/presentation/demo?export=pdf`,
      { headers: { 'user-agent': 'Googlebot' } }
    );
    assert.equal(presentationExportResponse.status, 200);
    const presentationExportHtml = await presentationExportResponse.text();
    assert.doesNotMatch(presentationExportHtml, /__SSR_STATE__/);
    assert.doesNotMatch(presentationExportHtml, /window\.__reactRouterContext/);

    const alphaHtmlPromise = getHtml(appOrigin, 'alpha');
    await mockApi.firstListBlocked;
    const betaHtml = await getHtml(appOrigin, 'beta');
    mockApi.releaseFirstList();
    const alphaHtml = await alphaHtmlPromise;

    const alphaState = readSSRState(alphaHtml);
    const betaState = readSSRState(betaHtml);

    assert.match(alphaHtml, /<h1[^>]*>ALPHA<\/h1>/);
    assert.match(betaHtml, /<h1[^>]*>BETA<\/h1>/);
    assert.equal(alphaState['parent-/blog'].slug, 'alpha');
    assert.equal(alphaState['parent-/blog'].payload.title, 'ALPHA');
    assert.equal(betaState['parent-/blog'].slug, 'beta');
    assert.equal(betaState['parent-/blog'].payload.title, 'BETA');
    assert.equal(
      alphaState['parent-/blog'].payload.cover.url,
      'https://cdn.interpro.pro/wp-content/uploads/alpha.webp'
    );
    assert.match(alphaHtml, /https:\/\/cdn\.interpro\.pro\/wp-content\/uploads\/alpha\.webp/);
    assert.doesNotMatch(JSON.stringify(alphaState), /BETA|"beta"/);
    assert.doesNotMatch(JSON.stringify(betaState), /ALPHA|"alpha"/);

    await assertHydrates(appOrigin, 'alpha', 'ALPHA');
    await assertHydrates(appOrigin, 'beta', 'BETA');

    const warmPortServer = createServer();
    const warmAppOrigin = await listen(warmPortServer);
    const warmAppPort = new URL(warmAppOrigin).port;
    await closeServer(warmPortServer);
    mockApi.clearRequestPaths();
    warmAppServer = spawn(
      process.execPath,
      ['node_modules/@react-router/serve/bin.js', './build/server/index.js'],
      {
        cwd: projectRoot,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          HOST: '127.0.0.1',
          PORT: warmAppPort,
          SSR_QUERY_TTL_MS: '1800000',
          SSR_QUERY_POLL_INTERVAL_MS: '0',
          SITEMAP_PATH: path.join(tempDirectory, 'warm-sitemap.xml'),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    let warmServerOutput = '';
    processOutput.set(warmAppServer, warmServerOutput);
    const appendWarmOutput = (chunk) => {
      warmServerOutput += chunk;
      processOutput.set(warmAppServer, warmServerOutput);
    };
    warmAppServer.stdout.on('data', appendWarmOutput);
    warmAppServer.stderr.on('data', appendWarmOutput);
    await waitForServer(warmAppOrigin, warmAppServer);

    mockApi.clearRequestPaths();
    const warmHomeResponse = await fetch(warmAppOrigin, {
      headers: { 'user-agent': 'Googlebot' },
    });
    assert.equal(warmHomeResponse.status, 200);
    await warmHomeResponse.body?.cancel();
    assert.deepStrictEqual(mockApi.requestPaths, []);
    console.info('SSR_METRICS {"warmHomeWordPressRequests":0}');
  } finally {
    mockApi.releaseFirstList();
    await stopProcess(appServer);
    await stopProcess(warmAppServer);
    await closeServer(mockApi.server);
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
