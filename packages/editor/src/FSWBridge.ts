import { parseFsw, generateFsw, extractSign } from '@signwriter/fsw';
import type { Sign } from '@signwriter/fsw';
import type { SizeProvider } from '@signwriter/layout';
import { recomputeBoxCoord, normalizeFsw } from '@signwriter/layout';
import type { EditorState, IdGenerator } from './types';
import { EMPTY_STATE } from './types';

/**
 * Build an EditorState from a FSW string.
 *
 * Each parsed symbol is assigned a fresh ID via idGen.
 * Returns EMPTY_STATE for empty or invalid FSW.
 */
export function stateFromFsw(fsw: string, idGen: IdGenerator): EditorState {
  const clean = extractSign(fsw);
  if (!clean) return EMPTY_STATE;

  const sign = parseFsw(clean);
  if (!sign) return EMPTY_STATE;

  return {
    ...EMPTY_STATE,
    symbols:   sign.symbols.map((s) => ({ id: idGen(), key: s.key, x: s.x, y: s.y })),
    sort:      [...sign.sort],
    selection: new Set<string>(),
  };
}

/**
 * Generate a live FSW string from EditorState.
 *
 * If a SizeProvider is supplied, the box coordinate (M xxx×yyy) is recomputed
 * from the actual bounding box (matching original fswlive() behavior).
 * Without a SizeProvider, the box is set to 500×500 as a placeholder.
 *
 * Returns empty string when the symbol list is empty (matches original behavior).
 */
export function stateToFsw(state: EditorState, sizeProvider?: SizeProvider): string {
  if (state.symbols.length === 0) return '';

  const symbols = state.symbols.map((s) => ({ key: s.key, x: s.x, y: s.y }));
  let sign: Sign = {
    sort:    [...state.sort],
    box:     'M',
    box_x:   500,
    box_y:   500,
    symbols,
  };

  if (sizeProvider) {
    sign = recomputeBoxCoord(sign, sizeProvider);
  }

  return generateFsw(sign);
}

/**
 * Generate a normalized FSW string from EditorState.
 *
 * Requires a SizeProvider to compute bounding box for centering.
 * Returns empty string for an empty state.
 */
export function stateToNormalizedFsw(state: EditorState, sizeProvider: SizeProvider): string {
  if (state.symbols.length === 0) return '';

  const symbols = state.symbols.map((s) => ({ key: s.key, x: s.x, y: s.y }));
  const sign: Sign = { sort: [...state.sort], box: 'M', box_x: 500, box_y: 500, symbols };
  const normalized = normalizeFsw(sign, sizeProvider);
  return generateFsw(normalized);
}
