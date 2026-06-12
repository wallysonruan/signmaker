import { fsw2swu as _fsw2swu, swu2fsw as _swu2fsw } from '@sutton-signwriting/core/convert';

/**
 * Convert a FSW string to its SWU (SignWriting Unicode) equivalent.
 *
 * SWU encodes the same structural information using Unicode characters in
 * private-use planes. Example: `"M518x529S14c20481x471"` → SWU form.
 *
 * Returns an empty string for empty or falsy input.
 */
export function fsw2swu(fsw: string): string {
  if (!fsw) return '';
  return _fsw2swu(fsw) ?? '';
}

/**
 * Convert a SWU string back to FSW.
 *
 * Inverse of `fsw2swu`. Converts Unicode SignWriting back to the ASCII FSW
 * representation used throughout this library.
 *
 * Returns an empty string for empty or falsy input.
 */
export function swu2fsw(swu: string): string {
  if (!swu) return '';
  return _swu2fsw(swu) ?? '';
}
