import { ComputedRef } from 'vue';
export interface UsePaletteDragReturn {
    isDragging: ComputedRef<boolean>;
    onButtonPointerDown(key: string, e: PointerEvent): void;
}
export declare function usePaletteDrag(onDrop: (key: string, clientX: number, clientY: number) => void): UsePaletteDragReturn;
//# sourceMappingURL=usePaletteDrag.d.ts.map