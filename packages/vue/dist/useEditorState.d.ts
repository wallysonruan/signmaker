import { EditorState, Command, CommandBusPort, HistoryPort } from '@signwriter/editor';
import { ComputedRef } from 'vue';
export interface UseEditorStateOptions {
    /**
     * Replaceable history. Defaults to createDefaultHistory(EMPTY_STATE).
     * Inject your own HistoryPort (event sourcing, a shared application-wide
     * stack, collaboration) without SignMaker knowing the implementation.
     */
    history?: HistoryPort;
}
export interface UseEditorStateReturn {
    state: ComputedRef<EditorState>;
    canUndo: ComputedRef<boolean>;
    canRedo: ComputedRef<boolean>;
    /** Command bus — attach beforeCommand / afterCommand / intercept hooks here. */
    bus: CommandBusPort;
    /** The underlying history port — attach onPush/onUndo/… hooks or replace it. */
    history: HistoryPort;
    /** Dispatch an anonymous transform. For a named history entry + named hooks, use bus.dispatch(name, transform). */
    dispatch(command: Command): void;
    replaceState(newState: EditorState): void;
    undo(): void;
    redo(): void;
}
export declare function useEditorState(options?: UseEditorStateOptions): UseEditorStateReturn;
//# sourceMappingURL=useEditorState.d.ts.map