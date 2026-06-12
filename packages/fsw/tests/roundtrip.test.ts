/**
 * Round-trip tests: FSW → parseFsw → generateFsw → original FSW.
 *
 * These verify that the new pure functions are structurally equivalent to
 * the original signmaker behavior (Phase 1 test spec).
 */
import { parseFsw } from '../src/parse';
import { generateFsw } from '../src/generate';
import { fsw2swu, swu2fsw } from '../src/convert';

describe('parseFsw → generateFsw round-trip', () => {
  function roundTrip(fsw: string): string {
    const sign = parseFsw(fsw);
    if (!sign) return '';
    return generateFsw(sign);
  }

  test('preserves all symbol keys', () => {
    const input = 'AS14c20S27106M518x529S14c20481x471S27106503x489';
    const output = roundTrip(input);
    expect(output).toContain('S14c20481x471');
    expect(output).toContain('S27106503x489');
  });

  test('preserves sort prefix', () => {
    const input = 'AS14c20S27106M518x529S14c20481x471S27106503x489';
    expect(roundTrip(input)).toMatch(/^AS14c20S27106/);
  });

  test('preserves symbol count', () => {
    const input = 'M550x550S10000500x500S20000510x510S30000520x520';
    const output = roundTrip(input);
    const spatials = output.match(/S[123][0-9a-f]{2}[0-5][0-9a-f][0-9]{3}x[0-9]{3}/g) ?? [];
    expect(spatials).toHaveLength(3);
  });

  test('box coordinate is preserved (not recomputed by generate)', () => {
    const input = 'M518x529S14c20481x471';
    const output = roundTrip(input);
    expect(output).toContain('M518x529');
  });

  test('B box type is preserved through round-trip (unlike fswlive())', () => {
    // parseFsw preserves box type; generateFsw outputs it faithfully.
    // This differs from the original signmaker which always outputs M.
    const input = 'B500x500S14c20481x471';
    const output = roundTrip(input);
    expect(output).toMatch(/^B/);
  });

  test('coordinates with small values are zero-padded in output', () => {
    // generateFsw zero-pads to 3 digits (fixing the signmaker fswlive() bug).
    const input = 'M050x050S10000050x050';
    const output = roundTrip(input);
    expect(output).toContain('M050x050');
    expect(output).toContain('S10000050x050');
  });

  test('full round-trip matches input exactly', () => {
    const cases = [
      'M500x500',
      'M518x529S14c20481x471',
      'AS14c20S27106M518x529S14c20481x471S27106503x489',
    ];
    for (const input of cases) {
      expect(roundTrip(input)).toBe(input);
    }
  });
});

describe('FSW → SWU → FSW round-trip', () => {
  test('simple sign survives SWU round-trip', () => {
    const fsw = 'M518x529S14c20481x471';
    expect(swu2fsw(fsw2swu(fsw))).toBe(fsw);
  });

  test('sign with sort prefix survives SWU round-trip', () => {
    const fsw = 'AS14c20S27106M518x529S14c20481x471S27106503x489';
    expect(swu2fsw(fsw2swu(fsw))).toBe(fsw);
  });
});

describe('parseFsw + generateFsw vs. original signmaker behavior', () => {
  test('new parse+generate produces valid FSW output', () => {
    const sign = parseFsw('M518x529S14c20481x471S27106503x489')!;
    const out = generateFsw(sign);
    // Must be parseable again
    expect(parseFsw(out)).not.toBeNull();
  });

  test('IMPROVEMENT: coordinates below 100 are zero-padded in new generate', () => {
    // Original signmaker fswlive() does NOT zero-pad; this is a bug fix.
    const sign = parseFsw('M050x050S10000050x050')!;
    const out = generateFsw(sign);
    expect(out).toBe('M050x050S10000050x050');  // preserved, not truncated
  });

  test('IMPROVEMENT: box type preserved (original always lost B/L/R)', () => {
    const sign = parseFsw('B500x500S14c20481x471')!;
    expect(generateFsw(sign)).toMatch(/^B/);
  });
});
