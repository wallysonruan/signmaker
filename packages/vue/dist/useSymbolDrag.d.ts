import { ComputedRef } from 'vue';
import { EditorState, Command } from '@signwriter/editor';
export interface UseSymbolDragReturn {
    isDragging: ComputedRef<boolean>;
    onPointerDown(symbolId: string, clientX: number, clientY: number): void;
    onPointerMove(clientX: number, clientY: number): void;
    onPointerUp(): void;
    onPointerCancel(): void;
}
export declare function useSymbolDrag(getState: () => EditorState, replaceState: (s: EditorState) => void, dispatch: (c: Command) => void, getScale?: () => number): UseSymbolDragReturn;
//# sourceMappingURL=useSymbolDrag.d.ts.map