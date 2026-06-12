"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderSign = renderSign;
exports.renderSignBody = renderSignBody;
const font_ttf_1 = require("@sutton-signwriting/font-ttf");
const style_1 = require("./style");
/**
 * Render a full sign to an SVG string.
 *
 * Works in both Node.js and browser environments. The SVG uses font-based
 * text elements (Sutton SignWriting TTF Unicode) that render correctly
 * in browsers with the fonts loaded, and are structurally valid elsewhere.
 *
 * @param fsw   - A complete FSW string including the M box coordinate,
 *                e.g. "M518x529S14c20481x471S27106503x489"
 * @param style - Optional rendering style (padding, zoom, colors, etc.)
 * @returns     - A complete SVG string with correct viewBox and dimensions.
 */
function renderSign(fsw, style) {
    if (!fsw)
        return '';
    return font_ttf_1.fsw.signSvg(fsw + (0, style_1.buildSignStyleSuffix)(style));
}
/**
 * Render a full sign and return only the inner SVG body (no outer <svg> wrapper).
 *
 * Useful when embedding the sign inside another SVG element.
 */
function renderSignBody(fsw, style) {
    if (!fsw)
        return '';
    return font_ttf_1.fsw.signSvgBody(fsw + (0, style_1.buildSignStyleSuffix)(style));
}
//# sourceMappingURL=SignRenderer.js.map