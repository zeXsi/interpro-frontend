import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import axios from 'axios';

test('landing UTM storage merges present parameters and preserves them on clean URLs', () => {
  const source = readFileSync('app/api/utm.ts', 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} as any };
  new Function('module', 'exports', output)(module, module.exports);
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  let stored: string | null = null;
  let writes = 0;
  const browser = {
    location: { search: '?utm_source=stand-prices&utm_campaign=brief' },
    localStorage: { getItem: () => stored, setItem: (_key: string, value: string) => { stored = value; writes++; } },
  };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser });
  try {
    module.exports.saveUtmToStorage();
    browser.location.search = '';
    module.exports.saveUtmToStorage();
    assert.equal(writes, 1);
    assert.deepEqual(module.exports.withStoredUtm({ name: 'Имя' }), {
      name: 'Имя', utm_source: 'stand-prices', utm_campaign: 'brief',
    });
    browser.location.search = '?utm_medium=cpc';
    module.exports.saveUtmToStorage();
    assert.deepEqual(module.exports.getStoredUtm(), {
      utm_source: 'stand-prices', utm_campaign: 'brief', utm_medium: 'cpc',
    });
    assert.match(readFileSync('app/root.tsx', 'utf8'), /useEffect\(\(\) => \{\s*saveUtmToStorage\(\);\s*\}, \[location.search\]\)/);
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('blocked storage acquisition, reads and security/quota writes do not break attribution callers', () => {
  const output = ts.transpileModule(readFileSync('app/api/utm.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} as any };
  new Function('module', 'exports', output)(module, module.exports);
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const payload = { name: 'Имя', consent: false };
  const blocked = (name: string) => { throw new DOMException('Storage unavailable', name); };
  const scenarios = [
    { get localStorage(): Storage { return blocked('SecurityError'); } },
    { localStorage: { getItem: () => blocked('SecurityError'), setItem: () => blocked('SecurityError') } },
    ...['SecurityError', 'QuotaExceededError'].map((name) => ({
      localStorage: { getItem: () => null, setItem: () => blocked(name) },
    })),
  ];
  try {
    for (const storage of scenarios) {
      const browser = Object.create(storage);
      browser.location = { search: '?utm_source=landing' };
      Object.defineProperty(globalThis, 'window', { configurable: true, value: browser });
      assert.doesNotThrow(() => module.exports.saveUtmToStorage());
      assert.deepEqual(module.exports.getStoredUtm(), {});
      assert.deepEqual(module.exports.withStoredUtm(payload), payload);
      browser.location.search = '';
      assert.doesNotThrow(() => module.exports.saveUtmToStorage());
    }
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('cookie notice survives blocked storage and preserves stored/dismiss behavior', () => {
  const output = ts.transpileModule(readFileSync('app/shared/components/popups/useCookies/index.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const blocked = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
  const scenarios = [
    { get localStorage(): Storage { return blocked(); } },
    { localStorage: { getItem: blocked, setItem: blocked } },
    { localStorage: { getItem: () => null, setItem: () => { throw new DOMException('Full', 'QuotaExceededError'); } } },
    { localStorage: { getItem: () => null, setItem: () => {} } },
    { localStorage: { getItem: () => 'saved', setItem: () => {} } },
  ];
  try {
    for (const [index, browser] of scenarios.entries()) {
      Object.defineProperty(globalThis, 'window', { configurable: true, value: browser });
      let effect: () => void = () => {};
      let opens = 0;
      let closes = 0;
      const writes: any[] = [];
      const signal = { v: true };
      if (index >= 3) browser.localStorage.setItem = (...args: any[]) => { writes.push(args); };
      const Popup = Object.assign(() => null, { Memo: (value: any) => value });
      const jsx = (type: any, props: any) => ({ type, props });
      const module = { exports: {} as any };
      new Function('require', 'module', 'exports', output)((id: string) => {
        if (id === 'react') return { useEffect: (callback: () => void) => { effect = callback; } };
        if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx };
        if (id === '@qtpy/use-popup') return { default: () => ({ Popup, toOpenPopup: () => { opens++; }, toClosePopup: () => { closes++; } }) };
        if (id === 'store/stGlobal') return { sgIsOpenMWCookies: signal };
        if (id === 'store/stPreloader') return { useHidePreloader: () => ({ clIsHidePreload: '' }) };
        return { default: () => null };
      }, module, module.exports);
      let cookie: any;
      assert.doesNotThrow(() => { cookie = module.exports.default(); });
      assert.doesNotThrow(() => effect());
      assert.equal(opens, index === 4 ? 0 : 1);
      assert.equal(signal.v, index !== 4);
      assert.deepEqual(writes, []); // Reading/mounting never auto-saves a preference.
      const button = cookie.Popup().props.children.find((node: any) => node.props?.onClick);
      assert.doesNotThrow(() => button.props.onClick());
      assert.equal(closes, 1);
      assert.equal(signal.v, false);
      if (index >= 3) assert.deepEqual(writes, [['cookies', 'saved']]);
    }
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('lead JSON/multipart, stored UTM, timeouts and backend file errors', async () => {
  const instance = axios.create({ timeout: 3000, headers: { 'Content-Type': 'application/json; charset=UTF-8' } });
  const requests: any[] = [];
  let rejectFiles = false;
  instance.defaults.adapter = async (config) => {
    requests.push(config);
    if (rejectFiles) throw { response: { status: 400, data: { code: 'lead_file_invalid', message: 'Файл не принят' } } };
    return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
  };
  const source = readFileSync('app/api/form.ts', 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} as any };
  const nativeRequire = createRequire(`${process.cwd()}/package.json`);
  new Function('require', 'module', 'exports', output)((id: string) => {
    if (id === './api.config') return { instance };
    if (id === './utm') return { withStoredUtm: (data: object) => ({ ...data, utm_source: 'landing' }) };
    return nativeRequire(id);
  }, module, module.exports);
  const { sendLead, sendLeadWithFiles } = module.exports;
  const lead = { name: 'Имя', phone: '1234567890', consent: false, area: 45, project: 'Бриф' };
  assert.equal((await sendLead(lead)).ok, true);
  assert.equal(requests[0].timeout, 15000);
  assert.deepEqual(JSON.parse(requests[0].data), { ...lead, utm_source: 'landing' });
  const file = new File(['real contents'], 'plan.pdf', { type: 'application/pdf' });
  assert.equal((await sendLeadWithFiles(lead, [file])).ok, true);
  const multipart = requests[1];
  assert.equal(multipart.url, '/send');
  assert.equal(multipart.timeout, 60000);
  assert.ok(multipart.data instanceof FormData);
  assert.ok(!String(multipart.headers.get('Content-Type')).includes('application/json'));
  assert.ok(!String(multipart.headers.get('Content-Type')).includes('multipart/form-data'));
  assert.equal(multipart.data.get('consent'), '0');
  assert.equal(multipart.data.get('area'), '45');
  assert.equal(multipart.data.get('utm_source'), 'landing');
  assert.equal(await multipart.data.get('files[]').text(), 'real contents');
  await sendLeadWithFiles(lead, []);
  assert.equal(requests[2].timeout, 15000);
  assert.equal(typeof requests[2].data, 'string');
  rejectFiles = true;
  const originalError = console.error;
  console.error = () => {};
  try {
    assert.deepEqual(await sendLeadWithFiles(lead, [file]), { ok: false, code: 'lead_file_invalid', error: 'Файл не принят' });
  } finally {
    console.error = originalError;
  }
  assert.equal(instance.defaults.timeout, 3000);
});
