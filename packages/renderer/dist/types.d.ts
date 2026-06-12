/**
 * Style options for rendering a full sign.
 *
 * These map to the FSW style suffix format understood by @sutton-signwriting/font-ttf.
 * Example suffix: -P10Z2G_blue_D_black,white_C
 */
export interface SignStyle {
    /** Extra padding (px) around the bounding box. Original app default: 0. */
    readonly padding?: number;
    /** Zoom/scale multiplier. Original app default: 1. */
    readonly zoom?: number;
    /** [lineColor, fillColor] for symbol glyphs. Original app default: ['black','white']. */
    readonly detail?: readonly [string, string?];
    /** Background fill color of the SVG viewport. */
    readonly background?: string;
    /** Whether to apply ISWA category color coding to symbol lines. */
    readonly colorize?: boolean;
}
/**
 * Style options for rendering a single symbol.
 * Subset of SignStyle that applies to individual symbol glyphs.
 */
export interface SymbolStyle {
    readonly detail?: readonly [string, string?];
    readonly background?: string;
    readonly colorize?: boolean;
}
//# sourceMappingURL=types.d.ts.map