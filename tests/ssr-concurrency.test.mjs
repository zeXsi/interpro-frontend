import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
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
  });
  response.end(JSON.stringify(data));
}

function createMockApi() {
  const firstListBlocked = deferred();
  const releaseFirstList = deferred();
  let articleRequestCount = 0;
  let listRequestCount = 0;

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://mock-api');
    const slug = url.searchParams.get('slug');

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

test('parallel SSR requests isolate route state and hydrate without mismatch', { timeout: 120_000 }, async () => {
  const mockApi = createMockApi();
  const mockOrigin = await listen(mockApi.server);
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'interpro-ssr-test-'));
  let appServer;

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
  } finally {
    mockApi.releaseFirstList();
    await stopProcess(appServer);
    await closeServer(mockApi.server);
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
