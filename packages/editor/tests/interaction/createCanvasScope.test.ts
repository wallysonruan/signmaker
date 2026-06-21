import { createCanvasScope } from '../../src/interaction/createCanvasScope';
import type { KeyEventDescriptor } from '../../src/interaction/ScopedKeyboardRouter';

function key(keyCode: number, mods: Partial<KeyEventDescriptor> = {}): KeyEventDescriptor {
  return { keyCode, key: '', shiftKey: false, ctrlKey: false, metaKey: false, ...mods };
}

describe('createCanvasScope', () => {
  test('names the scope "canvas"', () => {
    const scope = createCanvasScope({ dispatch: jest.fn(), onUndo: jest.fn(), onRedo: jest.fn() });
    expect(scope.name).toBe('canvas');
  });

  test('dispatches a command for a movement key and reports consumption', () => {
    const dispatch = jest.fn();
    const scope = createCanvasScope({ dispatch, onUndo: jest.fn(), onRedo: jest.fn() });
    const consumed = scope.handleKey(key(37)); // moveLeft
    expect(consumed).toBe(true);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  test('routes Ctrl+Z to onUndo (no dispatch)', () => {
    const dispatch = jest.fn();
    const onUndo = jest.fn();
    const scope = createCanvasScope({ dispatch, onUndo, onRedo: jest.fn() });
    const consumed = scope.handleKey(key(90, { ctrlKey: true }));
    expect(consumed).toBe(true);
    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(dispatch).not.toHaveBeenCalled();
  });

  test('routes Ctrl+Shift+Z to onRedo', () => {
    const onRedo = jest.fn();
    const scope = createCanvasScope({ dispatch: jest.fn(), onUndo: jest.fn(), onRedo });
    scope.handleKey(key(90, { ctrlKey: true, shiftKey: true }));
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  test('returns false for an unbound key', () => {
    const dispatch = jest.fn();
    const scope = createCanvasScope({ dispatch, onUndo: jest.fn(), onRedo: jest.fn() });
    expect(scope.handleKey(key(65))).toBe(false); // 'A' — unbound
    expect(dispatch).not.toHaveBeenCalled();
  });

  test('honours custom bindings', () => {
    const dispatch = jest.fn();
    const scope = createCanvasScope({
      dispatch, onUndo: jest.fn(), onRedo: jest.fn(),
      bindings: [[{ keyCode: 65 }, 'moveRight']],
    });
    expect(scope.handleKey(key(65))).toBe(true);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(scope.handleKey(key(37))).toBe(false); // default binding no longer present
  });
});
