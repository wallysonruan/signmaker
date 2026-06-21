"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VIEWPORT_DEFAULT = exports.VIEWPORT_ZOOM_STEP = exports.VIEWPORT_MAX_ZOOM = exports.VIEWPORT_MIN_ZOOM = void 0;
exports.worldToScreen = worldToScreen;
exports.screenToWorld = screenToWorld;
exports.zoomAt = zoomAt;
exports.panViewport = panViewport;
exports.resetViewport = resetViewport;
exports.fitContent = fitContent;
exports.VIEWPORT_MIN_ZOOM = 0.25;
exports.VIEWPORT_MAX_ZOOM = 8;
/** One discrete zoom step — ≈19 %, four steps ≈ 2×. */
exports.VIEWPORT_ZOOM_STEP = Math.pow(2, 1 / 4);
exports.VIEWPORT_DEFAULT = { scale: 1, offsetX: 0, offsetY: 0 };
// ─── helpers ──────────────────────────────────────────────────────────────────
function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
}
// ─── coordinate conversion ────────────────────────────────────────────────────
/**
 * FSW coordinate → screen pixel.
 *
 *   screenX = (fswX - 500) * scale + midW + offsetX
 */
function worldToScreen(fswX, fswY, vp, midW, midH) {
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
function screenToWorld(screenX, screenY, vp, midW, midH) {
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
function zoomAt(vp, screenX, screenY, factor, midW, midH) {
    const newScale = clamp(vp.scale * factor, exports.VIEWPORT_MIN_ZOOM, exports.VIEWPORT_MAX_ZOOM);
    const actualFactor = newScale / vp.scale; // may differ from factor due to clamping
    const tx = midW + vp.offsetX;
    const ty = midH + vp.offsetY;
    return {
        scale: newScale,
        offsetX: screenX - (screenX - tx) * actualFactor - midW,
        offsetY: screenY - (screenY - ty) * actualFactor - midH,
    };
}
/** Translate the viewport by screen-space pixel deltas. */
function panViewport(vp, dx, dy) {
    return { ...vp, offsetX: vp.offsetX + dx, offsetY: vp.offsetY + dy };
}
/** Restore 1:1 scale, centred on FSW (500, 500). */
function resetViewport() {
    return exports.VIEWPORT_DEFAULT;
}
/**
 * Compute a viewport that fits all symbols within the canvas with padding.
 * Returns VIEWPORT_DEFAULT when there are no symbols to fit.
 */
function fitContent(symbols, getSize, canvasW, canvasH, padding = 40) {
    var _a;
    if (symbols.length === 0)
        return exports.VIEWPORT_DEFAULT;
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    for (const sym of symbols) {
        const size = (_a = getSize(sym.key)) !== null && _a !== void 0 ? _a : { width: 40, height: 40 };
        const wx = sym.x - 500;
        const wy = sym.y - 500;
        minX = Math.min(minX, wx);
        minY = Math.min(minY, wy);
        maxX = Math.max(maxX, wx + size.width);
        maxY = Math.max(maxY, wy + size.height);
    }
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    if (contentW <= 0 || contentH <= 0)
        return exports.VIEWPORT_DEFAULT;
    const availW = canvasW - padding * 2;
    const availH = canvasH - padding * 2;
    const scale = clamp(Math.min(availW / contentW, availH / contentH), exports.VIEWPORT_MIN_ZOOM, exports.VIEWPORT_MAX_ZOOM);
    // Offset that centres the content bounding box on screen
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return { scale, offsetX: -cx * scale, offsetY: -cy * scale };
}
//# sourceMappingURL=Viewport.js.map