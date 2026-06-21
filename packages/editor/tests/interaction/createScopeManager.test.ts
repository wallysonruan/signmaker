import {
  createScope,
  createScopeManager,
} from '../../src/interaction/createScopeManager';
import type { KeyEventDescriptor } from '../../src/interaction/ScopedKeyboardRouter';

function key(keyCode: number): KeyEventDescriptor {
  return { keyCode, key: '', shiftKey: false, ctrlKey: false, metaKey: false };
}

describe('createScope', () => {
  test('starts enabled by default', () => {
    expect(createScope('palette').isEnabled()).toBe(true);
  });

  test('respects enabled:false init', () => {
    expect(createScope('palette', { enabled: false }).isEnabled()).toBe(false);
  });

  test('enable/disable toggle state', () => {
    const s = createScope('palette');
    s.disable();
    expect(s.isEnabled()).toBe(false);
    s.enable();
    expect(s.isEnabled()).toBe(true);
  });

  test('handleKey defaults to false', () => {
    expect(createScope('palette').handleKey(key(37))).toBe(false);
  });

  test('handleKey delegates to init handler', () => {
    const s = createScope('palette', { handleKey: e => e.keyCode === 37 });
    expect(s.handleKey(key(37))).toBe(true);
    expect(s.handleKey(key(38))).toBe(false);
  });

  test('onEnter/onExit hooks fire on enter()/exit()', () => {
    const s = createScope('palette');
    const order: string[] = [];
    s.onEnter(() => order.push('enter'));
    s.onExit(() => order.push('exit'));
    s.enter();
    s.exit();
    expect(order).toEqual(['enter', 'exit']);
  });

  test('hook unsubscribe stops it firing', () => {
    const s = createScope('palette');
    const calls: string[] = [];
    const unsub = s.onEnter(() => calls.push('enter'));
    s.enter();
    unsub();
    s.enter();
    expect(calls).toHaveLength(1);
  });
});

describe('createScopeManager', () => {
  function setup() {
    const mgr = createScopeManager();
    const palette = createScope('palette');
    const canvas  = createScope('canvas');
    mgr.register(palette);
    mgr.register(canvas);
    return { mgr, palette, canvas };
  }

  test('currentScope is null initially', () => {
    expect(createScopeManager().currentScope()).toBeNull();
  });

  test('enter() activates a registered scope', () => {
    const { mgr } = setup();
    mgr.enter('palette');
    expect(mgr.currentScope()).toBe('palette');
  });

  test('enter() is a no-op for unknown scope', () => {
    const { mgr } = setup();
    mgr.enter('does-not-exist');
    expect(mgr.currentScope()).toBeNull();
  });

  test('enter() is a no-op for a disabled scope', () => {
    const { mgr } = setup();
    mgr.disable('palette');
    mgr.enter('palette');
    expect(mgr.currentScope()).toBeNull();
  });

  test('enter() is a no-op when already active', () => {
    const { mgr, palette } = setup();
    const calls: string[] = [];
    palette.onEnter(() => calls.push('enter'));
    mgr.enter('palette');
    mgr.enter('palette');
    expect(calls).toHaveLength(1);
  });

  test('switching scopes exits the previous and enters the next', () => {
    const { mgr, palette, canvas } = setup();
    const order: string[] = [];
    palette.onEnter(() => order.push('palette:enter'));
    palette.onExit(() => order.push('palette:exit'));
    canvas.onEnter(() => order.push('canvas:enter'));

    mgr.enter('palette');
    mgr.enter('canvas');
    expect(order).toEqual(['palette:enter', 'palette:exit', 'canvas:enter']);
    expect(mgr.currentScope()).toBe('canvas');
  });

  test('exit() deactivates current scope', () => {
    const { mgr } = setup();
    mgr.enter('palette');
    mgr.exit();
    expect(mgr.currentScope()).toBeNull();
  });

  test('exit() is a no-op when nothing is active', () => {
    const { mgr } = setup();
    const calls: string[] = [];
    mgr.afterScopeExit(() => calls.push('exit'));
    mgr.exit();
    expect(calls).toHaveLength(0);
  });

  test('disabling the active scope exits it', () => {
    const { mgr } = setup();
    mgr.enter('palette');
    mgr.disable('palette');
    expect(mgr.currentScope()).toBeNull();
  });

  test('unregistering the active scope exits it', () => {
    const { mgr } = setup();
    mgr.enter('palette');
    mgr.unregister('palette');
    expect(mgr.currentScope()).toBeNull();
  });

  test('lifecycle hooks fire in before→after order on enter', () => {
    const { mgr } = setup();
    const order: string[] = [];
    mgr.beforeScopeEnter(n => order.push(`before-enter:${n}`));
    mgr.afterScopeEnter(n => order.push(`after-enter:${n}`));
    mgr.enter('palette');
    expect(order).toEqual(['before-enter:palette', 'after-enter:palette']);
  });

  test('lifecycle hooks fire before→after order on exit during transition', () => {
    const { mgr } = setup();
    mgr.enter('palette');
    const order: string[] = [];
    mgr.beforeScopeExit(n => order.push(`before-exit:${n}`));
    mgr.afterScopeExit(n => order.push(`after-exit:${n}`));
    mgr.beforeScopeEnter(n => order.push(`before-enter:${n}`));
    mgr.afterScopeEnter(n => order.push(`after-enter:${n}`));
    mgr.enter('canvas');
    expect(order).toEqual([
      'before-exit:palette',
      'after-exit:palette',
      'before-enter:canvas',
      'after-enter:canvas',
    ]);
  });

  test('onScopeChanged reports to/from on transition', () => {
    const { mgr } = setup();
    const changes: Array<[string | null, string | null]> = [];
    mgr.onScopeChanged((to, from) => changes.push([to, from]));
    mgr.enter('palette');
    mgr.enter('canvas');
    mgr.exit();
    expect(changes).toEqual([
      ['palette', null],
      ['canvas', 'palette'],
      [null, 'canvas'],
    ]);
  });

  test('onScopeChanged unsubscribe stops notifications', () => {
    const { mgr } = setup();
    const changes: unknown[] = [];
    const unsub = mgr.onScopeChanged(() => changes.push(1));
    mgr.enter('palette');
    unsub();
    mgr.enter('canvas');
    expect(changes).toHaveLength(1);
  });

  test('routeKey delegates to the active scope handler', () => {
    const mgr = createScopeManager();
    mgr.register(createScope('palette', { handleKey: e => e.keyCode === 37 }));
    mgr.register(createScope('canvas'));
    mgr.enter('palette');
    expect(mgr.routeKey(key(37))).toBe(true);
    expect(mgr.routeKey(key(38))).toBe(false);
  });

  test('routeKey returns false when no scope active', () => {
    const { mgr } = setup();
    expect(mgr.routeKey(key(37))).toBe(false);
  });
});
