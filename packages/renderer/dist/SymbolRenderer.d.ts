import type { SymbolStyle } from './types';
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
export declare function renderSymbol(key: string, x?: number, y?: number, style?: SymbolStyle): string;
/**
 * Return the natural pixel dimensions of a symbol glyph.
 *
 * Returns null if the key is invalid or fonts have not yet loaded.
 * This is a thin wrapper around font-ttf's canvas measurement — call
 * waitForFonts() before relying on it in browser contexts.
 */
export declare function getSymbolSize(key: string): {
    width: number;
    height: number;
} | null;
/**
 * Render a single symbol and return only the inner SVG body.
 *
 * Useful when composing multiple symbols inside a parent SVG element.
 * Coordinates are required to position the symbol within the sign's
 * coordinate space.
 */
export declare function renderSymbolBody(key: string, x: number, y: number, style?: SymbolStyle): string;
//# sourceMappingURL=SymbolRenderer.d.ts.map