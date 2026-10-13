import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { createServer } from 'vite';

test('header, desktop menu and article cards render crawlable SPA links', async () => {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  try {
    const { default: Header } = await server.ssrLoadModule('/app/shared/components/Header/index.tsx');
    const { ThreeLevelNav } = await server.ssrLoadModule('/app/shared/components/popups/useMWNav/index.tsx');
    const { default: Article } = await server.ssrLoadModule('/app/shared/components/Article/index.tsx');
    const { default: Button } = await server.ssrLoadModule('/app/shared/components/Button/index.tsx');
    const render = (component) => renderToStaticMarkup(createElement(MemoryRouter, null, component));

    const header = render(createElement(Header));
    assert.match(header, /<a[^>]+href="\/"/);
    assert.match(header, /<a[^>]+href="\/projects"/);
    assert.match(header, /display:contents/);

    const label = render(createElement(Button, { as: 'span', subTitle: 'Subtitle' }, 'Title'));
    assert.match(label, /<span class="Button-title">Title<\/span>/);
    assert.doesNotMatch(label, /<(button|p)\b/);

    const desktop = render(createElement(ThreeLevelNav, {
      columns: [
        { label: 'Блог', link: '/blog' },
        { label: 'Новости', link: '/news' },
        { label: 'Без перехода' },
      ],
      onNavigate: () => assert.fail('SSR must not navigate'),
    }));
    assert.match(desktop, /<a[^>]+href="\/blog"/);
    assert.match(desktop, /<a[^>]+href="\/news"/);
    assert.equal((desktop.match(/<a\b/g) ?? []).length, 2);

    for (const feed of ['blog', 'news']) {
      const article = render(createElement(Article, {
        to: `/${feed}/test-article`,
        title: 'Заголовок',
        desc: 'Описание',
        date: '13 октября',
        srcImg: '/cover.webp',
      }));
      assert.ok(article.includes(`href="/${feed}/test-article"`));
      assert.match(article, /display:contents/);
      assert.match(article, /class="Article"/);
      assert.equal((article.match(/<a\b/g) ?? []).length, 1);
      assert.doesNotMatch(article, /<button\b/);
    }
  } finally {
    await server.close();
  }
});
