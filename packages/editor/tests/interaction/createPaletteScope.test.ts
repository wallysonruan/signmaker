import { createPaletteScope } from '../../src/interaction/createPaletteScope';
import type { PaletteScopeDeps } from '../../src/interaction/createPaletteScope';
import type { KeyEventDescriptor } from '../../src/interaction/ScopedKeyboardRouter';
import type { PaletteNavigationState } from '../../src/interaction/PaletteNavigationState';

const GROUPS = ['S100', 'S200', 'S300', 'S400'];
const BASES: Record<string, string[]> = { S100: ['S10000', 'S10100', 'S10200'] };

function deps(onAddSymbol = jest.fn()): PaletteScopeDeps & { onAddSymbol: jest.Mock } {
  return {
    onAddSymbol,
    itemsAt: (s: PaletteNavigationState) => {
      if (s.level === 'groups') return GROUPS;
      if (s.level === 'bases' && s.selectedGroup) return BASES[s.selectedGroup] ?? [];
      return [];
    },
    columnsAt: (s) => (s.level === 'variants' ? 8 : 4),
    itemCountAt: (s) => {
      if (s.level === 'variants') return 48;
      if (s.level === 'groups') return GROUPS.length;
      if (s.level === 'bases' && s.selectedGroup) return (BASES[s.selectedGroup] ?? []).length;
      return 0;
    },
  };
}

function key(k: string, mods: Partial<KeyEventDescriptor> = {}): KeyEventDescriptor {
  return { keyCode: 0, key: k, shiftKey: false, ctrlKey: false, metaKey: false, ...mods };
}

describe('createPaletteScope', () => {
  test('names the scope "palette" and starts at groups', () => {
    const p = createPaletteScope(deps());
    expect(p.scope.name).toBe('palette');
    expect(p.getNav().level).toBe('groups');
  });

  test('arrow keys navigate and are consumed', () => {
    const p = createPaletteScope(deps());
    expect(p.scope.handleKey(key('ArrowRight'))).toBe(true);
    expect(p.getNav().focusedIndex).toBe(1);
  });

  test('focusedKey resolves item at groups level', () => {
    const p = createPaletteScope(deps());
    p.scope.handleKey(key('ArrowRight'));
    expect(p.focusedKey()).toBe('S200');
  });

  test('plain Enter adds the focused symbol', () => {
    const onAdd = jest.fn();
    const p = createPaletteScope(deps(onAdd));
    expect(p.scope.handleKey(key('Enter'))).toBe(true);
    expect(onAdd).toHaveBeenCalledWith('S100');
  });

  test('Ctrl+Enter drills into a group', () => {
    const p = createPaletteScope(deps());
    p.scope.handleKey(key('Enter', { ctrlKey: true }));
    expect(p.getNav().level).toBe('bases');
    expect(p.getNav().selectedGroup).toBe('S100');
  });

  test('Cmd+Enter (meta) also expands', () => {
    const p = createPaletteScope(deps());
    p.scope.handleKey(key('Enter', { metaKey: true }));
    expect(p.getNav().level).toBe('bases');
  });

  test('expand at bases drills into variants', () => {
    const p = createPaletteScope(deps());
    p.expand(); // → bases
    p.expand(); // → variants
    expect(p.getNav().level).toBe('variants');
  });

  test('Ctrl+Enter at variants toggles the variant tab', () => {
    const p = createPaletteScope(deps());
    p.expand(); p.expand(); // → variants
    expect(p.getNav().variantTab).toBe('first');
    p.scope.handleKey(key('Enter', { ctrlKey: true }));
    expect(p.getNav().variantTab).toBe('second');
  });

  test('focusedKey at variants level uses the FSW computation', () => {
    const p = createPaletteScope(deps());
    p.expand(); p.expand(); // → variants on S100
    expect(p.focusedKey()).toBe('S10000');
  });

  test('Escape backs out a level and is consumed', () => {
    const p = createPaletteScope(deps());
    p.expand(); // → bases
    expect(p.scope.handleKey(key('Escape'))).toBe(true);
    expect(p.getNav().level).toBe('groups');
  });

  test('Escape at groups level is NOT consumed (bubbles to scope switch)', () => {
    const p = createPaletteScope(deps());
    expect(p.scope.handleKey(key('Escape'))).toBe(false);
    expect(p.getNav().level).toBe('groups');
  });

  test('F6 is not consumed', () => {
    const p = createPaletteScope(deps());
    expect(p.scope.handleKey(key('F6'))).toBe(false);
    expect(p.scope.handleKey(key('', { keyCode: 117 }))).toBe(false);
  });

  test('unhandled keys return false', () => {
    const p = createPaletteScope(deps());
    expect(p.scope.handleKey(key('a'))).toBe(false);
  });

  test('onNavChanged fires with the new state', () => {
    const p = createPaletteScope(deps());
    const states: string[] = [];
    p.onNavChanged((s) => states.push(s.level));
    p.expand();
    expect(states).toEqual(['bases']);
  });

  test('setNav replaces state and notifies', () => {
    const p = createPaletteScope(deps());
    const seen: PaletteNavigationState[] = [];
    p.onNavChanged((s) => seen.push(s));
    const next = { ...p.getNav(), focusedIndex: 2 };
    p.setNav(next);
    expect(p.getNav()).toBe(next);
    expect(seen).toHaveLength(1);
  });
});
