import type { ScreenPosition, Viewport, BoundingBox } from './types';

/**
 * Convert a FSW coordinate to a CSS pixel position inside the signbox.
 *
 * From index.js:811-812:
 *   left = fsw_x - 500 + midWidth
 *   top  = fsw_y - 500 + midHeight
 *
 * The FSW coordinate (500, 500) maps to screen position (midWidth, midHeight).
 */
export function fswToScreen(
  fswX: number,
  fswY: number,
  viewport: Viewport,
): ScreenPosition {
  return {
    left: fswX - 500 + viewport.midWidth,
    top:  fswY - 500 + viewport.midHeight,
  };
}

/**
 * Convert a palette drag drop position back to FSW coordinates.
 *
 * From index.js:1381:
 *   x = 500 - midWidth  + 1 + elementLeft - signboxLeft
 *   y = 500 - midHeight     + elementTop  - signboxTop
 *
 * The +1 x-offset is a documented quirk in the original code.
 */
export function screenToFsw(
  elementLeft:  number,
  elementTop:   number,
  signboxLeft:  number,
  signboxTop:   number,
  viewport: Viewport,
): { x: number; y: number } {
  return {
    x: 500 - viewport.midWidth  + 1 + elementLeft - signboxLeft,
    y: 500 - viewport.midHeight     + elementTop  - signboxTop,
  };
}

/**
 * Apply a drag delta directly to FSW coordinates (1:1 pixel mapping).
 *
 * From index.js:721-722:
 *   new_x = old_x + drag_delta_x
 *   new_y = old_y + drag_delta_y
 *
 * No bounds checking — coordinates may go negative or exceed 999.
 */
export function applyDragDelta(
  fswX: number,
  fswY: number,
  dx: number,
  dy: number,
): { x: number; y: number } {
  return { x: fswX + dx, y: fswY + dy };
}

/**
 * Compute viewport offsets from the signbox container's client dimensions.
 *
 * From index.js:761-762:
 *   midWidth  = Math.trunc(clientWidth  / 2)
 *   midHeight = Math.trunc(clientHeight / 2)
 *
 * FSW coordinate (500, 500) is placed at pixel (midWidth, midHeight).
 */
export function computeViewport(
  clientWidth: number,
  clientHeight: number,
): Viewport {
  return {
    midWidth:  Math.trunc(clientWidth  / 2),
    midHeight: Math.trunc(clientHeight / 2),
  };
}

/**
 * Auto-center the viewport so the sign stays visible.
 *
 * From index.js:763-771, the original view() function shifts midWidth/midHeight
 * when the sign bounding box falls outside a ±10px band around center:
 *
 *   if (minX < 510-midWidth || maxX > 490+midWidth)
 *     midWidth = midWidth + 500 - trunc((minX + maxX) / 2)
 *
 *   (same for Y axis)
 *
 * Returns the adjusted viewport, or the original viewport if no adjustment
 * is needed.
 */
export function autoCenter(
  bbox: BoundingBox,
  viewport: Viewport,
): Viewport {
  let { midWidth, midHeight } = viewport;

  if (bbox.minX < 510 - midWidth || bbox.maxX > 490 + midWidth) {
    midWidth = midWidth + 500 - Math.trunc((bbox.minX + bbox.maxX) / 2);
  }

  if (bbox.minY < 510 - midHeight || bbox.maxY > 490 + midHeight) {
    midHeight = midHeight + 500 - Math.trunc((bbox.minY + bbox.maxY) / 2);
  }

  return { midWidth, midHeight };
}
