import { Command } from '@signwriter/editor';
export interface UseKeyboardReturn {
    attach(el: EventTarget): () => void;
}
export declare function useKeyboard(dispatch: (c: Command) => void, onUndo: () => void, onRedo: () => void): UseKeyboardReturn;
//# sourceMappingURL=useKeyboard.d.ts.map