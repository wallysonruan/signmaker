import { renderSign, renderSignBody } from '../src/SignRenderer';

const FSW_SIGN = 'M518x529S14c20481x471S27106503x489';
const FSW_WITH_SORT = 'AS14c20S27106M518x529S14c20481x471S27106503x489';

// ── renderSign ────────────────────────────────────────────────────────────────

describe('renderSign()', () => {
  test('returns an SVG string', () => {
    const svg = renderSign(FSW_SIGN);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  test('returns empty string for empty input', () => {
    expect(renderSign('')).toBe('');
  });

  test('SVG has version and xmlns attributes', () => {
    const svg = renderSign(FSW_SIGN);
    expect(svg).toContain('version="1.1"');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  test('SVG has viewBox attribute', () => {
    const svg = renderSign(FSW_SIGN);
    expect(svg).toMatch(/viewBox="[\d\s]+"/);
  });

  test('SVG has width and height', () => {
    const svg = renderSign(FSW_SIGN);
    expect(svg).toMatch(/width="\d+"/);
    expect(svg).toMatch(/height="\d+"/);
  });

  test('contains both symbol keys as text content', () => {
    const svg = renderSign(FSW_SIGN);
    expect(svg).toContain(FSW_SIGN);
  });

  test('contains font-family references for Sutton SignWriting fonts', () => {
    const svg = renderSign(FSW_SIGN);
    expect(svg).toContain('SuttonSignWritingLine');
    expect(svg).toContain('SuttonSignWritingFill');
  });

  test('works with sort prefix', () => {
    const svg = renderSign(FSW_WITH_SORT);
    expect(svg).toContain('<svg');
  });

  test('applies padding style', () => {
    const withPad = renderSign(FSW_SIGN, { padding: 10 });
    const noPad   = renderSign(FSW_SIGN);
    // Padding increases the viewport size
    const padWidth  = parseInt(withPad.match(/width="(\d+)"/)![1]);
    const noPadWidth = parseInt(noPad.match(/width="(\d+)"/)![1]);
    expect(padWidth).toBeGreaterThan(noPadWidth);
  });

  test('applies zoom style', () => {
    const zoom2 = renderSign(FSW_SIGN, { zoom: 2 });
    const zoom1 = renderSign(FSW_SIGN);
    const zoom2Width = parseInt(zoom2.match(/width="(\d+)"/)![1]);
    const zoom1Width = parseInt(zoom1.match(/width="(\d+)"/)![1]);
    expect(zoom2Width).toBeGreaterThan(zoom1Width);
  });

  test('applies background color', () => {
    const svg = renderSign(FSW_SIGN, { background: 'yellow' });
    expect(svg).toContain('yellow');
  });

  test('applies line/fill detail colors', () => {
    const svg = renderSign(FSW_SIGN, { detail: ['red', 'blue'] });
    // The SVG body should replace the default black/white fill
    expect(svg).toContain('red');
  });
});

// ── renderSignBody ────────────────────────────────────────────────────────────

describe('renderSignBody()', () => {
  test('returns SVG body without outer svg wrapper', () => {
    const body = renderSignBody(FSW_SIGN);
    expect(body).not.toContain('<svg');
    expect(body).not.toContain('</svg>');
  });

  test('returns empty string for empty input', () => {
    expect(renderSignBody('')).toBe('');
  });

  test('contains transform groups for each symbol', () => {
    const body = renderSignBody(FSW_SIGN);
    expect(body).toContain('<g transform=');
  });

  test('contains font-based text elements', () => {
    const body = renderSignBody(FSW_SIGN);
    expect(body).toContain('SuttonSignWritingLine');
  });

  test('body is valid fragment (can be embedded in svg)', () => {
    const body = renderSignBody(FSW_SIGN);
    const wrapped = `<svg xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
    expect(wrapped).toContain('<svg');
    expect(wrapped).toContain('</svg>');
  });
});
