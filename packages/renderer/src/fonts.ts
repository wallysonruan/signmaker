import { font } from '@sutton-signwriting/font-ttf';

type FontModule = {
  cssAppend: (dir?: string) => void;
  cssLoaded: (callback: () => void) => void;
};

const f = font as unknown as FontModule;

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
export function loadFonts(dir?: string): void {
  f.cssAppend(dir);
}

/**
 * Returns a Promise that resolves once both the Line and Fill Sutton
 * SignWriting fonts are ready to use (i.e. glyph measurement returns non-zero
 * values on a canvas).
 *
 * Call loadFonts() first, then await this before rendering any SVG symbols.
 */
export function waitForFonts(): Promise<void> {
  return new Promise<void>((resolve) => {
    f.cssLoaded(resolve);
  });
}
