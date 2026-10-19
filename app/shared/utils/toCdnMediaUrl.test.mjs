import assert from 'node:assert/strict';
import test from 'node:test';

import { toCdnMediaUrl, toCdnMediaUrls } from './toCdnMediaUrl.ts';

const CDN_ORIGIN = 'https://cdn.interpro.pro';

test('rewrites supported video and WordPress upload URLs', () => {
  const cases = [
    ['/videos/hls/hero.m3u8', 'https://cdn.interpro.pro/videos/hls/hero.m3u8'],
    [
      'https://interpro.pro/videos/hero.m3u8',
      'https://cdn.interpro.pro/videos/hero.m3u8',
    ],
    [
      'https://api.interpro.pro/wp-content/uploads/2026/07/cover.webp',
      'https://cdn.interpro.pro/wp-content/uploads/2026/07/cover.webp',
    ],
  ];

  for (const [input, expected] of cases) {
    assert.equal(toCdnMediaUrl(input, CDN_ORIGIN), expected);
  }
});

test('preserves path, query, and hash', () => {
  assert.equal(
    toCdnMediaUrl(
      'https://api.interpro.pro/wp-content/uploads/A%20B.webp?width=100&width=200#preview',
      CDN_ORIGIN
    ),
    'https://cdn.interpro.pro/wp-content/uploads/A%20B.webp?width=100&width=200#preview'
  );
});

test('leaves API, external video, unrelated paths, and malformed URLs unchanged', () => {
  const values = [
    'https://api.interpro.pro/wp-json/wp/v2/projects',
    'https://www.youtube.com/watch?v=example',
    'https://rutube.ru/video/example',
    'https://vimeo.com/123',
    'https://example.com/videos/hero.m3u8',
    '/images/hero.webp',
    'https://interpro.pro/videos/%ZZ.m3u8',
    'https://',
  ];

  for (const value of values) {
    assert.equal(toCdnMediaUrl(value, CDN_ORIGIN), value);
  }
});

test('an empty or invalid CDN origin disables rewriting', () => {
  const value = '/videos/hls/hero.m3u8';

  assert.equal(toCdnMediaUrl(value, ''), value);
  assert.equal(toCdnMediaUrl(value, 'http://cdn.interpro.pro'), value);
  assert.equal(toCdnMediaUrl(value, 'https://cdn.interpro.pro/base'), value);
});

test('recursively rewrites only eligible string values without mutating input', () => {
  const input = {
    cover: 'https://api.interpro.pro/wp-content/uploads/cover.webp',
    link: 'https://interpro.pro/projects/example',
    nested: [{ video: '/videos/hls/hero.m3u8' }],
  };

  const output = toCdnMediaUrls(input, CDN_ORIGIN);

  assert.deepStrictEqual(output, {
    cover: 'https://cdn.interpro.pro/wp-content/uploads/cover.webp',
    link: 'https://interpro.pro/projects/example',
    nested: [{ video: 'https://cdn.interpro.pro/videos/hls/hero.m3u8' }],
  });
  assert.notStrictEqual(output, input);
  assert.equal(input.cover, 'https://api.interpro.pro/wp-content/uploads/cover.webp');
});
