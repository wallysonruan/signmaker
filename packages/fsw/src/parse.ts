import { Sign, BoxType } from './types';
import { SIGN_RE, SPATIAL_RE, SORT_RE, SORT_KEY_RE } from './regex';

/**
 * Parse a complete FSW sign string into a structured Sign object.
 *
 * Returns null if the input is not a valid FSW sign (wrong format, empty, etc.).
 * The box coordinate is preserved as-is from the input (it is recomputed on
 * generate if you use generateFsw after mutations).
 */
export function parseFsw(fsw: string): Sign | null {
  if (!fsw || !SIGN_RE.test(fsw)) return null;

  const sortMatch = fsw.match(SORT_RE);
  const sort: string[] = sortMatch
    ? (sortMatch[0].slice(1).match(SORT_KEY_RE) ?? [])
    : [];

  // Box type and coordinate immediately follow the sort prefix
  const afterSort = sortMatch ? fsw.slice(sortMatch[0].length) : fsw;
  const box = afterSort[0] as BoxType;
  const coordStr = afterSort.slice(1, 8);  // e.g. "518x529"
  const [box_x, box_y] = coordStr.split('x').map(Number);

  const spatialMatches = fsw.match(SPATIAL_RE) ?? [];
  const symbols = spatialMatches.map((s) => ({
    key: s.slice(0, 6),
    x:   parseInt(s.slice(6, 9), 10),
    y:   parseInt(s.slice(10, 13), 10),
  }));

  return { sort, box, box_x, box_y, symbols };
}

/**
 * Extract the first valid FSW sign from a larger string (text may contain
 * non-FSW content around the sign). Returns empty string if none found.
 * Equivalent to the old ssw.sign(text) function.
 */
export function extractSign(text: string): string {
  if (!text) return '';
  const match = text.match(new RegExp(
    '(?:A(?:S[123][0-9a-f]{2}[0-5][0-9a-f])+)?[BLMR][0-9]{3}x[0-9]{3}(?:S[123][0-9a-f]{2}[0-5][0-9a-f][0-9]{3}x[0-9]{3})*'
  ));
  return match ? match[0] : '';
}
