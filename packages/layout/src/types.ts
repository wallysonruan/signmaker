/** Pixel dimensions of a rendered symbol glyph. */
export interface Size {
  width: number;
  height: number;
}

/**
 * Dependency-injected symbol size provider.
 *
 * In a browser with Sutton SignWriting fonts loaded, implement this using
 * `ssw.size(key)`. In tests or headless environments, use a fixed-size mock.
 * The layout engine never imports font or DOM code directly.
 */
export interface SizeProvider {
  getSize(key: string): Size | null;
}

/** Axis-aligned bounding box in FSW coordinate space. */
export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;    // maxX - minX
  height: number;   // maxY - minY
  centerX: number;  // (minX + maxX) / 2
  centerY: number;  // (minY + maxY) / 2
}

/** Pixel position of a symbol div inside the signbox container. */
export interface ScreenPosition {
  left: number;
  top: number;
}

/** Viewport offsets: how many pixels FSW coordinate (500, 500) is from the signbox origin. */
export interface Viewport {
  midWidth: number;
  midHeight: number;
}
