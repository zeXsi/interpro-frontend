import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as stm from '../../shared/utils/_stm/index.ts';
import { runWithSSRRequestState } from '../../shared/utils/_stm/ssr.server.ts';

function loadModule(path, imports) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports,
    require(id) {
      assert.ok(id in imports, `Unexpected import: ${id}`);
      return imports[id];
    },
    console: { error() {}, warn() {} },
  });
  return exports;
}

function harness(get) {
  const requests = [];
  const query = loadModule('../../shared/utils/querySignal.ts', {
    'api/api.config': {
      instance: {
        get: async (endpoint, { params }) => {
          requests.push({ endpoint, params });
          return { data: await get(params) };
        },
      },
    },
    './_stm': stm,
    './toCdnMediaUrl': { toCdnMediaUrls: (data) => data },
  });
  const api = loadModule('./projects.api.ts', {
    'shared/utils/querySignal': query,
    'shared/utils/addNextItem': loadModule('../../shared/utils/addNextItem.ts', {}),
    'shared/utils/decodeUnicodeEscapes': loadModule('../../shared/utils/decodeUnicodeEscapes.ts', {}),
    'api/queryFamilies': { QUERY_FAMILIES: { projects: 'projects' } },
  });
  return { api, requests };
}

function project(id, slug) {
  return {
    id, slug, title: { rendered: slug },
    payload: { title: slug, seo: {}, blocks: { detail: `content-${slug}` } },
  };
}

test('direct detail in a cold scope gets list ordering and wraparound without serializing the list', async () => {
  const items = [project(3, 'third'), project(1, 'first'), project(2, 'second')];
  const { api, requests } = harness(() => items);
  await runWithSSRRequestState(async () => {
    const detail = await api.getProjectsById({ slug: 'third' });
    assert.equal(detail.nextItem.slug, 'first');
    assert.equal(detail.nextItem.id, 1);
    assert.equal(detail.nextItem.title, 'first');
    assert.deepEqual(Object.keys(detail.nextItem).sort(), ['id', 'slug', 'title']);
    assert.equal(stm.getSSRStore(), "window['__SSR_STATE__'] = {};");
    assert.equal(JSON.stringify(detail).includes('content-first'), false);
  });
  await runWithSSRRequestState(async () => {
    assert.equal(api.sgProjects.v.length, 0);
    const detail = await api.getProjectsById({ slug: 'second' });
    assert.equal(detail.nextItem.slug, 'third');
    assert.equal(stm.getSSRStore(), "window['__SSR_STATE__'] = {};");
  });
  assert.equal(requests.length, 1, 'fresh request scope reuses the server list cache');
  assert.equal(Object.keys(requests[0].params).length, 0);
});

test('detail in an existing list scope reuses the enriched parent result', async () => {
  const { api, requests } = harness(() => [project(2, 'second'), project(1, 'first')]);
  await runWithSSRRequestState(async () => {
    const list = await api.getProjects();
    const detail = await api.getProjectsById({ slug: 'first' });
    assert.equal(detail, list[1]);
    assert.equal(detail.nextItem.slug, 'second');
    assert.equal(requests.length, 1);
  });
});

test('single-project detail retains the list self-wraparound', async () => {
  const { api } = harness(() => [project(1, 'only')]);
  await runWithSSRRequestState(async () => {
    const detail = await api.getProjectsById({ slug: 'only' });
    assert.equal(detail.nextItem.slug, detail.slug);
    assert.equal(detail.nextItem.id, detail.id);
  });
});

test('real missing detail still performs the slug lookup and returns undefined', async () => {
  const { api, requests } = harness((params) => params.slug ? [] : [project(1, 'exists')]);
  await runWithSSRRequestState(async () => {
    assert.equal(await api.getProjectsById({ slug: 'missing' }), undefined);
    assert.equal(requests.length, 2);
    assert.equal(requests[1].params.slug, 'missing');
  });
});

test('detail absent from the public list can still be loaded by slug', async () => {
  const { api } = harness((params) => params.slug ? [project(2, 'private')] : [project(1, 'public')]);
  await runWithSSRRequestState(async () => {
    const detail = await api.getProjectsById({ slug: 'private' });
    assert.equal(detail.slug, 'private');
    assert.equal(detail.nextItem, undefined);
  });
});

test('list upstream failure propagates rather than becoming a missing detail', async () => {
  const error = new Error('list unavailable');
  const { api, requests } = harness(() => { throw error; });
  await runWithSSRRequestState(async () => {
    await assert.rejects(api.getProjectsById({ slug: 'exists' }), (actual) => actual === error);
    assert.equal(requests.length, 1);
  });
});

test('slug upstream failure propagates rather than becoming a missing detail', async () => {
  const error = new Error('detail unavailable');
  const { api } = harness((params) => {
    if (params.slug) throw error;
    return [];
  });
  await runWithSSRRequestState(async () => {
    await assert.rejects(api.getProjectsById({ slug: 'missing' }), (actual) => actual === error);
  });
});
