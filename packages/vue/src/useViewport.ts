import { ref, readonly } from 'vue';
import type { Ref } from 'vue';
import {
  VIEWPORT_DEFAULT,
  VIEWPORT_ZOOM_STEP,
  type ViewportState,
  zoomAt,
  panViewport,
  resetViewport,
  fitContent as _fitContent,
} from '@signwriter/editor';
import type { EditorSymbol } from '@signwriter/editor';
import { getSymbolSize } from '@signwriter/renderer';

export interface UseViewportReturn {
  /** Read-only reactive viewport state. */
  viewport: Readonly<Ref<ViewportState>>;

  /** Zoom in one step around a screen point (canvas-relative). */
  zoomIn(screenX: number, screenY: number, midW: number, midH: number): void;
  /** Zoom out one step around a screen point (canvas-relative). */
  zoomOut(screenX: number, screenY: number, midW: number, midH: number): void;
  /** Zoom by an arbitrary factor around a screen point (canvas-relative). */
  zoomAtPoint(screenX: number, screenY: number, factor: number, midW: number, midH: number): void;
  /** Set an absolute scale, zooming around the canvas centre. */
  setZoom(scale: number, midW: number, midH: number): void;
  /** Reset to 1:1, centred. */
  reset(): void;
  /** Fit all symbols into view. */
  fit(symbols: readonly EditorSymbol[], canvasW: number, canvasH: number): void;
  /** Translate the viewport by screen-pixel deltas. */
  pan(dx: number, dy: number): void;
}

export function useViewport(): UseViewportReturn {
  const vpRef = ref<ViewportState>(VIEWPORT_DEFAULT);

  function zoomIn(sx: number, sy: number, mw: number, mh: number): void {
    vpRef.value = zoomAt(vpRef.value, sx, sy, VIEWPORT_ZOOM_STEP, mw, mh);
  }

  function zoomOut(sx: number, sy: number, mw: number, mh: number): void {
    vpRef.value = zoomAt(vpRef.value, sx, sy, 1 / VIEWPORT_ZOOM_STEP, mw, mh);
  }

  function zoomAtPoint(sx: number, sy: number, factor: number, mw: number, mh: number): void {
    vpRef.value = zoomAt(vpRef.value, sx, sy, factor, mw, mh);
  }

  function setZoom(scale: number, mw: number, mh: number): void {
    const factor = scale / vpRef.value.scale;
    vpRef.value  = zoomAt(vpRef.value, mw, mh, factor, mw, mh);
  }

  function reset(): void {
    vpRef.value = resetViewport();
  }

  function fit(symbols: readonly EditorSymbol[], canvasW: number, canvasH: number): void {
    vpRef.value = _fitContent(symbols, getSymbolSize, canvasW, canvasH);
  }

  function pan(dx: number, dy: number): void {
    vpRef.value = panViewport(vpRef.value, dx, dy);
  }

  return { viewport: readonly(vpRef), zoomIn, zoomOut, zoomAtPoint, setZoom, reset, fit, pan };
}
