import type { Sign, SymbolPlacement } from '@signwriter/fsw';
import type { SizeProvider } from './types';
import { computeBoundingBox } from './BoundingBox';

/**
 * Normalize a sign by centering it around FSW coordinate (500, 500).
 *
 * Algorithm (equivalent to ssw.norm()):
 *   1. Compute the full bounding box of all symbols (position + size).
 *   2. Find the bounding box center: (minX+maxX)/2, (minY+maxY)/2
 *   3. Compute shift: shiftX = 500 - center_x, shiftY = 500 - center_y
 *   4. Apply shift to all symbol coordinates.
 *   5. Update box_x = maxX + shiftX, box_y = maxY + shiftY.
 *   6. Set box type to 'M' (normalized signs always use M).
 *
 * Returns the original sign unchanged if no bounding box can be computed
 * (empty symbol list or size provider returns null for all keys).
 */
export function normalizeFsw(sign: Sign, sizeProvider: SizeProvider): Sign {
  if (sign.symbols.length === 0) return sign;

  const bbox = computeBoundingBox(sign.symbols, sizeProvider);
  if (!bbox) return sign;

  const shiftX = Math.round(500 - bbox.centerX);
  const shiftY = Math.round(500 - bbox.centerY);

  if (shiftX === 0 && shiftY === 0) return sign;

  const symbols: SymbolPlacement[] = sign.symbols.map((s) => ({
    key: s.key,
    x:   s.x + shiftX,
    y:   s.y + shiftY,
  }));

  return {
    sort:    sign.sort,
    box:     'M',
    box_x:   Math.round(bbox.maxX + shiftX),
    box_y:   Math.round(bbox.maxY + shiftY),
    symbols,
  };
}

/**
 * Recompute the box coordinate (maxX, maxY) for a sign's FSW M marker.
 *
 * This is the pure equivalent of the fswlive() bbox recalculation:
 *   bbox = ssw.bbox(ssw.max(fsw)).split(' ')
 *   fsw  = fsw.replace("M500x500", "M" + bbox[1] + "x" + bbox[3])
 *
 * Returns the sign with updated box_x/box_y, or the original sign if no
 * bounding box can be computed.
 */
export function recomputeBoxCoord(sign: Sign, sizeProvider: SizeProvider): Sign {
  if (sign.symbols.length === 0) return sign;

  const bbox = computeBoundingBox(sign.symbols, sizeProvider);
  if (!bbox) return sign;

  return {
    ...sign,
    box:   'M',
    box_x: Math.round(bbox.maxX),
    box_y: Math.round(bbox.maxY),
  };
}
