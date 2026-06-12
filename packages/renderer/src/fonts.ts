import { font } from '@sutton-signwriting/font-ttf';

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
  (font as { cssAppend: (dir?: string) => void }).cssAppend(dir);
}
