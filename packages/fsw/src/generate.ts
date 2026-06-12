import { Sign } from './types';
import { pad3 } from './regex';

/**
 * Generate a FSW string from a Sign object.
 *
 * Coordinates are zero-padded to 3 digits (e.g. x=50 → "050"), correcting
 * the padding bug in the original signmaker fswlive() implementation.
 *
 * The box_x/box_y values from the Sign object are used directly.
 * If you need the box coordinate to reflect the actual bounding box of the
 * rendered symbols, compute it first via the layout engine (Phase 3) and
 * supply the updated Sign to this function.
 */
export function generateFsw(sign: Sign): string {
  let fsw = '';

  if (sign.sort.length > 0) {
    fsw += 'A' + sign.sort.join('');
  }

  fsw += sign.box + pad3(sign.box_x) + 'x' + pad3(sign.box_y);

  for (const sym of sign.symbols) {
    fsw += sym.key + pad3(sym.x) + 'x' + pad3(sym.y);
  }

  return fsw;
}

/**
 * Generate with the box coordinate replaced by a known max-extent value.
 * Convenience wrapper for the common case where the box_x/box_y have been
 * computed by the caller and the box type should always be 'M'.
 */
export function generateFswM(sign: Omit<Sign, 'box'>, box_x: number, box_y: number): string {
  return generateFsw({ ...sign, box: 'M', box_x, box_y });
}
