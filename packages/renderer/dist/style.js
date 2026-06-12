"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSignStyleSuffix = buildSignStyleSuffix;
exports.buildSymbolStyleSuffix = buildSymbolStyleSuffix;
const style_1 = require("@sutton-signwriting/core/style");
/**
 * Build the FSW style suffix string (e.g. "-P10Z2G_blue_D_black,white_C")
 * from typed style options.
 *
 * Uses @sutton-signwriting/core's style.compose() which handles all
 * escaping and formatting for the FSW style sub-language.
 */
function buildSignStyleSuffix(style) {
    if (!style)
        return '';
    const suffix = (0, style_1.compose)({
        padding: style.padding,
        zoom: style.zoom,
        background: style.background,
        colorize: style.colorize,
        detail: style.detail
            ? style.detail.filter((c) => c !== undefined)
            : undefined,
    });
    // compose({}) returns "-" (bare prefix with no options); treat that as empty
    return suffix === '-' ? '' : suffix;
}
function buildSymbolStyleSuffix(style) {
    if (!style)
        return '';
    return buildSignStyleSuffix({
        detail: style.detail,
        background: style.background,
        colorize: style.colorize,
    });
}
//# sourceMappingURL=style.js.map