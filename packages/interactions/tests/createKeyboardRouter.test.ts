import { createKeyboardRouter } from '../src/createKeyboardRouter';
import { createScopeManager, createScope } from '@signwriter/editor';

function fireKeydown(
  el: EventTarget,
  keyCode: number,
  opts: { shiftKey?: boolean; ctrlKey?: boolean } = {},
): void {
  const ev = new KeyboardEvent('keydown', { bubbles: true, ...opts });
  Object.defineProperty(ev, 'keyCode', { value: keyCode });
  el.dispatchEvent(ev);
}

function fireKeydownWithTarget(
  el: EventTarget,
  keyCode: number,
  target: HTMLElement,
): void {
  const ev = new KeyboardEvent('keydown', { bubbles: true });
  Object.defineProperty(ev, 'keyCode', { value: keyCode });
  Object.defineProperty(ev, 'target', { value: target });
  el.dispatchEvent(ev);
}

describe('createKeyboardRouter()', () => {
  test('attach returns a detach function', () => {
    const sm = createScopeManager();
    const router = createKeyboardRouter({ scopeManager: sm });
    const el = document.createElement('div');
    const detach = router.attach(el);
    expect(typeof detach).toBe('function');
    detach();
  });

  test('F6 toggles from canvas to palette', () => {
    const sm = createScopeManager();
    sm.register(createScope('canvas'));
    sm.register(createScope('palette'));
    sm.enter('canvas');

    const router = createKeyboardRouter({ scopeManager: sm });
    const el = document.createElement('div');
    router.attach(el);

    fireKeydown(el, 117);
    expect(sm.currentScope()).toBe('palette');
  });

  test('F6 toggles from palette back to canvas', () => {
    const sm = createScopeManager();
    sm.register(createScope('canvas'));
    sm.register(createScope('palette'));
    sm.enter('palette');

    const router = createKeyboardRouter({ scopeManager: sm });
    const el = document.createElement('div');
    router.attach(el);

    fireKeydown(el, 117);
    expect(sm.currentScope()).toBe('canvas');
  });

  test('detach removes the listener', () => {
    const sm = createScopeManager();
    sm.register(createScope('canvas'));
    sm.register(createScope('palette'));
    sm.enter('canvas');

    const router = createKeyboardRouter({ scopeManager: sm });
    const el = document.createElement('div');
    const detach = router.attach(el);
    detach();

    fireKeydown(el, 117);
    expect(sm.currentScope()).toBe('canvas');
  });

  test('does not intercept keys typed in an INPUT', () => {
    const sm = createScopeManager();
    sm.register(createScope('canvas'));
    sm.register(createScope('palette'));
    sm.enter('canvas');

    const container = document.createElement('div');
    const input = document.createElement('input');
    container.appendChild(input);
    createKeyboardRouter({ scopeManager: sm }).attach(container);

    fireKeydownWithTarget(container, 117, input);
    expect(sm.currentScope()).toBe('canvas');
  });

  test('custom scopeSwitchBinding is respected', () => {
    const sm = createScopeManager();
    sm.register(createScope('canvas'));
    sm.register(createScope('palette'));
    sm.enter('canvas');

    const el = document.createElement('div');
    createKeyboardRouter({
      scopeManager: sm,
      scopeSwitchBinding: { keyCode: 9, shift: true },
    }).attach(el);

    // Default F6 should NOT switch.
    fireKeydown(el, 117);
    expect(sm.currentScope()).toBe('canvas');

    // Shift+Tab should switch.
    fireKeydown(el, 9, { shiftKey: true });
    expect(sm.currentScope()).toBe('palette');
  });

  test('scopeSwitchBinding: null disables scope switching', () => {
    const sm = createScopeManager();
    sm.register(createScope('canvas'));
    sm.register(createScope('palette'));
    sm.enter('canvas');

    const el = document.createElement('div');
    createKeyboardRouter({ scopeManager: sm, scopeSwitchBinding: null }).attach(el);

    fireKeydown(el, 117);
    expect(sm.currentScope()).toBe('canvas');
  });
});
