/**
 * Box type marker in an FSW sign string.
 * - `M` = Movement (most common, default output)
 * - `B` = Base
 * - `L` = Left
 * - `R` = Right
 *
 * Round-trip note: parseFsw preserves the original box type, but generateFsw
 * emits the exact type stored on the Sign object. The original signmaker app
 * always output `M`; normalizeFsw also always outputs `M`.
 */
export type BoxType = 'B' | 'L' | 'M' | 'R';

/**
 * A single symbol placed at a specific coordinate within an FSW sign.
 *
 * This is the parse/generate representation. The editor layer adds a stable
 * `id` field on top (see `EditorSymbol` in `@signwriter/editor`).
 */
export interface SymbolPlacement {
  /** 6-character FSW symbol key, e.g. `"S14c20"`. */
  key: string;
  /** X coordinate in FSW space (integer, 0–999 for normalized signs). */
  x: number;
  /** Y coordinate in FSW space (integer, 0–999 for normalized signs). */
  y: number;
}

/**
 * A fully parsed FSW sign, ready for round-trip generation.
 *
 * The box coordinate (`box_x`, `box_y`) records the max extent of the sign
 * bounding box when produced by `fswlive()`, or the geometric center when
 * produced by `ssw.norm()`. Use `@signwriter/layout`'s `recomputeBoxCoord()`
 * or `normalizeFsw()` to update these after mutating symbols.
 */
export interface Sign {
  /** Symbol keys in the FSW `A` sort prefix (may be empty). */
  sort: string[];
  /** Box type marker (`M`, `B`, `L`, or `R`). */
  box: BoxType;
  /** Box x coordinate (max extent or center, depending on origin). */
  box_x: number;
  /** Box y coordinate (max extent or center, depending on origin). */
  box_y: number;
  /** Ordered array of spatial symbols (first = back z-order, last = front). */
  symbols: SymbolPlacement[];
}

/**
 * Decomposed fields of a 6-character FSW symbol key.
 *
 * Key format: `S [plane] [base_hi] [base_lo] [fill] [rotation]`
 *
 * Example: `"S14c20"` → plane=1, base="14c", fill=2, rotation=0
 */
export interface SymbolInfo {
  /** Symbol category plane: 1 = hands, 2 = movement, 3 = dynamics/punctuation. */
  plane: number;
  /** 3-character hex string combining plane + 2 base digits, e.g. `"14c"`. */
  base: string;
  /** Fill variant 0–5 (6 fill styles per base symbol). */
  fill: number;
  /** Rotation/mirror index 0–15 (16 orientations: 0–7 normal, 8–15 mirrored). */
  rotation: number;
  /** True when rotation >= 8 (the upper half of the 16 orientation values). */
  mirrored: boolean;
}
