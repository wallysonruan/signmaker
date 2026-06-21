import { createFocusManager } from '../../src/interaction/createFocusManager';

describe('createFocusManager', () => {
  test('focusScope returns false when no target registered', () => {
    const fm = createFocusManager();
    expect(fm.focusScope('canvas')).toBe(false);
  });

  test('register + focusScope invokes a callback target', () => {
    const fm = createFocusManager();
    const fn = jest.fn();
    fm.register('canvas', fn);
    expect(fm.focusScope('canvas')).toBe(true);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('register accepts an object with a focus() method', () => {
    const fm = createFocusManager();
    const target = { focus: jest.fn() };
    fm.register('palette', target);
    fm.focusScope('palette');
    expect(target.focus).toHaveBeenCalledTimes(1);
  });

  test('hasTarget reflects registration state', () => {
    const fm = createFocusManager();
    expect(fm.hasTarget('canvas')).toBe(false);
    fm.register('canvas', () => {});
    expect(fm.hasTarget('canvas')).toBe(true);
  });

  test('re-registering replaces the previous target', () => {
    const fm = createFocusManager();
    const first = jest.fn();
    const second = jest.fn();
    fm.register('canvas', first);
    fm.register('canvas', second);
    fm.focusScope('canvas');
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  test('unsubscribe removes the target', () => {
    const fm = createFocusManager();
    const fn = jest.fn();
    const unsub = fm.register('canvas', fn);
    unsub();
    expect(fm.hasTarget('canvas')).toBe(false);
    expect(fm.focusScope('canvas')).toBe(false);
  });

  test('stale unsubscribe does not remove a newer target', () => {
    const fm = createFocusManager();
    const first = jest.fn();
    const second = jest.fn();
    const unsubFirst = fm.register('canvas', first);
    fm.register('canvas', second); // replaces first
    unsubFirst();                  // should be a no-op now
    expect(fm.hasTarget('canvas')).toBe(true);
    fm.focusScope('canvas');
    expect(second).toHaveBeenCalledTimes(1);
  });

  test('targets are independent per scope name', () => {
    const fm = createFocusManager();
    const canvas = jest.fn();
    const palette = jest.fn();
    fm.register('canvas', canvas);
    fm.register('palette', palette);
    fm.focusScope('palette');
    expect(palette).toHaveBeenCalledTimes(1);
    expect(canvas).not.toHaveBeenCalled();
  });
});
