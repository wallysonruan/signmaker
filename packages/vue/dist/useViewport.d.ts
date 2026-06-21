import { Ref } from 'vue';
import { ViewportState, EditorSymbol } from '@signwriter/editor';
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
export declare function useViewport(): UseViewportReturn;
//# sourceMappingURL=useViewport.d.ts.map