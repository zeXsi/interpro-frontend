import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { chromium } from 'playwright';

const projectRoot = path.resolve(import.meta.dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const dental = { id: 75, slug: 'dental-expo', name: 'Дентал Экспо' };
const otherExpo = { id: 76, slug: 'fixture-expo', name: 'Fixture Expo' };
const corner = { id: 81, slug: 'corner', name: 'Угловой' };
const island = { id: 82, slug: 'island', name: 'Островной' };
const year2025 = { id: 91, slug: '2025', name: '2025' };
const year2026 = { id: 92, slug: '2026', name: '2026' };
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#407080"/></svg>';

function project(id, exhibition, type, year) {
  const slug = `fixture-project-${id}`;
  const title = `Fixture project ${id}`;
  const date = '2026-01-01T00:00:00';
  return {
    id, slug, date, date_gmt: date, modified: date, modified_gmt: date,
    status: 'publish', type: 'projects', link: `/projects/${slug}`,
    title: { rendered: title }, guid: { rendered: `/projects/${slug}` },
    featured_media: 0, template: '', class_list: [],
    'exhibition-stand': [exhibition.id], 'type-stand': [type.id], 'year-stand': [year.id],
    payload: {
      title, about: `${title} description`,
      cover: `https://api.interpro.pro/wp-content/uploads/${slug}.webp`,
      video: '', show_on_home: true, is_private: false,
      seo: { title, description: `${title} description` },
      meta: { exhibition: [exhibition], type_tax: [type], year, area: 42 },
      blocks: {
        intro: { title, photos: [] }, drawings: [],
        viz3d: { image: '', size: '', area: 42 }, details: [],
      },
    },
    _links: { self: [], collection: [], about: [], 'wp:attachment': [], 'wp:term': [] },
  };
}

const projects = [
  project(1, dental, corner, year2025),
  project(2, dental, island, year2026),
  project(3, otherExpo, island, year2025),
  project(4, otherExpo, island, year2026),
  project(5, otherExpo, island, year2026),
];

function createMockApi() {
  const requests = [];
  const home = {
    schema_version: 1,
    projects: {
      total: projects.length,
      items: [{
        id: 1, slug: projects[0].slug, title: projects[0].payload.title,
        exhibition: dental.name, year: 2025, area: 42,
        cover: { id: 101, url: projects[0].payload.cover, width: 1200, height: 800, srcset: '', sizes: '' },
      }],
    },
    services_navigation: [{
      id: 201, slug: 'fixture-services', name: 'Fixture services', children: [],
      posts: [{ id: 202, slug: 'fixture-service', title: 'Fixture service' }],
    }],
    feedbacks: [{
      title: 'Fixture person', company: 'Fixture company',
      person: { name: 'Fixture person', position: 'Director' },
      text: 'Fixture feedback', pdf: null, date: '2026-01-01T00:00:00+00:00',
    }],
    faqs: [{ id: 301, question: 'Fixture question?', answer: 'Fixture answer.' }],
  };
  // Deliberately sparse PHP-style objects, with id75 absent from the facets.
  const facets = {
    exhibition_stand: { 7: { ...otherExpo, count: 3 } },
    type_stand: { 2: { ...corner, count: 1 }, 8: { ...island, count: 4 } },
    year_stand: { 3: { ...year2025, count: 2 }, 9: { ...year2026, count: 3 } },
  };
  const emptyEndpoints = new Set([
    '/wp-json/wp/v2/service_category', '/wp-json/wp/v2/service',
    '/wp-json/wp/v2/news', '/wp-json/wp/v2/blog', '/wp-json/wp/v2/licenses',
    '/wp-json/wp/v2/feedbacks', '/wp-json/wp/v2/faqs',
  ]);
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://mock-api');
    requests.push(url.pathname);
    let data;
    if (url.pathname === '/wp-json/interpro/v1/home') data = home;
    else if (url.pathname === '/wp-json/wp/v2/projects') data = projects;
    else if (url.pathname === '/wp-json/wp/v2/project-facets') data = facets;
    else if (emptyEndpoints.has(url.pathname)) data = [];
    else {
      response.writeHead(404, { 'access-control-allow-origin': '*' });
      response.end(`Unexpected mock endpoint: ${url.pathname}`);
      return;
    }
    response.writeHead(200, {
      'content-type': 'application/json', 'access-control-allow-origin': '*',
      'x-wp-totalpages': '1',
    });
    response.end(JSON.stringify(data));
  });
  return { server, requests };
}

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}

async function closeServer(server) {
  if (!server.listening) return;
  const closed = once(server, 'close');
  server.close();
  server.closeAllConnections();
  await closed;
}

