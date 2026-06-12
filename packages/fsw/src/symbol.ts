import { SymbolInfo } from './types';
import { SYMBOL_RE } from './regex';

/**
 * Decompose a 6-char FSW symbol key into its constituent fields.
 *
 * Key format: S [plane] [base_hi] [base_lo] [fill] [rotation]
 *   e.g. "S14c20" → plane=1, base="14c", fill=2, rotation=0
 *
 * Returns null for invalid keys.
 */
export function symbolInfo(key: string): SymbolInfo | null {
  if (!SYMBOL_RE.test(key)) return null;
  const plane    = parseInt(key[1], 10);
  const base     = key.slice(1, 4);
  const fill     = parseInt(key[4], 10);
  const rotation = parseInt(key[5], 16);
  return { plane, base, fill, rotation, mirrored: rotation >= 8 };
}

/**
 * Rotate a symbol by the given number of steps (positive = clockwise).
 * The rotation nibble (key[5]) cycles through 16 values (0x0–0xf).
 * A step of +1 or -1 increments/decrements by one position; wraps around.
 */
export function rotate(key: string, step: number): string {
  const rotation = parseInt(key[5], 16);
  const next = ((rotation + step) % 16 + 16) % 16;
  return key.slice(0, 5) + next.toString(16);
}

/**
 * Toggle the mirror flag for a symbol.
 * Rotations 0–7 are non-mirrored; 8–f are the mirrored counterparts.
 * mirror() XORs bit 3 of the rotation nibble (toggles between the two halves).
 */
export function mirror(key: string): string {
  const rotation = parseInt(key[5], 16);
  const next = rotation ^ 8;
  return key.slice(0, 5) + next.toString(16);
}

/**
 * Cycle the fill variant of a symbol.
 * Fill ranges from 0 to 5 (6 values); wraps around.
 * step=+1 advances, step=-1 retreats.
 */
export function fill(key: string, step: number): string {
  const current = parseInt(key[4], 10);
  const next = ((current + step) % 6 + 6) % 6;
  return key.slice(0, 4) + next + key[5];
}

/**
 * Cycle to the next/previous base symbol (variation) within the ISWA 2010
 * symbol sequence. The base is encoded in key[1..3] as a 3-char hex value
 * (plane + two hex digits). This function increments/decrements the full
 * 3-char numeric base by step.
 *
 * Note: This implementation matches the behavior of ssw.scroll() which
 * operates on the numeric base identifier. Symbol keys at the boundaries
 * of valid ranges (100–37f hex) may produce keys outside normal ISWA 2010
 * groups — the original library wraps within the full valid symbol range.
 */
export function variation(key: string, step: number): string {
  const baseHex = key.slice(1, 4);  // e.g. "14c"
  const baseNum = parseInt(baseHex, 16);
  // Valid base range: 0x100–0x37f (planes 1–3 with base 00–ff)
  const MIN_BASE = 0x100;
  const MAX_BASE = 0x37f;
  let next = baseNum + step;
  if (next < MIN_BASE) next = MAX_BASE;
  if (next > MAX_BASE) next = MIN_BASE;
  const nextHex = next.toString(16).padStart(3, '0');
  return 'S' + nextHex + key[4] + key[5];
}
