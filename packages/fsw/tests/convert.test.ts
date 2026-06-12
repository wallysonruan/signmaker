import { fsw2swu, swu2fsw } from '../src/convert';

const FSW_SIGN = 'AS14c20S27106M518x529S14c20481x471S27106503x489';

describe('fsw2swu()', () => {
  test('converts FSW sign to non-empty SWU string', () => {
    const swu = fsw2swu(FSW_SIGN);
    expect(swu).toBeTruthy();
    expect(typeof swu).toBe('string');
  });

  test('returns empty string for empty input', () => {
    expect(fsw2swu('')).toBe('');
  });

  test('SWU output does not contain ASCII symbol keys', () => {
    const swu = fsw2swu('M500x500S14c20481x471');
    expect(swu).not.toContain('S14c20');
  });
});

describe('swu2fsw()', () => {
  test('converts SWU back to FSW (round-trip)', () => {
    const swu = fsw2swu(FSW_SIGN);
    const back = swu2fsw(swu);
    expect(back).toBe(FSW_SIGN);
  });

  test('returns empty string for empty input', () => {
    expect(swu2fsw('')).toBe('');
  });

  test('round-trip simple sign', () => {
    const fsw = 'M518x529S14c20481x471';
    expect(swu2fsw(fsw2swu(fsw))).toBe(fsw);
  });
});
