import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadModule(relativePath, imports = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (name) => imports[name] ?? {
      signal: (value) => ({ v: value }),
      toCdnMediaUrl: (value) => value,
    },
  });
  return exports;
}

const plain = (value) => JSON.parse(JSON.stringify(value));

test('Projects loader returns cards and facets without relying on global signals', async () => {
  const projects = [{ id: 1, slug: 'fixture', payload: { title: 'Fixture' } }];
  const filters = { exhibition_stand: [] };
  const route = loadModule('./index.tsx', {
    'api/pageData.server': { getProjectCards: async () => projects },
    'api/filters': { getFilters: async () => filters },
  });

  const result = await route.loader();
  assert.equal(result.projects, projects);
  assert.equal(result.filters, filters);
});

test('Home loader returns its own home data', async () => {
  const data = { projects: { items: [], total: 0 }, faqs: [], feedbacks: [] };
  const route = loadModule('../Home/index.tsx', {
    'api/home/home.api': { getHomeData: async () => data },
  });
  assert.equal(await route.loader(), data);
});

for (const singleCategory of [true, false]) {
  test(`Map loader returns only labels/URLs (${singleCategory ? 'single' : 'multiple'} categories)`, async () => {
    const categories = [{ slug: 'design', payload: {
      name: 'Design', content: 'private category body',
      posts: [{ slug: 'stand', title: 'Stand', content: 'private service body' }],
    } }];
    if (!singleCategory) categories.push({ slug: 'other', payload: { name: 'Other', posts: [] } });
    const requested = [];
    const feed = (prefix) => ({ fetch: async (params) => {
      requested.push(params);
      return { articles: [{ slug: 'article', payload: { title: prefix, content: 'private article body' } }] };
    } });
    const route = loadModule('../MapWebsite/index.tsx', {
      'api/pageData.server': { getProjectCards: async () => [{
        slug: 'project', payload: { title: 'Project', blocks: { secret: true } },
      }] },
      'api/services/services.api': { getServiceCategories: async () => categories },
      'api/feed/feed.api': { getFeedNews: feed('News'), getFeedBlog: feed('Blog') },
      'shared/utils/decodeUnicodeEscapes': { decodeUnicodeEscapes: (value) => value },
    });

    assert.deepEqual(plain(await route.loader()), {
      projects: [['Project', '/projects/project']],
      services: [[['Design', 'Stand'], singleCategory ? '/services/stand' : '/services/design/stand']],
      serviceCategories: singleCategory
        ? [['Design', '/services']]
        : [['Design', '/services/design'], ['Other', '/services/other']],
      news: [['News', '/news/article']],
      blogs: [['Blog', '/blog/article']],
    });
    assert.deepEqual(plain(requested), [{ per_page: 100 }, { per_page: 100 }]);
  });
}

test('compact cards preserve reactive OR-within/AND-between filtering and clear', () => {
  let subscriptions = 0;
  const store = loadModule('../../store/stGlobal.ts', {
    'shared/utils/_stm': { signal: (value) => ({ v: value }) },
    'shared/utils/_stm/react/react': { useSignalValue: () => { subscriptions++; } },
  });
  const cards = [
    { id: 1, 'exhibition-stand': [75], 'type-stand': [81], 'year-stand': [91] },
    { id: 2, 'exhibition-stand': [75], 'type-stand': [82], 'year-stand': [92] },
    { id: 3, 'exhibition-stand': [76], 'type-stand': [82], 'year-stand': [91] },
  ];
  const ids = () => plain(store.toFilterData(cards).map((card) => card.id));
  assert.deepEqual(ids(), [1, 2, 3]);
  store.toggleFilter('exhibition_stand', 75);
  assert.deepEqual(ids(), [1, 2]);
  store.toggleFilter('type_stand', 82);
  assert.deepEqual(ids(), [2]);
  store.toggleFilter('type_stand', 81);
  assert.deepEqual(ids(), [1, 2]);
  store.toggleFilter('type_stand', 81);
  assert.deepEqual(ids(), [2]);
  store.toggleFilter('year_stand', 91);
  assert.deepEqual(ids(), []);
  store.toggleFilter.toClear();
  assert.deepEqual(ids(), [1, 2, 3]);
  assert.equal(subscriptions, 7, 'each filter evaluation retains its UI signal subscription');
});
