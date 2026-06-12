import { stateFromFsw, stateToFsw, stateToNormalizedFsw } from '../src/FSWBridge';
import { EMPTY_STATE } from '../src/types';
import type { SizeProvider } from '@signwriter/layout';

let counter = 0;
const idGen = () => `id${++counter}`;
beforeEach(() => { counter = 0; });

// Mock SizeProvider: every symbol is 30×30
const mockSizeProvider: SizeProvider = { getSize: () => ({ width: 30, height: 30 }) };

// ── stateFromFsw ──────────────────────────────────────────────────────────────

describe('stateFromFsw()', () => {
  test('parses symbols from FSW string', () => {
    const state = stateFromFsw('M518x529S14c20481x471S27106503x489', idGen);
    expect(state.symbols).toHaveLength(2);
  });

  test('parses symbol keys correctly', () => {
    const state = stateFromFsw('M518x529S14c20481x471S27106503x489', idGen);
    expect(state.symbols[0].key).toBe('S14c20');
    expect(state.symbols[1].key).toBe('S27106');
  });

  test('parses symbol coordinates correctly', () => {
    const state = stateFromFsw('M518x529S14c20481x471S27106503x489', idGen);
    expect(state.symbols[0].x).toBe(481);
    expect(state.symbols[0].y).toBe(471);
    expect(state.symbols[1].x).toBe(503);
    expect(state.symbols[1].y).toBe(489);
  });

  test('parses sort prefix', () => {
    const state = stateFromFsw('AS14c20S27106M518x529S14c20481x471S27106503x489', idGen);
    expect(state.sort).toHaveLength(2);
    expect(state.sort[0]).toBe('S14c20');
    expect(state.sort[1]).toBe('S27106');
  });

  test('empty sort when no A prefix', () => {
    const state = stateFromFsw('M518x529S14c20481x471', idGen);
    expect(state.sort).toHaveLength(0);
  });

  test('assigns unique IDs to symbols', () => {
    const state = stateFromFsw('M518x529S14c20481x471S27106503x489', idGen);
    expect(state.symbols[0].id).not.toBe(state.symbols[1].id);
    expect(state.symbols[0].id.length).toBeGreaterThan(0);
  });

  test('returns EMPTY_STATE for empty string', () => {
    const state = stateFromFsw('', idGen);
    expect(state.symbols).toHaveLength(0);
    expect(state.sort).toHaveLength(0);
  });

  test('clears selection (all symbols start unselected)', () => {
    const state = stateFromFsw('M518x529S14c20481x471S27106503x489', idGen);
    expect(state.selection.size).toBe(0);
  });
});

// ── stateToFsw ────────────────────────────────────────────────────────────────

describe('stateToFsw()', () => {
  test('generates FSW string from state', () => {
    const state = stateFromFsw('M518x529S14c20481x471S27106503x489', idGen);
    const fsw = stateToFsw(state);
    expect(fsw).toContain('S14c20');
    expect(fsw).toContain('S27106');
  });

  test('preserves symbol coordinates', () => {
    const state = stateFromFsw('M518x529S14c20481x471S27106503x489', idGen);
    const fsw = stateToFsw(state);
    expect(fsw).toContain('481x471');
    expect(fsw).toContain('503x489');
  });

  test('includes sort prefix when sort is non-empty', () => {
    const state = stateFromFsw('AS14c20S27106M518x529S14c20481x471S27106503x489', idGen);
    const fsw = stateToFsw(state);
    expect(fsw.startsWith('A')).toBe(true);
  });

  test('no sort prefix when sort is empty', () => {
    const state = stateFromFsw('M518x529S14c20481x471', idGen);
    const fsw = stateToFsw(state);
    expect(fsw.startsWith('A')).toBe(false);
  });

  test('round-trips through stateFromFsw', () => {
    const state = stateFromFsw('M518x529S14c20481x471S27106503x489', idGen);
    const fsw = stateToFsw(state);
    const state2 = stateFromFsw(fsw, idGen);
    expect(state2.symbols[0].key).toBe(state.symbols[0].key);
    expect(state2.symbols[0].x).toBe(state.symbols[0].x);
    expect(state2.symbols[0].y).toBe(state.symbols[0].y);
  });

  test('returns empty string for empty state', () => {
    expect(stateToFsw(EMPTY_STATE)).toBe('');
  });
});

// ── stateToNormalizedFsw ──────────────────────────────────────────────────────

describe('stateToNormalizedFsw()', () => {
  test('returns a non-empty FSW string for non-empty state', () => {
    const state = stateFromFsw('M518x529S14c20481x471S27106503x489', idGen);
    const fsw = stateToNormalizedFsw(state, mockSizeProvider);
    expect(typeof fsw).toBe('string');
    expect(fsw.length).toBeGreaterThan(0);
  });

  test('returns empty string for empty state', () => {
    expect(stateToNormalizedFsw(EMPTY_STATE, mockSizeProvider)).toBe('');
  });

  test('result is a valid FSW string (contains box marker)', () => {
    const state = stateFromFsw('M518x529S14c20481x471S27106503x489', idGen);
    const fsw = stateToNormalizedFsw(state, mockSizeProvider);
    expect(fsw).toMatch(/[BLMR]\d{3}x\d{3}/);
  });
});
