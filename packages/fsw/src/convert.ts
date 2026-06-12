import { fsw2swu as _fsw2swu, swu2fsw as _swu2fsw } from '@sutton-signwriting/core/convert';

/** Convert a FSW string to its SWU (SignWriting Unicode) equivalent. */
export function fsw2swu(fsw: string): string {
  if (!fsw) return '';
  return _fsw2swu(fsw) ?? '';
}

/** Convert a SWU string back to FSW. */
export function swu2fsw(swu: string): string {
  if (!swu) return '';
  return _swu2fsw(swu) ?? '';
}
