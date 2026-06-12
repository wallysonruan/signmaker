import { renderSymbol, renderSymbolBody } from '../src/SymbolRenderer';

const KEY = 'S14c20';
const X = 500;
const Y = 500;

// ── renderSymbol ──────────────────────────────────────────────────────────────

describe('renderSymbol()', () => {
  test('returns an SVG string', () => {
    const svg = renderSymbol(KEY, X, Y);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  test('SVG has version and xmlns attributes', () => {
    const svg = renderSymbol(KEY, X, Y);
    expect(svg).toContain('version="1.1"');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  test('SVG embeds the symbol spatial string as text', () => {
    const svg = renderSymbol(KEY, X, Y);
    expect(svg).toContain('S14c20500x500');
  });

  test('SVG contains font-based text elements', () => {
    const svg = renderSymbol(KEY, X, Y);
    expect(svg).toContain('SuttonSignWritingLine');
    expect(svg).toContain('SuttonSignWritingFill');
  });

  test('coordinate is embedded correctly (zero-padded)', () => {
    const svg = renderSymbol(KEY, 50, 75);
    expect(svg).toContain('S14c20050x075');
  });

  test('applies line color style', () => {
    const svg = renderSymbol(KEY, X, Y, { detail: ['red', 'white'] });
    expect(svg).toContain('red');
  });

  test('applies colorize flag', () => {
    const svg = renderSymbol(KEY, X, Y, { colorize: true });
    // Colorize adds 'C' to the style suffix
    expect(svg).toContain('C');
  });

  test('different symbol keys produce different SVG content', () => {
    const svg1 = renderSymbol('S14c20', X, Y);
    const svg2 = renderSymbol('S27106', X, Y);
    expect(svg1).not.toBe(svg2);
  });
});

// ── renderSymbolBody ──────────────────────────────────────────────────────────

describe('renderSymbolBody()', () => {
  test('returns SVG body without outer svg wrapper', () => {
    const body = renderSymbolBody(KEY, X, Y);
    expect(body).not.toContain('<svg');
    expect(body).not.toContain('</svg>');
  });

  test('contains transform group', () => {
    const body = renderSymbolBody(KEY, X, Y);
    expect(body).toContain('<g transform=');
  });

  test('contains font-based text elements', () => {
    const body = renderSymbolBody(KEY, X, Y);
    expect(body).toContain('SuttonSignWritingLine');
  });

  test('can be embedded in a parent SVG element', () => {
    const body = renderSymbolBody(KEY, X, Y);
    const wrapped = `<svg xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
    expect(wrapped).toContain('<svg');
    expect(wrapped).toContain('</svg>');
  });

  test('applies style options', () => {
    const body = renderSymbolBody(KEY, X, Y, { detail: ['navy', 'lightyellow'] });
    expect(body).toContain('navy');
  });
});
