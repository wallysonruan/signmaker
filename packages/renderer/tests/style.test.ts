import { buildSignStyleSuffix, buildSymbolStyleSuffix } from '../src/style';

describe('buildSignStyleSuffix()', () => {
  test('returns empty string for no style', () => {
    expect(buildSignStyleSuffix()).toBe('');
    expect(buildSignStyleSuffix(undefined)).toBe('');
  });

  test('returns empty string for empty style object', () => {
    expect(buildSignStyleSuffix({})).toBe('');
  });

  test('includes padding when provided', () => {
    const result = buildSignStyleSuffix({ padding: 10 });
    expect(result).toContain('P10');
    expect(result.startsWith('-')).toBe(true);
  });

  test('includes zoom when provided', () => {
    const result = buildSignStyleSuffix({ zoom: 2 });
    expect(result).toContain('Z2');
  });

  test('includes background when provided', () => {
    const result = buildSignStyleSuffix({ background: 'blue' });
    expect(result).toContain('blue');
  });

  test('includes colorize flag', () => {
    const result = buildSignStyleSuffix({ colorize: true });
    expect(result).toContain('C');
  });

  test('includes detail colors', () => {
    const result = buildSignStyleSuffix({ detail: ['red', 'white'] });
    expect(result).toContain('red');
    expect(result).toContain('white');
  });

  test('single detail color', () => {
    const result = buildSignStyleSuffix({ detail: ['black'] });
    expect(result).toContain('black');
  });

  test('combines multiple style options', () => {
    const result = buildSignStyleSuffix({ padding: 5, zoom: 1.5 });
    expect(result).toContain('P05');
    expect(result).toContain('Z1.5');
  });
});

describe('buildSymbolStyleSuffix()', () => {
  test('returns empty string for no style', () => {
    expect(buildSymbolStyleSuffix()).toBe('');
  });

  test('includes detail colors', () => {
    const result = buildSymbolStyleSuffix({ detail: ['#ff0000', '#ffffff'] });
    expect(result).toContain('ff0000');
  });

  test('colorize flag is forwarded', () => {
    const result = buildSymbolStyleSuffix({ colorize: true });
    expect(result).toContain('C');
  });
});
