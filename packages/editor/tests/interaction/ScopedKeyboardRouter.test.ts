import { routeKeyEvent } from '../../src/interaction/ScopedKeyboardRouter';
import { createScopeState } from '../../src/interaction/ScopeManager';
import { INITIAL_PALETTE_NAV } from '../../src/interaction/PaletteNavigationState';

function key(
  keyCode: number,
  opts: Partial<{ shiftKey: boolean; ctrlKey: boolean; metaKey: boolean; key: string }> = {},
) {
  return {
    keyCode,
    key:      opts.key      ?? '',
    shiftKey: opts.shiftKey ?? false,
    ctrlKey:  opts.ctrlKey  ?? false,
    metaKey:  opts.metaKey  ?? false,
  };
}

const canvasScope  = createScopeState('canvas');
const paletteScope = createScopeState('palette');
const nav          = INITIAL_PALETTE_NAV;

describe('scope-switch shortcut (F6 = keyCode 117)', () => {
  test('fires in canvas scope', () => {
    expect(routeKeyEvent(key(117), canvasScope, nav)).toEqual({ type: 'toggleScope' });
  });

  test('fires in palette scope', () => {
    expect(routeKeyEvent(key(117), paletteScope, nav)).toEqual({ type: 'toggleScope' });
  });
});

describe('palette scope: arrow keys', () => {
  test('left  → paletteNavigate left',  () => expect(routeKeyEvent(key(37), paletteScope, nav)).toEqual({ type: 'paletteNavigate', direction: 'left'  }));
  test('right → paletteNavigate right', () => expect(routeKeyEvent(key(39), paletteScope, nav)).toEqual({ type: 'paletteNavigate', direction: 'right' }));
  test('up    → paletteNavigate up',    () => expect(routeKeyEvent(key(38), paletteScope, nav)).toEqual({ type: 'paletteNavigate', direction: 'up'    }));
  test('down  → paletteNavigate down',  () => expect(routeKeyEvent(key(40), paletteScope, nav)).toEqual({ type: 'paletteNavigate', direction: 'down'  }));
});

describe('palette scope: Enter', () => {
  test('plain Enter → paletteAdd', () => {
    expect(routeKeyEvent(key(13), paletteScope, nav)).toEqual({ type: 'paletteAdd' });
  });

  test('Ctrl+Enter → paletteExpand', () => {
    expect(routeKeyEvent(key(13, { ctrlKey: true }), paletteScope, nav)).toEqual({ type: 'paletteExpand' });
  });

  test('Cmd+Enter → paletteExpand', () => {
    expect(routeKeyEvent(key(13, { metaKey: true }), paletteScope, nav)).toEqual({ type: 'paletteExpand' });
  });
});

describe('palette scope: Escape', () => {
  test('at level 0 → toggleScope (exit to canvas)', () => {
    expect(routeKeyEvent(key(27), paletteScope, { ...nav, level: 0 })).toEqual({ type: 'toggleScope' });
  });

  test('at level 1 → paletteBack', () => {
    const l1Nav = { ...nav, level: 1 as const, selectedGroup: 'S10000' };
    expect(routeKeyEvent(key(27), paletteScope, l1Nav)).toEqual({ type: 'paletteBack' });
  });

  test('at level 2 → paletteBack', () => {
    const l2Nav = { ...nav, level: 2 as const, selectedGroup: 'S10000', selectedBase: 'S10000' };
    expect(routeKeyEvent(key(27), paletteScope, l2Nav)).toEqual({ type: 'paletteBack' });
  });
});

describe('palette scope: other keys return none', () => {
  test('Tab → none', () => {
    expect(routeKeyEvent(key(9), paletteScope, nav)).toEqual({ type: 'none' });
  });

  test('random key → none', () => {
    expect(routeKeyEvent(key(65), paletteScope, nav)).toEqual({ type: 'none' });
  });
});

describe('canvas scope: delegates to KeyboardBindings', () => {
  test('left arrow → canvasAction moveLeft', () => {
    expect(routeKeyEvent(key(37), canvasScope, nav)).toEqual({ type: 'canvasAction', action: 'moveLeft' });
  });

  test('Escape → canvasAction selectNone', () => {
    expect(routeKeyEvent(key(27), canvasScope, nav)).toEqual({ type: 'canvasAction', action: 'selectNone' });
  });

  test('Tab → canvasAction selectNext', () => {
    expect(routeKeyEvent(key(9), canvasScope, nav)).toEqual({ type: 'canvasAction', action: 'selectNext' });
  });

  test('Ctrl+Z → canvasAction undo', () => {
    expect(routeKeyEvent(key(90, { ctrlKey: true }), canvasScope, nav)).toEqual({ type: 'canvasAction', action: 'undo' });
  });

  test('unmapped key → none', () => {
    expect(routeKeyEvent(key(65), canvasScope, nav)).toEqual({ type: 'none' });
  });
});

describe('custom scopeSwitchBinding', () => {
  test('uses custom binding', () => {
    const custom = { keyCode: 112 }; // F1
    const result = routeKeyEvent(key(112), canvasScope, nav, { scopeSwitchBinding: custom });
    expect(result).toEqual({ type: 'toggleScope' });
  });

  test('default F6 no longer fires when overridden', () => {
    const custom = { keyCode: 112 };
    const result = routeKeyEvent(key(117), canvasScope, nav, { scopeSwitchBinding: custom });
    expect(result).toEqual({ type: 'none' });
  });
});
