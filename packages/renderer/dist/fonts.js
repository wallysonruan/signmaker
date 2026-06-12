"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadFonts = loadFonts;
exports.waitForFonts = waitForFonts;
const font_ttf_1 = require("@sutton-signwriting/font-ttf");
const f = font_ttf_1.font;
/**
 * Inject the Sutton SignWriting @font-face CSS declarations into the document
 * head. Must be called once in a browser context before rendering any SVGs.
 *
 * Safe to call multiple times — the library guards against duplicate injection
 * using a stable element id ("SgnwFontCss").
 *
 * @param dir - Optional local font directory path. When omitted, fonts are
 *              loaded from jsDelivr CDN (the default for most deployments).
 */
function loadFonts(dir) {
    f.cssAppend(dir);
}
/**
 * Returns a Promise that resolves once both the Line and Fill Sutton
 * SignWriting fonts are ready to use (i.e. glyph measurement returns non-zero
 * values on a canvas).
 *
 * Call loadFonts() first, then await this before rendering any SVG symbols.
 */
function waitForFonts() {
    return new Promise((resolve) => {
        f.cssLoaded(resolve);
    });
}
//# sourceMappingURL=fonts.js.map