"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderSymbol = renderSymbol;
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
 * @param key   - 6-character FSW symbol key, e.g. "S14c20"
 * @param x     - X coordinate in FSW space (used as the SVG origin)
 * @param y     - Y coordinate in FSW space (used as the SVG origin)
 * @param style - Optional rendering style
 */
function renderSymbol(key, x, y, style) {
    return font_ttf_1.fsw.symbolSvg(fswSpatial(key, x, y) + (0, style_1.buildSymbolStyleSuffix)(style));
}
/**
 * Render a single symbol and return only the inner SVG body.
 *
 * Useful when composing multiple symbols inside a parent SVG element.
 */
function renderSymbolBody(key, x, y, style) {
    return font_ttf_1.fsw.symbolSvgBody(fswSpatial(key, x, y) + (0, style_1.buildSymbolStyleSuffix)(style));
}
//# sourceMappingURL=SymbolRenderer.js.map