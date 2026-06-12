import type { SymbolStyle } from './types';
/**
 * Render a single symbol to a complete SVG string.
 *
 * @param key   - 6-character FSW symbol key, e.g. "S14c20"
 * @param x     - X coordinate in FSW space (used as the SVG origin)
 * @param y     - Y coordinate in FSW space (used as the SVG origin)
 * @param style - Optional rendering style
 */
export declare function renderSymbol(key: string, x: number, y: number, style?: SymbolStyle): string;
/**
 * Render a single symbol and return only the inner SVG body.
 *
 * Useful when composing multiple symbols inside a parent SVG element.
 */
export declare function renderSymbolBody(key: string, x: number, y: number, style?: SymbolStyle): string;
//# sourceMappingURL=SymbolRenderer.d.ts.map