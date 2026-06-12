import { SIGN_RE, SYMBOL_RE } from './regex';

/** Returns true if the entire string is a valid FSW sign. */
export function isValidSign(fsw: string): boolean {
  return SIGN_RE.test(fsw);
}

/** Returns true if the string is a valid 6-character FSW symbol key. */
export function isValidSymbolKey(key: string): boolean {
  return key.length === 6 && SYMBOL_RE.test(key);
}
