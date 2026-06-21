export interface GestureCallbacks {
    /** Pinch-zoom or Ctrl+Wheel. factor > 1 = zoom in. screenX/Y relative to element top-left. */
    onZoom(factor: number, screenX: number, screenY: number): void;
    /** Incremental pan in screen pixels (positive = right/down). */
    onPan(dx: number, dy: number): void;
    /** Left pointer landed on a [data-symbol-id] descendant. */
    onSymbolPointerDown?(symbolId: string, clientX: number, clientY: number): void;
    /** Pointer moved while a symbol drag is active. */
    onSymbolPointerMove?(clientX: number, clientY: number): void;
    /** Pointer released — commit symbol drag. */
    onSymbolPointerUp?(): void;
    /** Pointer cancelled — abort symbol drag. */
    onSymbolPointerCancel?(): void;
    /** Background click not preceded by a pan gesture. */
    onBackgroundClick?(): void;
    /** Space bar pressed (not auto-repeated). */
    onSpaceDown?(): void;
    /** Space bar released. */
    onSpaceUp?(): void;
}
export interface GestureController {
    /** Attach all gesture listeners to el. Returns a cleanup function. */
    attach(el: HTMLElement): () => void;
}
export declare function createGestureController(callbacks: GestureCallbacks): GestureController;
//# sourceMappingURL=createGestureController.d.ts.map