import { createScopeState, toggleScope, enterScope } from '../../src/interaction/ScopeManager';

describe('createScopeState', () => {
  test('defaults to canvas', () => {
    expect(createScopeState().activeScope).toBe('canvas');
  });

  test('accepts custom initial scope', () => {
    expect(createScopeState('palette').activeScope).toBe('palette');
  });
});

describe('toggleScope', () => {
  test('canvas → palette', () => {
    expect(toggleScope(createScopeState('canvas')).activeScope).toBe('palette');
  });

  test('palette → canvas', () => {
    expect(toggleScope(createScopeState('palette')).activeScope).toBe('canvas');
  });
});

describe('enterScope', () => {
  test('sets the requested scope', () => {
    expect(enterScope(createScopeState('canvas'), 'palette').activeScope).toBe('palette');
  });

  test('returns same reference when already in that scope', () => {
    const state = createScopeState('canvas');
    expect(enterScope(state, 'canvas')).toBe(state);
  });
});
