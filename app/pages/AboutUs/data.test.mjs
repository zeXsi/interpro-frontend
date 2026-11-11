import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function loadModule(relativePath, dependencies = {}) {
  const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
  const { outputText, diagnostics } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    reportDiagnostics: true,
  });
  assert.equal(diagnostics.length, 0);
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => dependencies[name] ?? {},
    Response,
  });
  return exports;
}

const faqs = Array.from({ length: 6 }, (_, i) => ({
  id: i, _links: { unused: true }, payload: { question: `Question ${i}`, answer: `Answer ${i}`, unused: true },
}));
const feedbacks = Array.from({ length: 6 }, (_, i) => ({
  id: i, _links: { unused: true }, payload: {
    title: `Review ${i}`, company: `Company ${i}`, person: { name: 'Name', position: 'Position' },
    text: 'Review text', pdf: '/review.pdf', cover: null, date: '2026-01-01', unused: true,
  },
}));
const licenses = Array.from({ length: 4 }, (_, i) => ({
  id: i, _links: { unused: true }, payload: {
    title: `License ${i}`, file_name: 'license.pdf', file_url: '/license.pdf', preview_url: '/license.jpg', unused: true,
  },
}));
const dependencies = {
  'api/faq/faq.api': { getFaqs: async () => faqs },
  'api/feedbacks/feedbacks.api': { getFeedbacks: async () => feedbacks },
  'api/licenses/license.api': { getLicenses: async () => licenses },
};

test('About loader returns bounded display data without WordPress metadata', async () => {
  const data = await loadModule('./index.tsx', dependencies).loader();
  assert.equal(data.faqs.length, 4);
  assert.equal(data.feedbacks.length, 4);
  assert.equal(data.licenses.length, 2);
  assert.deepEqual(Object.keys(data.faqs[0]).sort(), ['answer', 'question']);
  assert.deepEqual(Object.keys(data.feedbacks[0]), ['payload']);
  assert.equal(data.feedbacks[0].payload.unused, undefined);
  assert.equal(data.licenses[0].unused, undefined);
});

test('collection routes return all records, preserving order and display fields', async () => {
  const faqData = await loadModule('../FAQPage/index.tsx', dependencies).loader();
  const feedbackData = await loadModule('./Feedbacks/index.tsx', dependencies).loader();
  const licenseData = await loadModule('./Certificates/index.tsx', dependencies).loader();
  assert.equal(faqData.faqs.length, 6);
  assert.equal(faqData.faqs[5].question, 'Question 5');
  assert.equal(feedbackData.feedbacks.length, 6);
  assert.equal(feedbackData.feedbacks[5].payload.company, 'Company 5');
  assert.equal(licenseData.licenses.length, 4);
  assert.equal(licenseData.licenses[3].file_url, '/license.pdf');
});

test('route API failures propagate instead of producing successful empty data', async () => {
  const error = new Error('API unavailable');
  for (const path of ['./index.tsx', '../FAQPage/index.tsx']) {
    const module = loadModule(path, {
      ...dependencies,
      'api/faq/faq.api': { getFaqs: async () => { throw error; } },
    });
    await assert.rejects(module.loader(), (actual) => actual === error);
  }
});

test('review projection depends only on supplied records and preserves document/person fields', () => {
  const project = loadModule('../../shared/sections/DocOverview/feedbacksToItems.ts').default;
  const items = project(feedbacks.slice(0, 1));
  assert.equal(items.length, 1);
  assert.equal(items[0].company, 'Company 0');
  assert.equal(items[0].pdfUrl, '/review.pdf');
  assert.equal(items[0].personName, 'Name');
  assert.equal(project([]).length, 0);
});

test('services index retains single-category display sections but omits nested unrelated data', async () => {
  const category = {
    id: 1, slug: 'category', name: 'Category', description: 'Description', _links: { unused: true },
    nextItem: { slug: 'next', title: 'Next', unused: true },
    payload: {
      id: 1, slug: 'category', name: 'Category', description: 'Description',
      parent: 0, cover: '/cover.jpg', order: 0, count: 1, tags: ['unused'], children: [{ huge: true }],
      posts: [{ id: 2, slug: 'service', title: 'Service', payload: { huge: true } }],
      accordion: [{ title: 'Accordion', content: '<p>Content</p>', unused: true }],
      content_blocks: [{ title: 'Content', content: '<p>Body</p>' }], price: 'Price',
      projects: [{ id: 3, slug: 'project', name: 'Project', full_image: { url: '/project.jpg', huge: true } }],
      reviews: [{ title: 'Review', content: 'Review body', pdf: { url: '/review.pdf', huge: true } }],
      faq: [{ question: 'Question', answer: 'Answer', huge: true }],
      news: [{ id: 4, slug: 'news', title: 'News', name: 'News', permalink: '/blog/news', full_image: null }],
    },
  };
  const load = (categories) => loadModule('../ServiceCategories/index.tsx', {
    'api/services/services.api': { getServiceCategories: async () => categories },
  }).loader();
  const single = (await load([category])).categories[0];
  assert.equal(single._links, undefined);
  assert.equal(single.payload.posts[0].payload, undefined);
  assert.equal(single.payload.children.length, 0);
  assert.equal(single.payload.content_blocks[0].content, '<p>Body</p>');
  assert.equal(single.payload.projects[0].full_image.url, '/project.jpg');
  assert.equal(single.payload.faq[0].answer, 'Answer');
  const multiple = (await load([category, { ...category, id: 2 }])).categories;
  assert.equal(multiple.length, 2);
  assert.equal(multiple[0].payload.name, 'Category');
  assert.equal(multiple[0].payload.description, 'Description');
  assert.equal(multiple[0].payload.posts.length, 0);
  assert.equal(multiple[0].payload.content_blocks, undefined);
});
