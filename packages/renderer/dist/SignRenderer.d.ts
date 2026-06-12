import type { SignStyle } from './types';
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
export declare function renderSign(fsw: string, style?: SignStyle): string;
/**
 * Render a full sign and return only the inner SVG body (no outer <svg> wrapper).
 *
 * Useful when embedding the sign inside another SVG element.
 */
export declare function renderSignBody(fsw: string, style?: SignStyle): string;
//# sourceMappingURL=SignRenderer.d.ts.map