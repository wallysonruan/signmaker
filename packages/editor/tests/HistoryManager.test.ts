import {
  createDefaultHistory,
  createMementoCommand,
} from '../src/HistoryManager';
import type { ReversibleCommand } from '../src/HistoryManager';
import { EMPTY_STATE } from '../src/types';
import type { EditorState, Command } from '../src/types';

// Inline transforms — avoid commands/symbols.ts (depends on @signwriter/fsw)
const setEntry = (entry: string): Command => (s) => ({ ...s, entry });
const noop: Command = (s) => s;

function cmd(name: string, transform: Command): ReversibleCommand {
  return createMementoCommand(name, transform);
}

describe('createMementoCommand', () => {
  test('execute applies the transform', () => {
    const c = cmd('set-entry', setEntry('hello'));
    expect(c.execute(EMPTY_STATE).entry).toBe('hello');
  });

  test('undo restores the captured pre-execute state', () => {
    const c = cmd('set-entry', setEntry('hello'));
    const before: EditorState = { ...EMPTY_STATE, entry: 'original' };
    const after = c.execute(before);
    expect(after.entry).toBe('hello');
    expect(c.undo(after)).toBe(before); // exact reference restored
  });

  test('carries its name', () => {
    expect(cmd('add-symbol', noop).name).toBe('add-symbol');
  });
});

describe('createDefaultHistory', () => {
  test('current() returns the initial state', () => {
    const h = createDefaultHistory(EMPTY_STATE);
    expect(h.current()).toBe(EMPTY_STATE);
  });

  test('push executes the command and advances current', () => {
    const h = createDefaultHistory(EMPTY_STATE);
    h.push(cmd('set-entry', setEntry('a')));
    expect(h.current().entry).toBe('a');
    expect(h.canUndo()).toBe(true);
    expect(h.canRedo()).toBe(false);
  });

  test('no-op commands are not recorded', () => {
    const h = createDefaultHistory(EMPTY_STATE);
    h.push(cmd('noop', noop));
    expect(h.canUndo()).toBe(false);
    expect(h.current()).toBe(EMPTY_STATE);
  });

  test('undo reverts to the prior state', () => {
    const h = createDefaultHistory(EMPTY_STATE);
    h.push(cmd('set-entry', setEntry('a')));
    h.undo();
    expect(h.current()).toBe(EMPTY_STATE);
    expect(h.canUndo()).toBe(false);
    expect(h.canRedo()).toBe(true);
  });

  test('redo re-applies after undo', () => {
    const h = createDefaultHistory(EMPTY_STATE);
    h.push(cmd('set-entry', setEntry('a')));
    h.undo();
    h.redo();
    expect(h.current().entry).toBe('a');
    expect(h.canRedo()).toBe(false);
  });

  test('multi-step undo/redo preserves order', () => {
    const h = createDefaultHistory(EMPTY_STATE);
    h.push(cmd('set-entry', setEntry('a')));
    h.push(cmd('set-entry', setEntry('b')));
    h.push(cmd('set-entry', setEntry('c')));
    expect(h.current().entry).toBe('c');
    h.undo(); expect(h.current().entry).toBe('b');
    h.undo(); expect(h.current().entry).toBe('a');
    h.redo(); expect(h.current().entry).toBe('b');
  });

  test('a new push after undo truncates the redo stack', () => {
    const h = createDefaultHistory(EMPTY_STATE);
    h.push(cmd('set-entry', setEntry('a')));
    h.push(cmd('set-entry', setEntry('b')));
    h.undo(); // back to 'a'
    h.push(cmd('set-entry', setEntry('c')));
    expect(h.current().entry).toBe('c');
    expect(h.canRedo()).toBe(false);
  });

  test('undo at the beginning is a no-op', () => {
    const h = createDefaultHistory(EMPTY_STATE);
    h.undo();
    expect(h.current()).toBe(EMPTY_STATE);
  });

  test('redo at the end is a no-op', () => {
    const h = createDefaultHistory(EMPTY_STATE);
    h.push(cmd('set-entry', setEntry('a')));
    h.redo();
    expect(h.current().entry).toBe('a');
  });

  test('replace sets state without recording history', () => {
    const h = createDefaultHistory(EMPTY_STATE);
    h.push(cmd('set-entry', setEntry('a')));
    h.replace({ ...EMPTY_STATE, entry: 'loaded' });
    expect(h.current().entry).toBe('loaded');
    expect(h.canUndo()).toBe(true); // unchanged depth
  });

  test('clear drops past and future but keeps current', () => {
    const h = createDefaultHistory(EMPTY_STATE);
    h.push(cmd('set-entry', setEntry('a')));
    h.clear();
    expect(h.current().entry).toBe('a');
    expect(h.canUndo()).toBe(false);
    expect(h.canRedo()).toBe(false);
  });
});

