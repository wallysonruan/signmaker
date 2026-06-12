import type { ComputedRef } from 'vue';
import type { EditorState, Command } from '@signwriter/editor';
export interface UseEditorStateReturn {
    state: ComputedRef<EditorState>;
    canUndo: ComputedRef<boolean>;
    canRedo: ComputedRef<boolean>;
    dispatch(command: Command): void;
    replaceState(state: EditorState): void;
    undo(): void;
    redo(): void;
}
export declare function useEditorState(): UseEditorStateReturn;
//# sourceMappingURL=useEditorState.d.ts.map