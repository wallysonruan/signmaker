import type { SizeProvider } from '@signwriter/layout';
import type { EditorState, IdGenerator } from './types';
/**
 * Build an EditorState from a FSW string.
 *
 * Each parsed symbol is assigned a fresh ID via idGen.
 * Returns EMPTY_STATE for empty or invalid FSW.
 */
export declare function stateFromFsw(fsw: string, idGen: IdGenerator): EditorState;
/**
 * Generate a live FSW string from EditorState.
 *
 * If a SizeProvider is supplied, the box coordinate (M xxx×yyy) is recomputed
 * from the actual bounding box (matching original fswlive() behavior).
 * Without a SizeProvider, the box is set to 500×500 as a placeholder.
 *
 * Returns empty string when the symbol list is empty (matches original behavior).
 */
export declare function stateToFsw(state: EditorState, sizeProvider?: SizeProvider): string;
/**
 * Generate a normalized FSW string from EditorState.
 *
 * Requires a SizeProvider to compute bounding box for centering.
 * Returns empty string for an empty state.
 */
export declare function stateToNormalizedFsw(state: EditorState, sizeProvider: SizeProvider): string;
//# sourceMappingURL=FSWBridge.d.ts.map