describe('HistoryPort lifecycle hooks', () => {
  test('onPush / beforePush / afterPush fire in order with the command', () => {
    const h = createDefaultHistory(EMPTY_STATE);
    const order: string[] = [];
    const c = cmd('set-entry', setEntry('a'));
    h.beforePush(cc => order.push(`before:${cc.name}`));
    h.afterPush(cc  => order.push(`after:${cc.name}`));
    h.onPush(cc     => order.push(`on:${cc.name}`));
    h.push(c);
    expect(order).toEqual(['before:set-entry', 'after:set-entry', 'on:set-entry']);
  });

  test('beforePush sees prior state, afterPush sees new state', () => {
    const h = createDefaultHistory(EMPTY_STATE);
    const seen: string[] = [];
    h.beforePush(() => seen.push(`before:${h.current().entry}`));
    h.afterPush(()  => seen.push(`after:${h.current().entry}`));
    h.push(cmd('set-entry', setEntry('a')));
    expect(seen).toEqual(['before:', 'after:a']);
  });

  test('undo hooks fire with the undone command', () => {
    const h = createDefaultHistory(EMPTY_STATE);
    h.push(cmd('set-entry', setEntry('a')));
    const order: string[] = [];
    h.beforeUndo(c => order.push(`before:${c.name}`));
    h.afterUndo(c  => order.push(`after:${c.name}`));
    h.onUndo(c     => order.push(`on:${c.name}`));
    h.undo();
    expect(order).toEqual(['before:set-entry', 'after:set-entry', 'on:set-entry']);
  });

  test('redo hooks fire with the redone command', () => {
    const h = createDefaultHistory(EMPTY_STATE);
    h.push(cmd('set-entry', setEntry('a')));
    h.undo();
    const order: string[] = [];
    h.beforeRedo(c => order.push(`before:${c.name}`));
    h.afterRedo(c  => order.push(`after:${c.name}`));
    h.onRedo(c     => order.push(`on:${c.name}`));
    h.redo();
    expect(order).toEqual(['before:set-entry', 'after:set-entry', 'on:set-entry']);
  });

  test('onClear fires on clear', () => {
    const h = createDefaultHistory(EMPTY_STATE);
    const calls: number[] = [];
    h.onClear(() => calls.push(1));
    h.clear();
    expect(calls).toEqual([1]);
  });

  test('no-op push fires no hooks', () => {
    const h = createDefaultHistory(EMPTY_STATE);
    const calls: string[] = [];
    h.beforePush(() => calls.push('before'));
    h.onPush(() => calls.push('on'));
    h.push(cmd('noop', noop));
    expect(calls).toHaveLength(0);
  });

  test('hook unsubscribe stops notifications', () => {
    const h = createDefaultHistory(EMPTY_STATE);
    const calls: number[] = [];
    const unsub = h.onPush(() => calls.push(1));
    h.push(cmd('set-entry', setEntry('a')));
    unsub();
    h.push(cmd('set-entry', setEntry('b')));
    expect(calls).toHaveLength(1);
  });
});
