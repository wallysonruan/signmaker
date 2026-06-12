import { SIGN_RE, SYMBOL_RE } from './regex';

/**
 * Returns `true` if the entire string is a structurally valid FSW sign.
 *
 * A valid FSW sign must match the full sign pattern:
 * `[A<sort>]? [BLMR]<coord> [S<sym><coord>]*`
 *
 * This validates structure only — it does not check whether symbol keys
 * correspond to real ISWA 2010 entries.
 */
export function isValidSign(fsw: string): boolean {
  return SIGN_RE.test(fsw);
}

/**
 * Returns `true` if the string is a valid 6-character FSW symbol key.
 *
 * Valid key format: `S [1-3] [0-9a-f]{2} [0-5] [0-9a-f]`
 *
 * Example valid keys: `"S14c20"`, `"S27106"`, `"S38b00"`
 */
export function isValidSymbolKey(key: string): boolean {
  return key.length === 6 && SYMBOL_RE.test(key);
}
