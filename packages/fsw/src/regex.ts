// FSW regex components matching the SuttonSignWriting specification.
// These are anchored patterns for whole-string matching; use new RegExp(...)
// with appropriate flags for substring search.

export const RE = {
  SYMBOL: 'S[123][0-9a-f]{2}[0-5][0-9a-f]',
  COORD:  '[0-9]{3}x[0-9]{3}',
  SORT:   'A(?:S[123][0-9a-f]{2}[0-5][0-9a-f])+',
  BOX:    '[BLMR]',
  SPATIAL: 'S[123][0-9a-f]{2}[0-5][0-9a-f][0-9]{3}x[0-9]{3}',
  SIGN:   '(?:A(?:S[123][0-9a-f]{2}[0-5][0-9a-f])+)?[BLMR][0-9]{3}x[0-9]{3}(?:S[123][0-9a-f]{2}[0-5][0-9a-f][0-9]{3}x[0-9]{3})*',
} as const;

export const SYMBOL_RE   = new RegExp('^' + RE.SYMBOL + '$');
export const SPATIAL_RE  = new RegExp(RE.SPATIAL, 'g');
export const SORT_RE     = new RegExp('^' + RE.SORT);
export const SORT_KEY_RE = new RegExp(RE.SYMBOL, 'g');
export const SIGN_RE     = new RegExp('^' + RE.SIGN + '$');
export const SIGN_SEARCH_RE = new RegExp(RE.SIGN, 'g');

export function pad3(n: number): string {
  return n.toString().padStart(3, '0');
}
