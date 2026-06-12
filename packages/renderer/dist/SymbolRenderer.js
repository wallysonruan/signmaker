"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderSymbol = renderSymbol;
exports.getSymbolSize = getSymbolSize;
exports.renderSymbolBody = renderSymbolBody;
const font_ttf_1 = require("@sutton-signwriting/font-ttf");
const style_1 = require("./style");
/**
 * Format a symbol spatial string that @sutton-signwriting/font-ttf accepts.
 * Format: <key><xxx>x<yyy>  e.g. "S14c20500x500"
 *
 * When coordinates are provided, font-ttf skips canvas-based font measurement,
 * so this function works in Node.js as well as in the browser.
 */
function fswSpatial(key, x, y) {
    const pad = (n) => String(Math.max(0, Math.round(n))).padStart(3, '0');
    return `${key}${pad(x)}x${pad(y)}`;
}
/**
 * Render a single symbol to a complete SVG string.
 *
 * When called without coordinates, the SVG is sized to the symbol's natural
 * bounding box (suitable for standalone display in a palette or canvas).
 *
 * When called with coordinates, the SVG viewBox is anchored at the given
 * FSW-space position (suitable for extracting a slice of a larger sign SVG).
 *
 * @param key   - 6-character FSW symbol key, e.g. "S14c20"
 * @param x     - Optional X coordinate in FSW space
 * @param y     - Optional Y coordinate in FSW space
 * @param style - Optional rendering style
 */
function renderSymbol(key, x, y, style) {
    const spatial = x !== undefined && y !== undefined ? fswSpatial(key, x, y) : key;
    return font_ttf_1.fsw.symbolSvg(spatial + (0, style_1.buildSymbolStyleSuffix)(style));
}
/**
 * Return the natural pixel dimensions of a symbol glyph.
 *
 * Returns null if the key is invalid or fonts have not yet loaded.
 * This is a thin wrapper around font-ttf's canvas measurement — call
 * waitForFonts() before relying on it in browser contexts.
 */
function getSymbolSize(key) {
    const size = font_ttf_1.fsw.symbolSize(key);
    if (!size)
        return null;
    return { width: size[0], height: size[1] };
}
/**
 * Render a single symbol and return only the inner SVG body.
 *
 * Useful when composing multiple symbols inside a parent SVG element.
 * Coordinates are required to position the symbol within the sign's
 * coordinate space.
 */
function renderSymbolBody(key, x, y, style) {
    return font_ttf_1.fsw.symbolSvgBody(fswSpatial(key, x, y) + (0, style_1.buildSymbolStyleSuffix)(style));
}
//# sourceMappingURL=SymbolRenderer.js.map