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
    readonly scale: number;
    readonly offsetX: number;
    readonly offsetY: number;
}
export declare const VIEWPORT_MIN_ZOOM = 0.25;
export declare const VIEWPORT_MAX_ZOOM = 8;
/** One discrete zoom step — ≈19 %, four steps ≈ 2×. */
export declare const VIEWPORT_ZOOM_STEP: number;
export declare const VIEWPORT_DEFAULT: ViewportState;
/**
 * FSW coordinate → screen pixel.
 *
 *   screenX = (fswX - 500) * scale + midW + offsetX
 */
export declare function worldToScreen(fswX: number, fswY: number, vp: ViewportState, midW: number, midH: number): {
    x: number;
    y: number;
};
/**
 * Screen pixel → FSW coordinate.
 *
 *   fswX = (screenX - midW - offsetX) / scale + 500
 */
export declare function screenToWorld(screenX: number, screenY: number, vp: ViewportState, midW: number, midH: number): {
    x: number;
    y: number;
};
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
export declare function zoomAt(vp: ViewportState, screenX: number, screenY: number, factor: number, midW: number, midH: number): ViewportState;
/** Translate the viewport by screen-space pixel deltas. */
export declare function panViewport(vp: ViewportState, dx: number, dy: number): ViewportState;
/** Restore 1:1 scale, centred on FSW (500, 500). */
export declare function resetViewport(): ViewportState;
/**
 * Compute a viewport that fits all symbols within the canvas with padding.
 * Returns VIEWPORT_DEFAULT when there are no symbols to fit.
 */
export declare function fitContent(symbols: ReadonlyArray<{
    readonly x: number;
    readonly y: number;
    readonly key: string;
}>, getSize: (key: string) => {
    width: number;
    height: number;
} | null, canvasW: number, canvasH: number, padding?: number): ViewportState;
//# sourceMappingURL=Viewport.d.ts.map