async function stopProcess(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, 'exit');
  if (process.platform === 'win32') {
    const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    await once(killer, 'exit');
  } else {
    child.kill('SIGTERM');
  }
  let timer;
  try {
    await Promise.race([exited, new Promise((resolve) => { timer = setTimeout(resolve, 5_000); })]);
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  } finally {
    clearTimeout(timer);
  }
}

function captureOutput(child) {
  let output = '';
  const append = (chunk) => { output = (output + chunk).slice(-50_000); };
  child.stdout.on('data', append);
  child.stderr.on('data', append);
  return () => output;
}

async function build(mockOrigin) {
  const child = spawn(npmCommand, ['run', 'build'], {
    cwd: projectRoot, shell: process.platform === 'win32',
    env: {
      ...process.env, VITE_BASE_URL: `${mockOrigin}/wp-json/wp/v2`,
      VITE_CDN_ORIGIN: 'https://cdn.interpro.pro',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const output = captureOutput(child);
  let timer;
  try {
    const [code] = await Promise.race([
      once(child, 'exit'),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Build timed out after 180s\n${output()}`)), 180_000);
      }),
    ]);
    assert.equal(code, 0, `Production build failed\n${output()}`);
  } finally {
    clearTimeout(timer);
    await stopProcess(child);
  }
}

async function waitForServer(origin, child, output) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    assert.equal(child.exitCode, null, `Production server exited\n${output()}`);
    try {
      const response = await fetch(origin, { signal: AbortSignal.timeout(1_000) });
      await response.body?.cancel();
      assert.equal(response.status, 200, `Home failed\n${output()}`);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`Production server did not become ready\n${output()}`);
}

function filterGroup(page, name) {
  return page.locator('.FilterItem').filter({
    has: page.locator('.FilterItem-title', { hasText: name }),
  });
}

async function openFilters(page) {
  for (const name of ['Выставка', 'Тип стенда', 'Год']) {
    const group = filterGroup(page, name);
    if (!(await group.getAttribute('class')).split(' ').includes('active')) {
      await group.locator('.FilterItem-title').click();
    }
  }
}

async function assertOptions(page) {
  await openFilters(page);
  assert.deepStrictEqual(
    (await filterGroup(page, 'Выставка').locator('.FilterItem-item').allTextContents()).sort(),
    [otherExpo.name, dental.name].sort(),
    'facets include real sparse-object options and the missing project-meta exhibition exactly once'
  );
  assert.deepStrictEqual(
    (await filterGroup(page, 'Тип стенда').locator('.FilterItem-item').allTextContents()).sort(),
    [corner.name, island.name].sort()
  );
  assert.deepStrictEqual(
    await filterGroup(page, 'Год').locator('.FilterItem-item').allTextContents(),
    ['2026', '2025']
  );
}

async function toggle(page, group, name) {
  // Preserve the current scroll/active image: Playwright's auto-scroll before a
  // physical click would hide the stale-active-index regression being tested.
  await filterGroup(page, group).getByText(name, { exact: true }).dispatchEvent('click');
}

async function assertProjects(page, ids) {
  await page.waitForFunction((expected) => {
    const titles = [...document.querySelectorAll('.ProjectPage_container-left .ProjectCard-title')]
      .map((node) => node.textContent.trim());
    return JSON.stringify(titles) === JSON.stringify(expected);
  }, ids.map((id) => `Fixture project ${id}`));
  assert.match(await page.locator('.ProjectPage-title span').textContent(), new RegExp(`\\(\\s*${ids.length}\\s*\\)`));
}

async function assertImage(page, id, mobile) {
  const selector = mobile
    ? `.ProjectPage_container-left a[href="/projects/fixture-project-${id}"] .ProjectCard-img img`
    : '.ProjectPage_container-right .ProjectCardImg img';
  const image = page.locator(selector);
  await image.waitFor({ state: 'visible' });
  assert.equal(await image.count(), 1, 'the selected project has a rendered image');
  await page.waitForFunction(({ selector, id }) => {
    const image = document.querySelector(selector);
    return image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0
      && image.currentSrc.includes(`fixture-project-${id}.webp`);
  }, { selector, id });
}

async function scrollToProject(page, index, multiplier = 0.5) {
  await page.evaluate(({ index, multiplier }) => {
    const card = document.querySelectorAll('.ProjectPage_container-left > div')[index];
    window.scrollTo({ top: card.offsetTop - card.offsetHeight * multiplier, behavior: 'instant' });
  }, { index, multiplier });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function withPage(browser, origin, mockOrigin, mobile, callback) {
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    isMobile: mobile, hasTouch: mobile, serviceWorkers: 'block',
  });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(10_000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' && /hydration|hydrated|did not match|server rendered html|Minified React error #(418|423|425)/i.test(message.text())) {
        errors.push(message.text());
      }
    });
    await page.addLocatorHandler(page.locator('.MWForm.isVisible'), async (popup) => {
      await popup.locator('.MWImage-close').click();
    });
    await page.route('**/*', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.resourceType() === 'image' && /\/wp-content\/uploads\//.test(url.pathname)) {
        await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg });
      } else if (url.origin === origin || url.origin === mockOrigin) {
        await route.continue();
      } else {
        await route.abort();
      }
    });
    await callback(page);
    assert.deepStrictEqual(errors, [], 'no runtime or hydration errors');
  } finally {
    await context.close();
  }
}

test('/projects production navigation, facets and filtered images', { timeout: 360_000 }, async (t) => {
  const mock = createMockApi();
  let directory;
  let appServer;
  let browser;
  try {
    const mockOrigin = await listen(mock.server);
    directory = await mkdtemp(path.join(tmpdir(), 'interpro-projects-test-'));
    await build(mockOrigin);
    const portServer = createServer();
    const origin = await listen(portServer);
    await closeServer(portServer);
    appServer = spawn(process.execPath, ['node_modules/@react-router/serve/bin.js', './build/server/index.js'], {
      cwd: projectRoot,
      env: {
        ...process.env, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: new URL(origin).port,
        SSR_QUERY_TTL_MS: '0', SSR_QUERY_POLL_INTERVAL_MS: '0',
        SITEMAP_PATH: path.join(directory, 'sitemap.xml'),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    await waitForServer(origin, appServer, captureOutput(appServer));
    browser = await chromium.launch({ headless: true });

    for (const mobile of [false, true]) {
      const device = mobile ? 'mobile' : 'desktop';
      await t.test(`${device}: first SPA navigation loads facets and preserves loaded filtered images`, async () => {
        await withPage(browser, origin, mockOrigin, mobile, async (page) => {
          await page.goto(origin, { waitUntil: 'load' });
          await page.waitForFunction(() => window.__SSR_STATE__ && !Object.hasOwn(window.__SSR_STATE__, 'home-data'));
          await page.evaluate(() => { window.__projectsDocumentMarker = 'home-document'; });
          if (mobile) {
            await page.locator('.Header .__menu-self').dispatchEvent('click');
            await page.locator('.MWNav_table a[href="/projects"] .__projects').click();
          } else {
            await page.locator('.Header a[href="/projects"] .__projects').click();
          }
          await page.waitForURL(`${origin}/projects`);
          assert.equal(await page.evaluate(() => window.__projectsDocumentMarker), 'home-document', 'navigation stays in the original document');
          await assertProjects(page, [1, 2, 3, 4, 5]);
          await assertOptions(page);
          await page.waitForSelector(`.ProjectPage_container.__${mobile ? 'mobile' : 'desktop'}_grid`);
          await scrollToProject(page, 4);
          await assertImage(page, 5, mobile);

          await toggle(page, 'Выставка', dental.name);
          await assertProjects(page, [1, 2]);
          await assertImage(page, 1, mobile);
          if (mobile) {
            await scrollToProject(page, 1);
          } else {
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
            await page.evaluate(() => new Promise(requestAnimationFrame));
            // Between the ordinary 0.9 and final-card 1.2 thresholds: this
            // specifically requires the last *filtered* card special case.
            await scrollToProject(page, 1, 1.1);
          }
          await assertImage(page, 2, mobile);

          await toggle(page, 'Тип стенда', corner.name);
          await assertProjects(page, [1]);
          await assertImage(page, 1, mobile);
          await toggle(page, 'Год', '2026');
          await assertProjects(page, []);
          assert.equal(await page.locator('.ProjectPage_container .ProjectCardImg img, .ProjectPage_container .ProjectCard-img img').count(), 0);
          await toggle(page, 'Год', '2026');
          await assertProjects(page, [1]);
          await assertImage(page, 1, mobile);
        });
      });

      await t.test(`${device}: direct /projects hydrates with sparse and supplemented facets`, async () => {
        await withPage(browser, origin, mockOrigin, mobile, async (page) => {
          const response = await page.goto(`${origin}/projects`, { waitUntil: 'load' });
          assert.equal(response.status(), 200);
          await assertProjects(page, [1, 2, 3, 4, 5]);
          // Use an actual state-changing click to prove the SSR markup hydrated.
          await assertOptions(page);
          await toggle(page, 'Выставка', dental.name);
          await assertProjects(page, [1, 2]);
          await assertImage(page, 1, mobile);
        });
      });
    }
    assert.ok(mock.requests.includes('/wp-json/interpro/v1/home'));
    assert.ok(mock.requests.includes('/wp-json/wp/v2/project-facets'));
    assert.ok(mock.requests.includes('/wp-json/wp/v2/projects'));
  } finally {
    try {
      await browser?.close();
    } finally {
      try {
        await stopProcess(appServer);
      } finally {
        await closeServer(mock.server);
        if (directory) await rm(directory, { recursive: true, force: true });
      }
    }
  }
});
