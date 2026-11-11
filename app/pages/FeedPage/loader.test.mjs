import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { renderToStaticMarkup } from 'react-dom/server';
import * as jsxRuntime from 'react/jsx-runtime';

function load(relativePath, imports) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, URL, URLSearchParams, Response,
    require(id) {
      if (Object.hasOwn(imports, id)) return imports[id];
      throw new Error(`Unexpected runtime dependency: ${id}`);
    },
  });
  return exports;
}

function article(id, slug = `article-${id}`) {
  return {
    id, slug, modified: '2026-10-30',
    payload: {
      title: `Title ${id}`, subtitle: 'Subtitle', date: '2026-10-30',
      cover: { url: '/cover.jpg', metadata: 'not for cards' },
      blocks: [{ title: 'Full content', descriptions: ['x'.repeat(100000)] }],
      seo: { title: 'SEO title', description: 'SEO description' },
    },
  };
}

function harness({ current = article(2), items = [article(1), article(2), article(3), article(4)] } = {}) {
  const calls = [];
  const query = (name, result) => ({ fetch: async (params) => { calls.push({ name, params }); return result; } });
  const api = {
    getFeedBlog: query('blog', { articles: items, totalPage: 7 }),
    getFeedNews: query('news', { articles: items, totalPage: 7 }),
    getFeedBlogCategory: query('blog_category', [{ id: 9, slug: 'category', name: 'Category', payload: { posts: items } }]),
    getFeedNewsCategory: query('news_category', [{ id: 8, slug: 'category', name: 'Category', payload: { posts: items } }]),
    getFeedBlogArticle: query('blog_article', current),
    getFeedNewsArticle: query('news_article', current),
  };
  const listing = load('./loader.server.ts', { 'api/feed/feed.api': api });
  const detail = load('../FeedArticle/loader.server.ts', {
    'api/feed/feed.api': api,
    '../FeedPage/loader.server': listing,
  });
  return { listing, detail, calls };
}

const plain = (value) => JSON.parse(JSON.stringify(value));

test('blog and news listing loaders return only compact cards and category options', async () => {
  for (const section of ['blog', 'news']) {
    const h = harness();
    const data = await h.listing._loader(`https://example.test/${section}?page=2&per_page=20&${section}_category=9`);
    assert.deepEqual(plain(data.feed.articles[0]), {
      id: 1, slug: 'article-1',
      payload: { title: 'Title 1', subtitle: 'Subtitle', date: '2026-10-30', cover: { url: '/cover.jpg' } },
    });
    assert.equal(data.feed.totalPage, 7);
    assert.deepEqual(Object.keys(data.category[0]).sort(), ['id', 'name', 'slug']);
    assert.deepEqual(plain(h.calls[0]), { name: section, params: { page: 2, per_page: 20, [`${section}_category`]: 9 } });
    assert.ok(JSON.stringify(data).length < 2000);
  }
});

test('query values are finite positive bounded integers before fetching', async () => {
  const cases = [
    ['', 1, 10],
    ['?page=NaN&per_page=Infinity&blog_category=-5', 1, 10],
    ['?page=-1&per_page=0', 1, 10],
    ['?page=1e100&per_page=101', 10000, 100],
    ['?page=2.9&per_page=0.5', 2, 1],
  ];
  for (const [query, page, per_page] of cases) {
    const h = harness();
    await h.listing._loader(`https://example.test/blog${query}`);
    assert.deepEqual(plain(h.calls[0].params), { page, per_page });
  }
  const h = harness();
  await h.listing._loader('https://example.test/news?redirect=blog&news_category=3&blog_category=4');
  assert.deepEqual(plain(h.calls[0]), { name: 'news', params: { page: 1, per_page: 10, news_category: 3 } });
});

test('article loaders retain full current content and SEO but exclude current before limiting compact previews', async () => {
  for (const section of ['blog', 'news']) {
    const current = article(2);
    const h = harness({ current, items: [article(1), current, article(3), article(4), article(5)] });
    const data = await h.detail._loader(`https://example.test/${section}/article-2`);
    assert.equal(data.article, current);
    assert.equal(data.article.payload.blocks[0].descriptions[0].length, 100000);
    assert.equal(data.article.payload.seo.title, 'SEO title');
    assert.deepEqual(plain(data.articles.map((item) => item.id)), [1, 3, 4]);
    assert.equal(data.articles[0].payload.blocks, undefined);
    assert.deepEqual(plain(h.calls[1]), { name: section, params: { page: 1, per_page: 4 } });
  }
});

