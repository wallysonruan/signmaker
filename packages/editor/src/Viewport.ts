/**
 * Viewport — camera model for the sign editor.
 *
 * A viewport describes where the "camera" is positioned over the canvas:
 *   - scale   : zoom level (1 = 100 %, 2 = 200 %, …)
 *   - offsetX : horizontal pan in screen pixels
 *   - offsetY : vertical   pan in screen pixels
 *
 * The transform applied to the content layer is:
 *   translate(midW + offsetX, midH + offsetY) scale(scale)
 *
 * where (midW, midH) is the centre of the canvas element.
 *
 * World coordinates are FSW-space: symbol at (x, y) sits at world point
 *   wx = x - 500
 *   wy = y - 500
 * so FSW (500, 500) maps to screen centre at default zoom.
 *
 * All functions are pure — they return a new ViewportState and never mutate.
 */

export interface ViewportState {
  readonly scale:   number;   // zoom level
  readonly offsetX: number;   // pan offset (screen pixels)
  readonly offsetY: number;
}

export const VIEWPORT_MIN_ZOOM  = 0.25;
export const VIEWPORT_MAX_ZOOM  = 8;
/** One discrete zoom step — ≈19 %, four steps ≈ 2×. */
export const VIEWPORT_ZOOM_STEP = Math.pow(2, 1 / 4);

export const VIEWPORT_DEFAULT: ViewportState = { scale: 1, offsetX: 0, offsetY: 0 };

// ─── helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

// ─── coordinate conversion ────────────────────────────────────────────────────

/**
 * FSW coordinate → screen pixel.
 *
 *   screenX = (fswX - 500) * scale + midW + offsetX
 */
export function worldToScreen(
  fswX: number,
  fswY: number,
  vp: ViewportState,
  midW: number,
  midH: number,
): { x: number; y: number } {
  return {
    x: (fswX - 500) * vp.scale + midW + vp.offsetX,
    y: (fswY - 500) * vp.scale + midH + vp.offsetY,
  };
}

/**
 * Screen pixel → FSW coordinate.
 *
 *   fswX = (screenX - midW - offsetX) / scale + 500
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  vp: ViewportState,
  midW: number,
  midH: number,
): { x: number; y: number } {
  return {
    x: (screenX - midW - vp.offsetX) / vp.scale + 500,
    y: (screenY - midH - vp.offsetY) / vp.scale + 500,
  };
}

// ─── mutations ────────────────────────────────────────────────────────────────

/**
 * Zoom the viewport by `factor` around a fixed screen point.
 *
 * The world point under (screenX, screenY) stays at the same screen position
 * after the zoom — the same principle used by Figma, Excalidraw, and Google Maps.
 *
 * Derivation: the screen transform is tx = midW + offsetX.
 * After zoom we need:  screenX = worldX * newScale + newTx
 * We know:             screenX = worldX * oldScale + tx
 * Therefore:           newTx   = screenX - (screenX - tx) * actualFactor
 */
export function zoomAt(
  vp: ViewportState,
  screenX: number,
  screenY: number,
  factor: number,
  midW: number,
  midH: number,
): ViewportState {
  const newScale     = clamp(vp.scale * factor, VIEWPORT_MIN_ZOOM, VIEWPORT_MAX_ZOOM);
  const actualFactor = newScale / vp.scale;          // may differ from factor due to clamping
  const tx = midW + vp.offsetX;
  const ty = midH + vp.offsetY;
  return {
    scale:   newScale,
    offsetX: screenX - (screenX - tx) * actualFactor - midW,
    offsetY: screenY - (screenY - ty) * actualFactor - midH,
  };
}

/** Translate the viewport by screen-space pixel deltas. */
export function panViewport(vp: ViewportState, dx: number, dy: number): ViewportState {
  return { ...vp, offsetX: vp.offsetX + dx, offsetY: vp.offsetY + dy };
}

/** Restore 1:1 scale, centred on FSW (500, 500). */
export function resetViewport(): ViewportState {
  return VIEWPORT_DEFAULT;
}

/**
 * Compute a viewport that fits all symbols within the canvas with padding.
 * Returns VIEWPORT_DEFAULT when there are no symbols to fit.
 */
export function fitContent(
  symbols: ReadonlyArray<{ readonly x: number; readonly y: number; readonly key: string }>,
  getSize: (key: string) => { width: number; height: number } | null,
  canvasW: number,
  canvasH: number,
  padding = 40,
): ViewportState {
  if (symbols.length === 0) return VIEWPORT_DEFAULT;

  let minX =  Infinity, minY =  Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const sym of symbols) {
    const size = getSize(sym.key) ?? { width: 40, height: 40 };
    const wx   = sym.x - 500;
    const wy   = sym.y - 500;
    minX = Math.min(minX, wx);
    minY = Math.min(minY, wy);
    maxX = Math.max(maxX, wx + size.width);
    maxY = Math.max(maxY, wy + size.height);
  }

  const contentW = maxX - minX;
  const contentH = maxY - minY;
  if (contentW <= 0 || contentH <= 0) return VIEWPORT_DEFAULT;

  const availW = canvasW - padding * 2;
  const availH = canvasH - padding * 2;
  const scale  = clamp(
    Math.min(availW / contentW, availH / contentH),
    VIEWPORT_MIN_ZOOM,
    VIEWPORT_MAX_ZOOM,
  );

  // Offset that centres the content bounding box on screen
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return { scale, offsetX: -cx * scale, offsetY: -cy * scale };
}
