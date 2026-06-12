import type { SignStyle, SymbolStyle } from './types';
/**
 * Build the FSW style suffix string (e.g. "-P10Z2G_blue_D_black,white_C")
 * from typed style options.
 *
 * Uses @sutton-signwriting/core's style.compose() which handles all
 * escaping and formatting for the FSW style sub-language.
 */
export declare function buildSignStyleSuffix(style?: SignStyle): string;
export declare function buildSymbolStyleSuffix(style?: SymbolStyle): string;
//# sourceMappingURL=style.d.ts.map