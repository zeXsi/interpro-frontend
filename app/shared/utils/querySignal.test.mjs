import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as stm from './_stm/index.ts';
import { runWithSSRRequestState } from './_stm/ssr.server.ts';

function queryHarness({ client = false } = {}) {
  let now = 0;
  let get = async () => { throw new Error('offline'); };
  const source = readFileSync(new URL('./querySignal.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(id) {
      if (id === 'api/api.config') return { instance: { get: (...args) => get(...args) } };
      if (id === './_stm') return stm;
      if (id === './toCdnMediaUrl') return { toCdnMediaUrls: (data) => data };
      throw new Error(`Unexpected import: ${id}`);
    },
    Date: class extends Date { static now() { return now; } },
    console: { error() {}, warn() {} },
    ...(client ? { window: {} } : {}),
  });
  return {
    ...exports,
    setGet: (fn) => { get = fn; },
    setNow: (value) => { now = value; },
  };
}

test('query failure rejects without cache and never returns initial success data', async () => {
  const h = queryHarness();
  const error = new Error('upstream unavailable');
  h.setGet(async () => { throw error; });
  const q = h.createQuery({ endpoint: '/missing', initial: [] });
  await assert.rejects(q.fetch(), (actual) => actual === error);
});

test('query data is not serialized and parent lookups remain request isolated', async () => {
  const h = queryHarness();
  let requests = 0;
  h.setGet(async () => { requests += 1; return { data: [{ slug: 'alpha' }] }; });
  const parent = h.createQuery({ endpoint: '/list', initial: [] });
  const child = h.createQuery({
    endpoint: '/item', initial: undefined, parent: parent.sg,
    findInParent: (items, params) => items.find((item) => item.slug === params.slug),
  });
  await runWithSSRRequestState(async () => {
    await parent.fetch();
    assert.equal((await child.fetch({ slug: 'alpha' })).slug, 'alpha');
    assert.equal(requests, 1);
    assert.equal(stm.getSSRStore(), "window['__SSR_STATE__'] = {};");
  });
  await runWithSSRRequestState(async () => {
    assert.deepEqual(parent.sg.v, []);
    await child.fetch({ slug: 'alpha' });
    assert.equal(requests, 2);
  });
});

test('same-key stale data is bounded by SWR and never substitutes for another slug', async () => {
  const h = queryHarness();
  h.setGet(async (_, { params }) => ({ data: { slug: params.slug } }));
  const q = h.createQuery({ endpoint: '/slugs', initial: undefined, ttlMs: 100, swrMs: 200 });
  assert.equal((await q.fetch({ slug: 'public' })).slug, 'public');
  const error = new Error('offline');
  h.setGet(async () => { throw error; });
  h.setNow(150);
  assert.equal((await q.fetch({ slug: 'public' })).slug, 'public');
  await assert.rejects(q.fetch({ slug: 'private' }), (actual) => actual === error);
  h.setNow(301);
  await assert.rejects(q.fetch({ slug: 'public' }), (actual) => actual === error);
});

test('client failures reject rather than returning signal data from a previous key', async () => {
  const h = queryHarness({ client: true });
  const q = h.createQuery({ endpoint: '/client', initial: [] });
  h.setGet(async () => ({ data: ['previous-key'] }));
  await q.fetch({ slug: 'first' });
  const error = new Error('offline');
  h.setGet(async () => { throw error; });
  await assert.rejects(q.fetch({ slug: 'second' }), (actual) => actual === error);
});

test('deduplicated failed queries both propagate the upstream error', async () => {
  const h = queryHarness();
  let reject;
  let requests = 0;
  h.setGet(() => { requests += 1; return new Promise((_, fail) => { reject = fail; }); });
  const q = h.createQuery({ endpoint: '/dedup', initial: [] });
  const first = q.fetch();
  const second = q.fetch();
  const error = new Error('offline');
  reject(error);
  const results = await Promise.allSettled([first, second]);
  assert.equal(requests, 1);
  assert.ok(results.every((result) => result.status === 'rejected' && result.reason === error));
});
