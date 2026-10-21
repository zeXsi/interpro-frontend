import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

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
  const controls = load('app/pages/StandPrices/Brief/controls.tsx', { './data': data });
  const nodes = (node: any): any[] => !node || typeof node !== 'object' ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
  const find = (tree: any, predicate: (node: any) => boolean) => nodes(tree).find(predicate);
  let chosen: any = null;
  const budget = controls.BudgetRange({ value: null, isUnknown: false, onChange: (value: any) => { chosen = value; } });
  assert.match(budget.props.className, /isDisabled/);
  const range = find(budget, (node) => node.type === 'input');
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
  find(tree, (node) => node.type === controls.BudgetRange).props.onChange(0);
  assert.equal(slots[0].budgetUnknown, false);

  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    ym: (...args: any[]) => calls.push(['ym', ...args]),
    _tmr: { push: (goal: any) => calls.push(['tmr', goal]) },
  } });
  try {
    slots[0] = { ...slots[0], name: 'Иван', company: 'Компания', position: 'Директор', phone: '1234567890', email: 'a@b.ru', agreed: true };
    const submit = async () => {
      slots[1] = 7; popup = hook(); tree = renderSteps();
      await find(tree, (node) => node.props.children === 'Получить дизайн проект и расчет').props.onClick();
      assert.equal(slots[1], 8);
    };
    await submit();
    assert.equal(calls[0][0], 'json');
    assert.equal(calls[0][1].consent, false);
    assert.match(calls[0][1].project, /Бюджет: 500/);
    assert.deepEqual(calls[1], ['ym', 99631636, 'reachGoal', 'request_popup_full']);
    assert.deepEqual(calls[2], ['tmr', { type: 'reachGoal', id: 3746602, goal: 'reach_goal_popup' }]);
    slots[0] = { ...slots[0], budget: null, budgetUnknown: true, files: [file('plan.pdf')] };
    response = { ok: false, code: 'lead_file_invalid', error: 'Файл не принят' };
    calls.length = 0;
    await submit();
    assert.equal(calls[0][0], 'files');
    assert.match(calls[0][1].project, /Бюджет: не определён/);
    assert.match(calls[0][1].project, /Файлы: plan.pdf \(приложены к заявке\)/);
    assert.deepEqual(calls[1], ['ym', 99631636, 'reachGoal', 'request_form_false']);
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
