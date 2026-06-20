import { createSignMaker } from '../src/createSignMaker';
import { createDefaultHistory } from '../src/HistoryManager';
import { createScopeManager, createScope } from '../src/interaction/createScopeManager';
import { createFocusManager } from '../src/interaction/createFocusManager';
import { EMPTY_STATE } from '../src/types';
import type { Command } from '../src/types';

const setEntry = (entry: string): Command => (s) => ({ ...s, entry });
const noop: Command = (s) => s;

describe('createSignMaker', () => {
  test('wires default ports', () => {
    const sm = createSignMaker();
    expect(sm.history).toBeDefined();
    expect(sm.bus).toBeDefined();
    expect(sm.scopeManager).toBeDefined();
    expect(sm.focusManager).toBeDefined();
    expect(sm.getState()).toBe(EMPTY_STATE);
  });

  test('honours initialState', () => {
    const initial = { ...EMPTY_STATE, entry: 'seed' };
    const sm = createSignMaker({ initialState: initial });
    expect(sm.getState()).toBe(initial);
  });

  test('dispatch applies the transform and updates state', () => {
    const sm = createSignMaker();
    sm.dispatch('set-entry', setEntry('a'));
    expect(sm.getState().entry).toBe('a');
    expect(sm.canUndo()).toBe(true);
    expect(sm.canRedo()).toBe(false);
  });

  test('dispatch records a NAMED history entry', () => {
    const sm = createSignMaker();
    const names: string[] = [];
    sm.history.onPush((c) => names.push(c.name));
    sm.dispatch('add-symbol', setEntry('a'));
    expect(names).toEqual(['add-symbol']);
  });

  test('undo / redo travel through history', () => {
    const sm = createSignMaker();
    sm.dispatch('set-entry', setEntry('a'));
    sm.dispatch('set-entry', setEntry('b'));
    sm.undo();
    expect(sm.getState().entry).toBe('a');
    sm.redo();
    expect(sm.getState().entry).toBe('b');
  });

  test('replace sets state without recording history', () => {
    const sm = createSignMaker();
    sm.dispatch('set-entry', setEntry('a'));
    sm.replace({ ...EMPTY_STATE, entry: 'loaded' });
    expect(sm.getState().entry).toBe('loaded');
    expect(sm.canUndo()).toBe(true); // depth unchanged
  });

  test('no-op transforms are not recorded', () => {
    const sm = createSignMaker();
    sm.dispatch('noop', noop);
    expect(sm.canUndo()).toBe(false);
  });

  test('bus hooks observe dispatches', () => {
    const sm = createSignMaker();
    const seen: string[] = [];
    sm.bus.afterCommand('*', (name) => seen.push(name));
    sm.dispatch('set-entry', setEntry('a'));
    expect(seen).toEqual(['set-entry']);
  });

  test('uses an injected history port', () => {
    const history = createDefaultHistory(EMPTY_STATE);
    const sm = createSignMaker({ history });
    expect(sm.history).toBe(history);
    sm.dispatch('set-entry', setEntry('a'));
    expect(history.current().entry).toBe('a');
  });

  test('uses injected scope and focus managers', () => {
    const scopeManager = createScopeManager();
    const focusManager = createFocusManager();
    const sm = createSignMaker({ scopeManager, focusManager });
    expect(sm.scopeManager).toBe(scopeManager);
    expect(sm.focusManager).toBe(focusManager);
  });

  test('scope manager is functional through the facade', () => {
    const sm = createSignMaker();
    const entered: Array<string | null> = [];
    sm.scopeManager.register(createScope('canvas'));
    sm.scopeManager.onScopeChanged((to) => entered.push(to));
    sm.scopeManager.enter('canvas');
    expect(entered).toEqual(['canvas']);
  });
});
