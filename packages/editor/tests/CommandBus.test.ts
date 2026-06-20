import { createCommandBus } from '../src/CommandBus';
import type { CommandBusPort } from '../src/CommandBus';
import { EMPTY_STATE } from '../src/types';
import type { EditorState } from '../src/types';

// Inline helpers — avoid importing from commands/symbols.ts which depends on @signwriter/fsw
function withEntry(entry: string) {
  return (s: EditorState): EditorState => ({ ...s, entry });
}
function withTerms(terms: string[]) {
  return (s: EditorState): EditorState => ({ ...s, terms: [...terms, ...s.terms.slice(terms.length)] as EditorState['terms'] });
}

function setup(): { bus: CommandBusPort; getState: () => EditorState } {
  let state: EditorState = EMPTY_STATE;
  const bus = createCommandBus({
    apply(transform) {
      state = transform(state);
      return state;
    },
  });
  return { bus, getState: () => state };
}

describe('createCommandBus', () => {
  test('dispatch applies the transform and returns status:applied', () => {
    const { bus, getState } = setup();
    const result = bus.dispatch('set-entry', withEntry('hello'));
    expect(result.status).toBe('applied');
    if (result.status === 'applied') expect(result.state.entry).toBe('hello');
    expect(getState().entry).toBe('hello');
  });

  test('beforeCommand(*) fires before the transform is applied', () => {
    const { bus, getState } = setup();
    const order: string[] = [];
    bus.beforeCommand('*', () => { order.push(`before:${getState().entry}`); });
    bus.dispatch('set-entry', withEntry('hello'));
    expect(order).toEqual(['before:']); // entry is '' before apply
  });

  test('afterCommand(*) fires after the transform is applied', () => {
    const { bus, getState } = setup();
    const order: string[] = [];
    bus.afterCommand('*', () => { order.push(`after:${getState().entry}`); });
    bus.dispatch('set-entry', withEntry('hello'));
    expect(order).toEqual(['after:hello']); // entry is set after apply
  });

  test('hooks receive the command name and payload', () => {
    const { bus } = setup();
    const calls: Array<[string, unknown]> = [];
    bus.beforeCommand('*', (name, payload) => calls.push([name, payload]));
    bus.dispatch('set-entry', withEntry('hello'), { extra: 42 });
    expect(calls).toEqual([['set-entry', { extra: 42 }]]);
  });

  test('afterCommand receives the resulting state', () => {
    const { bus } = setup();
    let seen: EditorState | null = null;
    bus.afterCommand('*', (_name, state) => { seen = state; });
    bus.dispatch('set-entry', withEntry('world'));
    expect((seen as EditorState | null)?.entry).toBe('world');
  });

  test('named filter only fires for matching name', () => {
    const { bus } = setup();
    const hits: string[] = [];
    bus.beforeCommand('delete-selected', (name) => hits.push(name));
    bus.dispatch('set-entry', withEntry('hello'));
    expect(hits).toHaveLength(0);
    bus.dispatch('delete-selected', (s) => s);
    expect(hits).toEqual(['delete-selected']);
  });

  test('wildcard fires for every command name', () => {
    const { bus } = setup();
    const names: string[] = [];
    bus.afterCommand('*', (name) => names.push(name));
    bus.dispatch('set-entry', withEntry('a'));
    bus.dispatch('set-terms', withTerms(['b']));
    expect(names).toEqual(['set-entry', 'set-terms']);
  });

  test('wildcard fires for empty-string (anonymous) dispatch names too', () => {
    const { bus } = setup();
    const names: string[] = [];
    bus.afterCommand('*', (name) => names.push(name));
    bus.dispatch('', (s) => s);
    expect(names).toEqual(['']);
  });

  test('unsubscribe stops the hook from firing', () => {
    const { bus } = setup();
    const calls: string[] = [];
    const unsub = bus.beforeCommand('*', (name) => calls.push(name));
    bus.dispatch('set-entry', withEntry('a'));
    unsub();
    bus.dispatch('set-entry', withEntry('b'));
    expect(calls).toHaveLength(1); // only the first dispatch
  });

  test('intercept:cancel aborts apply and returns status:cancelled', () => {
    const { bus, getState } = setup();
    bus.intercept('set-entry', () => ({ action: 'cancel' }));
    const result = bus.dispatch('set-entry', withEntry('hello'));
    expect(result.status).toBe('cancelled');
    expect(getState().entry).toBe(''); // unchanged
  });

  test('intercept:cancel suppresses before/after hooks', () => {
    const { bus } = setup();
    const calls: string[] = [];
    bus.beforeCommand('*', () => calls.push('before'));
    bus.afterCommand('*', () => calls.push('after'));
    bus.intercept('set-entry', () => ({ action: 'cancel' }));
    bus.dispatch('set-entry', withEntry('hello'));
    expect(calls).toHaveLength(0);
  });

  test('intercept:handled skips apply and returns status:handled', () => {
    const { bus, getState } = setup();
    bus.intercept('set-entry', () => ({ action: 'handled' }));
    const result = bus.dispatch('set-entry', withEntry('hello'));
    expect(result.status).toBe('handled');
    expect(getState().entry).toBe(''); // unchanged — interceptor "handled" it externally
  });

  test('intercept:continue with modified transform applies the modified version', () => {
    const { bus, getState } = setup();
    bus.intercept('set-entry', (_name, transform) => ({
      action: 'continue',
      transform: (s) => ({ ...transform(s), entry: 'overridden' }),
    }));
    bus.dispatch('set-entry', withEntry('original'));
    expect(getState().entry).toBe('overridden');
  });

  test('intercept:continue without modified transform passes original through', () => {
    const { bus, getState } = setup();
    bus.intercept('set-entry', () => ({ action: 'continue' }));
    bus.dispatch('set-entry', withEntry('hello'));
    expect(getState().entry).toBe('hello'); // original applied
  });

  test('intercept only fires for its matching name', () => {
    const { bus, getState } = setup();
    bus.intercept('delete-selected', () => ({ action: 'cancel' }));
    bus.dispatch('set-entry', withEntry('hello'));
    expect(getState().entry).toBe('hello'); // not intercepted
  });

  test('first cancel interceptor wins; subsequent interceptors not called', () => {
    const { bus } = setup();
    const calls: string[] = [];
    bus.intercept('set-entry', () => { calls.push('first'); return { action: 'cancel' }; });
    bus.intercept('set-entry', () => { calls.push('second'); return { action: 'continue' }; });
    bus.dispatch('set-entry', withEntry('hello'));
    expect(calls).toEqual(['first']); // second never runs
  });

  test('multiple interceptors chain transforms in registration order', () => {
    const { bus, getState } = setup();
    // First interceptor wraps the transform to prefix entry
    bus.intercept('set-entry', (_n, t) => ({
      action: 'continue',
      transform: (s) => ({ ...t(s), entry: `[first]${t(s).entry}` }),
    }));
    // Second interceptor wraps the (already-wrapped) transform to suffix entry
    bus.intercept('set-entry', (_n, t) => ({
      action: 'continue',
      transform: (s) => ({ ...t(s), entry: `${t(s).entry}[second]` }),
    }));
    bus.dispatch('set-entry', withEntry('x'));
    // Second wraps first: second(first(original)) → first applied first, then second wraps
    expect(getState().entry).toMatch('[first]');
    expect(getState().entry).toMatch('[second]');
  });

  test('intercept unsubscribe stops it from running', () => {
    const { bus, getState } = setup();
    const unsub = bus.intercept('set-entry', () => ({ action: 'cancel' }));
    unsub();
    bus.dispatch('set-entry', withEntry('hello'));
    expect(getState().entry).toBe('hello'); // no longer cancelled
  });
});
