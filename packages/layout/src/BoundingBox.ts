import type { SymbolPlacement } from '@wallysonruan/signmaker-fsw-engine';
import type { BoundingBox, SizeProvider } from './types';

/**
 * Compute the axis-aligned bounding box for a set of FSW symbol placements.
 *
 * Each symbol's extent is:
 *   left   = x
 *   right  = x + symbol_width
 *   top    = y
 *   bottom = y + symbol_height
 *
 * where symbol_width/height come from the SizeProvider (font metrics or mock).
 * Returns null if the symbols array is empty or if no sizes are available.
 *
 * This is the pure equivalent of `ssw.bbox(ssw.max(fsw))` from the original
 * SuttonSignWriting library — decoupled from DOM/font loading.
 */
export function computeBoundingBox(
  symbols: readonly SymbolPlacement[],
  sizeProvider: SizeProvider,
): BoundingBox | null {
  if (symbols.length === 0) return null;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const sym of symbols) {
    const size = sizeProvider.getSize(sym.key);
    if (!size) continue;

    minX = Math.min(minX, sym.x);
    maxX = Math.max(maxX, sym.x + size.width);
    minY = Math.min(minY, sym.y);
    maxY = Math.max(maxY, sym.y + size.height);
  }

  if (!isFinite(minX)) return null;

  return {
    minX, maxX, minY, maxY,
    width:   maxX - minX,
    height:  maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

/**
 * Compute the box coordinate (maxX, maxY) for the FSW M marker.
 *
 * This is what fswlive() uses when building the FSW string:
 *   fsw.replace("M500x500", "M" + bbox[1] + "x" + bbox[3])
 *
 * Returns null if the bounding box cannot be computed.
 */
export function computeBoxCoord(
  symbols: readonly SymbolPlacement[],
  sizeProvider: SizeProvider,
): { box_x: number; box_y: number } | null {
  const bbox = computeBoundingBox(symbols, sizeProvider);
  if (!bbox) return null;
  return { box_x: Math.round(bbox.maxX), box_y: Math.round(bbox.maxY) };
}
