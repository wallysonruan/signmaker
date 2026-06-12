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
export declare function loadFonts(dir?: string): void;
/**
 * Returns a Promise that resolves once both the Line and Fill Sutton
 * SignWriting fonts are ready to use (i.e. glyph measurement returns non-zero
 * values on a canvas).
 *
 * Call loadFonts() first, then await this before rendering any SVG symbols.
 */
export declare function waitForFonts(): Promise<void>;
//# sourceMappingURL=fonts.d.ts.map