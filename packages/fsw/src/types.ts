export type BoxType = 'B' | 'L' | 'M' | 'R';

export interface SymbolPlacement {
  key: string;  // 6-char FSW symbol key, e.g. "S14c20"
  x: number;    // FSW x coordinate (integer)
  y: number;    // FSW y coordinate (integer)
}

export interface Sign {
  sort: string[];              // A-prefix symbol keys (may be empty)
  box: BoxType;                // Box type marker
  box_x: number;               // Box x coordinate (max extent / center)
  box_y: number;               // Box y coordinate (max extent / center)
  symbols: SymbolPlacement[];  // Ordered spatial symbols
}

export interface SymbolInfo {
  plane: number;      // 1, 2, or 3
  base: string;       // 3-char hex (plane + two base hex digits)
  fill: number;       // 0–5
  rotation: number;   // 0–15 (0x0–0xf)
  mirrored: boolean;  // rotation >= 8
}
