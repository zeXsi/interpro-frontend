import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadModule(relativePath, imports) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
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
  });
  return exports;
}

test('shell projection excludes home page collections and cards exclude detail payloads', async () => {
  const home = {
    projects: { total: 42, items: [{ slug: 'home-only' }] },
    services_navigation: [{ id: 1, slug: 'services', children: [], posts: [] }],
    feedbacks: [{ text: 'not shell content' }],
    faqs: [{ answer: 'not shell content' }],
  };
  const project = {
    id: 1, slug: 'public', link: '/projects/public', title: { rendered: 'Public' },
    'type-stand': [1], 'year-stand': [2], 'exhibition-stand': [3],
    nextItem: { slug: 'unneeded' }, _links: { self: [] },
    payload: {
      title: 'Public card', about: 'Visible summary', cover: '/cover.webp',
      meta: { area: 42, exhibition: [], year: null, type_tax: [] },
      blocks: { intro: { photos: ['huge photo collection'] } },
      seo: { description: 'detail-only' }, is_private: false,
    },
  };
  const api = loadModule('./pageData.server.ts', {
    './home/home.api': { getHomeData: async () => home },
    './projects/projects.api': { getProjects: async () => [project] },
  });
  const shell = await api.getShellData();
  assert.deepEqual(Object.keys(shell).sort(), ['projectCount', 'servicesNavigation']);
  assert.equal(shell.projectCount, 42);
  assert.equal(shell.servicesNavigation, home.services_navigation);
  const [card] = await api.getProjectCards();
  assert.equal(card.payload.about, project.payload.about);
  assert.equal(card.payload.meta, project.payload.meta);
  assert.equal(card['type-stand'], project['type-stand']);
  assert.equal(card.title, project.title);
  assert.equal('blocks' in card.payload, false);
  assert.equal('seo' in card.payload, false);
  assert.equal('nextItem' in card, false);
  assert.equal('_links' in card, false);
});

test('home query rejects unsupported versions and malformed envelopes before caching', () => {
  let options;
  loadModule('./home/home.api.ts', {
    'api/api.config': { interproApiBaseURL: '/interpro/v1' },
    'api/queryFamilies': { QUERY_FAMILIES: { home: 'home' } },
    'shared/utils/querySignal': { createQuery: (value) => { options = value; return {}; } },
    './home.types': { EMPTY_HOME_DATA: {} },
  });
  const home = {
    schema_version: 1, projects: { total: 0, items: [] },
    services_navigation: [], feedbacks: [], faqs: [],
  };
  assert.equal(options.map(home), home);
  for (const invalid of [
    null,
    { ...home, schema_version: 2 },
    { ...home, projects: { total: '0', items: [] } },
    { ...home, projects: { total: -1, items: [] } },
    { ...home, services_navigation: {} },
  ]) {
    assert.throws(() => options.map(invalid), /Invalid home data response/);
  }
});
