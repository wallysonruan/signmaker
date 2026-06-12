import { isValidSign, isValidSymbolKey } from '../src/validate';

describe('isValidSign()', () => {
  test('accepts valid M-box sign', () => {
    expect(isValidSign('M500x500S14c20481x471')).toBe(true);
  });

  test('accepts sign with A-prefix', () => {
    expect(isValidSign('AS14c20S27106M518x529S14c20481x471S27106503x489')).toBe(true);
  });

  test('accepts sign with B box', () => {
    expect(isValidSign('B500x500S14c20481x471')).toBe(true);
  });

  test('accepts sign with L box', () => {
    expect(isValidSign('L500x500S14c20481x471')).toBe(true);
  });

  test('accepts sign with R box', () => {
    expect(isValidSign('R500x500S14c20481x471')).toBe(true);
  });

  test('accepts minimal sign (box only, no symbols)', () => {
    expect(isValidSign('M500x500')).toBe(true);
  });

  test('rejects empty string', () => {
    expect(isValidSign('')).toBe(false);
  });

  test('rejects symbol key alone', () => {
    expect(isValidSign('S14c20')).toBe(false);
  });

  test('rejects spatial alone', () => {
    expect(isValidSign('S14c20481x471')).toBe(false);
  });

  test('rejects plain text', () => {
    expect(isValidSign('hello')).toBe(false);
  });

  test('rejects sign with invalid box letter', () => {
    expect(isValidSign('X500x500S14c20481x471')).toBe(false);
  });

  test('rejects sign with 2-digit coordinates', () => {
    expect(isValidSign('M50x50S14c2050x50')).toBe(false);
  });
});

describe('isValidSymbolKey()', () => {
  test('accepts valid 6-char symbol key', () => {
    expect(isValidSymbolKey('S14c20')).toBe(true);
    expect(isValidSymbolKey('S27106')).toBe(true);
    expect(isValidSymbolKey('S10000')).toBe(true);
    expect(isValidSymbolKey('S3ff5f')).toBe(true);
  });

  test('rejects wrong length', () => {
    expect(isValidSymbolKey('S14c2')).toBe(false);
    expect(isValidSymbolKey('S14c200')).toBe(false);
  });

  test('rejects invalid plane (0 or 4)', () => {
    expect(isValidSymbolKey('S04c20')).toBe(false);
    expect(isValidSymbolKey('S44c20')).toBe(false);
  });

  test('rejects invalid fill (6+)', () => {
    expect(isValidSymbolKey('S14c60')).toBe(false);
    expect(isValidSymbolKey('S14c90')).toBe(false);
  });

  test('rejects keys not starting with S', () => {
    expect(isValidSymbolKey('A14c20')).toBe(false);
  });
});
