import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';

import { getSSRStore, ssrSignal } from './index.ts';
import { runWithSSRRequestState } from './ssr.server.ts';

function executeSSRStore(script) {
  const context = { window: {} };
  vm.runInNewContext(script, context);
  return JSON.parse(JSON.stringify(context.window.__SSR_STATE__));
}

test('getSSRStore safely embeds HTML-sensitive content in an inline script', () =>
  runWithSSRRequestState(() => {
    const state = {
      closingTag: '</script><script>alert(1)</script>',
      htmlComment: '<!--',
      ampersand: 'one & two',
      greaterThan: 'two > one',
      lineSeparators: `before\u2028between\u2029after`,
      quotesAndSlashes: String.raw`double " and single ' and backslash \\`,
    };
    const signal = ssrSignal(null, 'safe-serialization');
    signal.v = state;

    const script = getSSRStore();

    assert.doesNotMatch(script, /<\/script/i);
    assert.equal(script.includes('<'), false);
    assert.match(script, /\\u003c/);
    assert.match(script, /\\u003e/);
    assert.match(script, /\\u0026/);
    assert.match(script, /\\u2028/);
    assert.match(script, /\\u2029/);
    assert.deepStrictEqual(executeSSRStore(script), { 'safe-serialization': state });
  }));

test('getSSRStore preserves ordinary SSR state semantics', () =>
  runWithSSRRequestState(() => {
    const state = {
      text: 'ordinary SSR data',
      count: 42,
      enabled: true,
      empty: null,
      nested: { items: ['first', 'second'] },
    };
    const signal = ssrSignal(null, 'ordinary-state');
    signal.v = state;

    const script = getSSRStore();

    const snapshot = { 'ordinary-state': state };
    assert.equal(script, `window['__SSR_STATE__'] = ${JSON.stringify(snapshot)};`);
    assert.deepStrictEqual(executeSSRStore(script), snapshot);
  }));

test('getSSRStore serializes only signals used by the current request', () =>
  runWithSSRRequestState(() => {
    const used = ssrSignal('initial', 'used');
    ssrSignal('unused', 'unused');
    used.v = 'request-value';

    assert.deepStrictEqual(executeSSRStore(getSSRStore()), {
      used: 'request-value',
    });
  }));

test('parallel request scopes isolate signal reads and serialized snapshots', async () => {
  const routeSignal = ssrSignal({ slug: 'baseline' }, 'route-item');
  let releaseFirst;
  let firstWritten;

  const firstCanFinish = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  const firstHasWritten = new Promise((resolve) => {
    firstWritten = resolve;
  });

  const firstRequest = runWithSSRRequestState(async () => {
    routeSignal.v = { slug: 'alpha' };
    firstWritten();
    await firstCanFinish;
    return {
      value: routeSignal.v,
      state: executeSSRStore(getSSRStore()),
    };
  });

  await firstHasWritten;

  const secondRequest = await runWithSSRRequestState(async () => {
    routeSignal.v = { slug: 'beta' };
    await Promise.resolve();
    return {
      value: routeSignal.v,
      state: executeSSRStore(getSSRStore()),
    };
  });

  releaseFirst();
  const firstResult = await firstRequest;

  assert.deepStrictEqual(firstResult, {
    value: { slug: 'alpha' },
    state: { 'route-item': { slug: 'alpha' } },
  });
  assert.deepStrictEqual(secondRequest, {
    value: { slug: 'beta' },
    state: { 'route-item': { slug: 'beta' } },
  });
});

test('server serialization fails closed outside a request scope once SSR is configured', () => {
  assert.throws(() => getSSRStore(), /active SSR request scope/);
});
