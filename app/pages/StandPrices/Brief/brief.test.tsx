import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as phoneMask from '../../../shared/utils/usePhoneMask';
import * as valibot from 'valibot';

test('contact form links activate popup buttons and keep inline form scrolling', () => {
  const output = ts.transpileModule(readFileSync('app/shared/utils/scrollToSection.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const module = { exports: {} as any };
  const lenisManager = { state: { v: null as any } };
  new Function('require', 'module', 'exports', output)(() => ({ lenisManager }), module, module.exports);
  let clicks = 0;
  let nativeScrolls = 0;
  const popupOpener = { matches: () => true, click: () => { clicks++; } };
  const inlineForm = { matches: () => false, scrollIntoView: () => { nativeScrolls++; } };
  const scrolls: any[] = [];
  lenisManager.state.v = { scrollTo: (...args: any[]) => { scrolls.push(args); } };
  module.exports.scrollToSection(popupOpener);
  assert.equal(clicks, 1);
  assert.deepEqual(scrolls, []);
  module.exports.scrollToSection(inlineForm);
  assert.deepEqual(scrolls, [[inlineForm, { offset: -120, duration: 2 }]]);
  lenisManager.state.v = null;
  module.exports.scrollToSection(inlineForm);
  assert.equal(nativeScrolls, 1);
  module.exports.scrollToSection(popupOpener);
  assert.equal(clicks, 2);
});

test('popup scroll locks survive delayed Lenis initialization and overlapping popups', async () => {
  const names = ['window', 'document', 'Node', 'requestAnimationFrame', 'cancelAnimationFrame'] as const;
  const originals = names.map((name) => Object.getOwnPropertyDescriptor(globalThis, name));
  class Element {
    firstElementChild = {};
    contains(target: unknown) { return target === this; }
  }
  const listeners: { type: string; handler: (event: any) => void; signal: AbortSignal }[] = [];
  const addEventListener = (type: string, handler: (event: any) => void, options: any) => {
    listeners.push({ type, handler, signal: options.signal });
  };
  const documentMock = {
    documentElement: { style: { overflow: 'clip' } },
    body: { style: { overflow: 'auto', touchAction: 'pan-y' } },
    activeElement: null,
    addEventListener,
  };
  const globals = [{ addEventListener }, documentMock, Element, () => 1, () => {}];
  names.forEach((name, index) => Object.defineProperty(globalThis, name, { configurable: true, value: globals[index] }));
  try {
    let stopped = false;
    let rafRunning = true;
    let initialize!: () => void;
    const initialization = new Promise<void>((resolve) => { initialize = resolve; });
    const glLenis = { v: null as any };
    const lenisManager = {
      init: () => glLenis.v ? undefined : initialization,
      stopRaf: () => { rafRunning = false; },
      startRaf: () => { rafRunning = true; },
    };
    let wrapper: Element;
    let cleanup: (() => void) | undefined;
    let refIndex = 0;
    const effect = (callback: () => (() => void) | undefined) => { cleanup = callback(); };
    const output = ts.transpileModule(readFileSync('app/shared/components/_helpers/GlobalScrollLock.tsx', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const module = { exports: {} as any };
    new Function('require', 'module', 'exports', output)((id: string) => {
      if (id === 'react') return {
        useRef: () => ({ current: refIndex++ === 0 ? wrapper : null }),
        useLayoutEffect: effect, useEffect: effect,
      };
      if (id === 'react/jsx-runtime') return { jsx: () => null };
      if (id === 'shared/utils/lenis') return { glLenis, lenisManager };
      if (id === 'lenis') return { default: class MockLenis { raf() {} destroy() {} } };
      throw new Error(id);
    }, module, module.exports);
    const mount = () => {
      wrapper = new Element(); refIndex = 0;
      module.exports.GlobalScrollLock({});
      return { element: wrapper, close: cleanup! };
    };
    const first = mount();
    assert.equal(documentMock.documentElement.style.overflow, 'hidden');
    glLenis.v = { stop: () => { stopped = true; }, start: () => { stopped = false; } };
    initialize(); await initialization;
    assert.equal(stopped, true);
    assert.equal(rafRunning, false);
    const second = mount();
    first.close();
    assert.equal(stopped, true);
    assert.equal(rafRunning, false);
    assert.equal(documentMock.documentElement.style.overflow, 'hidden');
    for (const target of [new Element(), second.element]) {
      let prevented = false;
      for (const listener of listeners.filter((item) => item.type === 'wheel' && !item.signal.aborted)) {
        listener.handler({ target, preventDefault: () => { prevented = true; } });
      }
      assert.equal(prevented, target !== second.element);
    }
    second.close();
    assert.equal(stopped, false);
    assert.equal(rafRunning, true);
    assert.equal(documentMock.documentElement.style.overflow, 'clip');
    assert.equal(documentMock.body.style.overflow, 'auto');
    assert.equal(documentMock.body.style.touchAction, 'pan-y');
    assert.ok(listeners.every((listener) => listener.signal.aborted));
  } finally {
    names.forEach((name, index) => {
      if (originals[index]) Object.defineProperty(globalThis, name, originals[index]!);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
});

// Exercise the rendered controls and their event handlers without a DOM or new test dependencies.
test('budget interaction, file validation/removal and brief submission', async () => {
  let slots: any[] = [];
  let cursor = 0;
  const react = {
    useState: (initial: any) => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], (value: any) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useEffect: () => {},
    useRef: () => ({ current: null }),
  };
  const jsx = (type: any, props: any) => ({ type, props });
  const load = (path: string, mocks: Record<string, any> = {}) => {
    const output = ts.transpileModule(readFileSync(path, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const module = { exports: {} as any };
    new Function('require', 'module', 'exports', output)((id: string) => {
      if (id === 'react') return react;
      if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      return mocks[id] ?? { default: () => null };
    }, module, module.exports);
    return module.exports;
  };
  const data = load('app/pages/StandPrices/Brief/data.ts');
  const controls = load('app/pages/StandPrices/Brief/controls.tsx', {
    './data': data, 'shared/utils/usePhoneMask': phoneMask,
  });
  const nodes = (node: any): any[] => !node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
  const find = (tree: any, predicate: (node: any) => boolean) => nodes(tree).find(predicate);
  let phone = '';
  const renderPhone = () => find(controls.Field({
    label: 'Телефон', type: 'tel', value: phone, onChange: (value: string) => { phone = value; },
  }), (node) => node.type === 'input');
  assert.equal(renderPhone().props.value, '');
  for (const input of ['9123456789', '8 (912) 345-67-89', '+7 (912) 345-67-89', '9123456789999']) {
    renderPhone().props.onChange({ target: { value: input } });
    assert.equal(phone, '79123456789');
    assert.equal(renderPhone().props.value, '+7 (912) 345-67-89');
    assert.equal(phoneMask.isValidRuPhone(phone), true);
  }
  for (const [key, selectionStart, expected] of [
    ['Backspace', 13, '7912346789'],
    ['Delete', 12, '7912345789'],
  ] as const) {
    phone = '79123456789';
    let prevented = false;
    renderPhone().props.onKeyDown({ key, currentTarget: { selectionStart }, preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(phone, expected);
    assert.equal(phoneMask.isValidRuPhone(phone), false);
  }
  for (const input of ['9', '8', 'abc', '']) {
    renderPhone().props.onChange({ target: { value: input } });
    assert.equal(phoneMask.isValidRuPhone(phone), false);
  }
  assert.equal(phone, '');
  assert.equal(renderPhone().props.value, '');
  const emailField = find(controls.Field({ label: 'Email', type: 'email', value: 'a@b.ru', onChange: () => {} }), (node) => node.type === 'input');
  assert.equal(emailField.props.value, 'a@b.ru');
  assert.equal(emailField.props.onKeyDown, undefined);
  let chosen: any = null;
  const budget = controls.BudgetRange({ value: null, isUnknown: false, onChange: (value: any) => { chosen = value; } });
  assert.match(budget.props.className, /isDisabled/);
  assert.equal(chosen, null); // Rendering the active-looking slider must not choose a budget.
  assert.equal(find(budget, (node) => node.type === 'p').props.children, 'Выберите бюджет');
  const range = find(budget, (node) => node.type === 'input');
  assert.equal(range.props['aria-valuetext'], 'Не выбран');
  assert.equal(range.props.disabled, undefined);
  for (const event of ['onPointerDown', 'onClick']) {
    chosen = null;
    range.props[event]();
    assert.equal(chosen, 0); // First position is explicitly chosen: 500000, not null.
  }
  for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']) {
    chosen = null;
    range.props.onKeyDown({ key });
    assert.equal(chosen, 0);
  }
  const selectedBudget = controls.BudgetRange({ value: 0, isUnknown: false, onChange: () => {} });
  assert.doesNotMatch(selectedBudget.props.className, /isDisabled/);
  assert.equal(find(selectedBudget, (node) => node.type === 'input').props['aria-valuetext'], data.formatRub(data.BUDGETS[0]));
  const unknownBudget = controls.BudgetRange({ value: null, isUnknown: true, onChange: () => {} });
  assert.equal(find(unknownBudget, (node) => node.type === 'p').props.children, 'Не определён');
  const file = (name: string, size = 1) => ({ name, size, type: '' });
  let files: any[] = [];
  const renderFiles = () => { cursor = 0; return controls.FileField({ files, onChange: (value: any[]) => { files = value; } }); };
  const add = (picked: any[]) => find(renderFiles(), (node) => node.type === 'input').props.onChange({ target: { files: picked, value: '' } });
  for (const extension of data.FILE_EXTENSIONS) {
    files = [];
    add([file(`file.${extension.toUpperCase()}`)]);
    assert.equal(files.length, 1);
  }
  files = [];
  add([file('bad.exe'), file('big.pdf', data.FILE_MAX_SIZE + 1)]);
  assert.equal(files.length, 0);
  assert.ok(find(renderFiles(), (node) => node.props.role === 'alert'));
  add(Array.from({ length: 6 }, (_, i) => file(`${i}.pdf`)));
  assert.equal(files.length, 5);
  assert.match(slots[0], /5/);
  files = [];
  add([file('a.pdf', 10 * 1024 ** 2), file('b.pdf', 10 * 1024 ** 2), file('c.pdf', 5 * 1024 ** 2)]);
  assert.equal(files.length, 3);
  add([file('d.pdf')]);
  assert.equal(files.length, 3);
  assert.match(slots[0], /25/);
  const item = find(renderFiles(), (node) => typeof node.type === 'function' && node.props.file);
  item.props.onRemove();
  assert.equal(files.length, 2);
  assert.equal(slots[0], '');

  slots = [];
  const calls: any[] = [];
  let response: any = { ok: true };
  const api = {
    sendLead: async (lead: any) => { calls.push(['json', lead]); return response; },
    sendLeadWithFiles: async (lead: any, attachments: any) => { calls.push(['files', lead, attachments]); return response; },
  };
  const briefModule = load('app/pages/StandPrices/Brief/index.tsx', {
    './data': data, './controls': controls, 'api/form': api,
    valibot,
    'shared/utils/usePhoneMask': phoneMask,
    'shared/utils/_stm': { signal: (value: any) => ({ v: value }) },
    '@qtpy/use-popup': { default: () => ({ Popup: 'popup', toOpenPopup: () => {}, toClosePopup: () => {} }) },
  });
  const hook = () => { cursor = 0; return briefModule.default(); };
  let popup = hook();
  assert.equal(slots[0].budget, null);
  const steps = () => find(popup.popup, (node) => typeof node.type === 'function' && node.props.setStepIndex);
  const renderSteps = () => { cursor = 3; return steps().type(steps().props); };
  slots[1] = 3;
  popup = hook();
  let tree = renderSteps();
  assert.equal(find(tree, (node) => node.props.className === 'Brief-next').props.disabled, true);
  find(tree, (node) => node.type === controls.BudgetRange).props.onChange(0);
  assert.equal(slots[0].budget, 0);
  assert.equal(slots[0].budgetUnknown, false);
  slots[1] = 2; popup = hook();
  slots[1] = 3; popup = hook(); tree = renderSteps();
  assert.equal(find(tree, (node) => node.props.className === 'Brief-next').props.disabled, false);
  find(tree, (node) => node.type === controls.Checkbox).props.onChange(true);
  assert.equal(slots[0].budget, null);
  assert.equal(slots[0].budgetUnknown, true);
  popup = hook(); tree = renderSteps();
  assert.equal(find(tree, (node) => node.props.className === 'Brief-next').props.disabled, false);
  find(tree, (node) => node.type === controls.Checkbox).props.onChange(false);
  popup = hook(); tree = renderSteps();
  assert.equal(slots[0].budget, null);
  assert.equal(find(tree, (node) => node.props.className === 'Brief-next').props.disabled, true);
  find(tree, (node) => node.type === controls.Checkbox).props.onChange(true);
  popup = hook(); tree = renderSteps();
  find(tree, (node) => node.type === controls.BudgetRange).props.onChange(0);
  assert.equal(slots[0].budgetUnknown, false);

  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    ym: (...args: any[]) => calls.push(['ym', ...args]),
    _tmr: { push: (goal: any) => calls.push(['tmr', goal]) },
  } });
  try {
    slots[0] = { ...slots[0], name: 'Иван', company: 'Компания', position: 'Директор', phone: '', email: 'a@b.ru', agreed: true };
    for (const invalidPhone of ['', '7912345678', '1234567890', '89123456789', '791234567890']) {
      slots[0].phone = invalidPhone;
      slots[1] = 7; popup = hook(); tree = renderSteps();
      await find(tree, (node) => node.props.children === 'Получить дизайн проект и расчет').props.onClick();
      assert.equal(slots[1], 7);
      assert.equal(calls.some(([kind]) => kind === 'json' || kind === 'files'), false);
      popup = hook(); tree = renderSteps();
      assert.equal(find(tree, (node) => node.type === controls.Field && node.props.type === 'tel').props.error, phoneMask.phoneErrorMessage);
    }
    calls.length = 0;
    const phoneField = find(tree, (node) => node.type === controls.Field && node.props.type === 'tel');
    find(phoneField.type(phoneField.props), (node) => node.type === 'input').props.onChange({ target: { value: '8 (912) 345-67-89' } });
    assert.equal(slots[0].phone, '79123456789');
    for (const invalidEmail of ['', ' ', 'a@@example.com', 'a@example.c', 'a@-example.com', 'a b@example.com']) {
      slots[0].email = invalidEmail;
      slots[1] = 7; popup = hook(); tree = renderSteps();
      await find(tree, (node) => node.props.children === 'Получить дизайн проект и расчет').props.onClick();
      assert.equal(slots[1], 7);
      assert.equal(calls.some(([kind]) => kind === 'json' || kind === 'files'), false);
      popup = hook(); tree = renderSteps();
      assert.equal(find(tree, (node) => node.type === controls.Field && node.props.type === 'email').props.error, invalidEmail.trim() ? 'Проверьте email' : 'Укажите email');
    }
    slots[0].email = 'name+brief@example.co.uk';
    calls.length = 0;
    const submit = async () => {
      slots[1] = 7; popup = hook(); tree = renderSteps();
      await find(tree, (node) => node.props.children === 'Получить дизайн проект и расчет').props.onClick();
      assert.equal(slots[1], 8);
    };
    await submit();
    assert.deepEqual(calls[0], ['ym', 99631636, 'reachGoal', 'request_form_all']);
    assert.equal(calls[1][0], 'json');
    assert.equal(calls[1][1].consent, false);
    assert.equal(calls[1][1].phone, '79123456789');
    assert.equal(calls[1][1].email, 'name+brief@example.co.uk');
    assert.match(calls[1][1].project, /Бюджет: 500/);
    assert.deepEqual(calls[2], ['ym', 99631636, 'reachGoal', 'request_popup_full']);
    assert.deepEqual(calls[3], ['tmr', { type: 'reachGoal', id: 3746602, goal: 'reach_goal_popup' }]);
    slots[0] = { ...slots[0], budget: null, budgetUnknown: true, files: [file('plan.pdf')] };
    response = { ok: false, code: 'lead_file_invalid', error: 'Файл не принят' };
    calls.length = 0;
    await submit();
    assert.deepEqual(calls[0], ['ym', 99631636, 'reachGoal', 'request_form_all']);
    assert.equal(calls[1][0], 'files');
    assert.match(calls[1][1].project, /Бюджет: не определён/);
    assert.match(calls[1][1].project, /Файлы: plan.pdf \(приложены к заявке\)/);
    assert.deepEqual(calls[2], ['ym', 99631636, 'reachGoal', 'request_form_false']);
    popup = hook(); tree = renderSteps();
    assert.ok(find(tree, (node) => node.props.children === 'Файл не принят'));
    popup.open();
    assert.equal(slots[1], 7);
    assert.equal(slots[0].files[0].name, 'plan.pdf');
  } finally {
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
