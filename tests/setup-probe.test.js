// Probe test: verifies the setup.js loaded all expected globals correctly.
describe('test environment setup', () => {
  test('ssw is loaded with expected functions', () => {
    expect(typeof ssw).toBe('object');
    expect(typeof ssw.sign).toBe('function');
    expect(typeof ssw.bbox).toBe('function');
    expect(typeof ssw.norm).toBe('function');
    expect(typeof ssw.rotate).toBe('function');
    expect(typeof ssw.mirror).toBe('function');
    expect(typeof ssw.fill).toBe('function');
    expect(typeof ssw.scroll).toBe('function');
    expect(typeof ssw.fsw2swu).toBe('function');
    expect(typeof ssw.swu2fsw).toBe('function');
  });

  test('ssw.size returns "30x30" stub string', () => {
    expect(ssw.size('S14c20')).toBe('30x30');
    expect(ssw.size('')).toBeNull();
  });

  test('m.prop creates getter/setter', () => {
    const p = m.prop(42);
    expect(p()).toBe(42);
    p(99);
    expect(p()).toBe(99);
  });

  test('signmaker.vm is defined with core methods', () => {
    expect(typeof signmaker).toBe('object');
    expect(typeof signmaker.vm).toBe('object');
    expect(typeof signmaker.vm.fsw).toBe('function');
    expect(typeof signmaker.vm.fswlive).toBe('function');
    expect(typeof signmaker.vm.add).toBe('function');
    expect(typeof signmaker.vm.delete).toBe('function');
    expect(typeof signmaker.vm.move).toBe('function');
    expect(typeof signmaker.vm.undo).toBe('function');
    expect(typeof signmaker.vm.redo).toBe('function');
  });

  test('spatials.Symbol is defined', () => {
    expect(typeof spatials).toBe('object');
    expect(typeof spatials.Symbol).toBe('function');
  });

  test('keyboard config is loaded', () => {
    expect(typeof keyboard).toBe('object');
    expect(Array.isArray(keyboard.left)).toBe(true);
    expect(keyboard.left[0]).toBe(37); // left arrow key code
  });

  test('defmessages is loaded', () => {
    expect(typeof defmessages).toBe('object');
  });

  test('alphabet is loaded with symbol groups', () => {
    // Alphabet can be accessed via window.alphabet (set by config/alphabet.js)
    // or via global.alphabet (explicitly set in setup.js)
    const alpha = typeof alphabet !== 'undefined' ? alphabet
                : typeof window !== 'undefined' ? window.alphabet
                : global.alphabet;
    expect(typeof alpha).toBe('object');
    const groups = Object.keys(alpha);
    expect(groups.length).toBeGreaterThan(10);
    expect(Array.isArray(alpha[groups[0]])).toBe(true);
  });

  test('resetEditor clears state', () => {
    signmaker.vm.add({ key: 'S14c20', x: 500, y: 500 });
    resetEditor();
    expect(signmaker.vm.list.length).toBe(0);
    expect(signmaker.vm.sort.length).toBe(0);
    expect(signmaker.vm.cursor).toBe(0);
  });
});