test('related previews exclude duplicate slugs, allow fewer than three, and missing current returns 404', async () => {
  const h = harness({ items: [article(99, 'article-2'), article(2), article(3)] });
  const data = await h.detail._loader('https://example.test/news/article-2');
  assert.deepEqual(plain(data.articles.map((item) => item.id)), [3]);
  const absent = harness({ current: null });
  await assert.rejects(absent.detail._loader('https://example.test/blog/missing'), (error) => error.status === 404);
  assert.equal(absent.calls.length, 1);
});

test('filter selection is controlled by route data without mount-time navigation', () => {
  const { default: Filter } = load('./Filter/index.tsx', {
    'react/jsx-runtime': jsxRuntime, './styles.css': {},
  });
  let navigations = 0;
  const props = { items: ['все', 'Category'], onClick: () => { navigations += 1; } };
  const first = renderToStaticMarkup(jsxRuntime.jsx(Filter, { ...props, startItem: 'Category' }));
  const back = renderToStaticMarkup(jsxRuntime.jsx(Filter, { ...props, startItem: 'все' }));
  assert.match(first, /class="Filter-item active">Category/);
  assert.match(back, /class="Filter-item active">все/);
  assert.equal(navigations, 0);
});

test('listing navigation preserves filters and page size, resets page on filtering, and follows history data', () => {
  const Filter = () => null;
  const Pagination = () => null;
  let search = new URLSearchParams('page=3&per_page=20&news_category=8&other=kept');
  const emptyComponent = { default: () => null };
  const imports = {
    'react/jsx-runtime': jsxRuntime,
    'react-router': {
      useSearchParams: () => [search, (next) => { search = next; }],
      useLocation: () => ({ pathname: '/news' }),
    },
    './styles.css': {}, './Filter': { default: Filter }, './Pagination': { default: Pagination },
    'shared/components/ContactForm': emptyComponent,
    'shared/components/Article': emptyComponent,
    'shared/components/Link': emptyComponent,
    'shared/components/IsNot': emptyComponent,
    'shared/components/StartPage': emptyComponent,
    'shared/utils/formatDateToRussian': { default: () => '' },
    'shared/seo/meta': {},
  };
  const { default: Page } = load('./index.tsx', imports);
  function find(node, type) {
    if (node?.type === type) return node;
    const children = node?.props?.children;
    for (const child of Array.isArray(children) ? children.flat() : [children]) {
      if (child && typeof child === 'object') {
        const match = find(child, type);
        if (match) return match;
      }
    }
  }
  const data = {
    feed: { articles: [], totalPage: 5 },
    category: [{ id: 8, name: 'Selected', slug: 'selected' }, { id: 9, name: 'Other', slug: 'other' }],
    qparams: { page: 3, per_page: 20, news_category: 8 },
  };
  let tree = Page({ data });
  assert.equal(find(tree, Filter).props.startItem, 'Selected');
  assert.equal(find(tree, Pagination).props.currentPage, 3);
  find(tree, Pagination).props.onChange(4);
  assert.equal(search.toString(), 'page=4&per_page=20&news_category=8&other=kept');
  find(tree, Filter).props.onClick('Other');
  assert.equal(search.toString(), 'page=1&per_page=20&news_category=9&other=kept');
  find(tree, Filter).props.onClick('все');
  assert.equal(search.toString(), 'page=1&per_page=20&other=kept');
  // A history navigation delivers different loader data without remounting page-local state.
  tree = Page({ data: { ...data, qparams: { page: 2, per_page: 20, news_category: 9 } } });
  assert.equal(find(tree, Filter).props.startItem, 'Other');
  assert.equal(find(tree, Pagination).props.currentPage, 2);
});

test('browser page modules have no runtime feed API imports; wrapper loaders use server modules', () => {
  for (const folder of ['FeedPage', 'FeedArticle']) {
    const index = readFileSync(new URL(`../${folder}/index.tsx`, import.meta.url), 'utf8');
    assert.doesNotMatch(index, /from ['"]api\/feed\/feed\.api['"]/);
    for (const route of ['Blog', 'News']) {
      const wrapper = readFileSync(new URL(`../${folder}/${route}.tsx`, import.meta.url), 'utf8');
      assert.match(wrapper, /import \{ _loader \} from '\.\/loader\.server'/);
      assert.doesNotMatch(wrapper, /clientLoader/);
    }
  }
});
