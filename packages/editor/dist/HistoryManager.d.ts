import type { EditorState, Command } from './types';
import type { Unsubscribe } from './CommandBus';
/**
 * A first-class, reversible command.
 *
 * Unlike the bare `Command` transform ((state) => state), a ReversibleCommand
 * carries a name and knows how to undo itself. History depends on this
 * interface — not the other way around — so an application can push its own
 * command types onto a shared history alongside SignMaker's.
 */
export interface ReversibleCommand {
    readonly name: string;
    /** Apply the command, returning the next state. */
    execute(state: EditorState): EditorState;
    /** Reverse the command, returning the prior state. */
    undo(state: EditorState): EditorState;
}
/**
 * Wrap a pure transform into a reversible command using the memento pattern:
 * the pre-execute state is captured during execute() and restored by undo().
 *
 * This gives every existing command factory (addSymbol, moveSelected, …) a
 * correct inverse for free, without hand-writing reverse logic. Each instance
 * is single-use per history slot; redo re-executes and re-captures.
 */
export declare function createMementoCommand(name: string, transform: Command): ReversibleCommand;
export type HistoryCommandHook = (command: ReversibleCommand) => void;
/**
 * Replaceable undo/redo history.
 *
 * The default implementation is one adapter; consumers can inject their own
 * (event sourcing, collaboration, a shared application-wide stack) without
 * SignMaker knowing which implementation is in use.
 */
export interface HistoryPort {
    /** Execute a command and record it; clears the redo stack. No-ops are not recorded. */
    push(command: ReversibleCommand): void;
    undo(): void;
    redo(): void;
    canUndo(): boolean;
    canRedo(): boolean;
    /** The current state. */
    current(): EditorState;
    /** Replace the current state without recording a history entry (e.g. external load). */
    replace(state: EditorState): void;
    /** Drop all past/future entries, keeping the current state. */
    clear(): void;
    onPush(fn: HistoryCommandHook): Unsubscribe;
    onUndo(fn: HistoryCommandHook): Unsubscribe;
    onRedo(fn: HistoryCommandHook): Unsubscribe;
    onClear(fn: () => void): Unsubscribe;
    beforePush(fn: HistoryCommandHook): Unsubscribe;
    afterPush(fn: HistoryCommandHook): Unsubscribe;
    beforeUndo(fn: HistoryCommandHook): Unsubscribe;
    afterUndo(fn: HistoryCommandHook): Unsubscribe;
    beforeRedo(fn: HistoryCommandHook): Unsubscribe;
    afterRedo(fn: HistoryCommandHook): Unsubscribe;
}
export declare function createDefaultHistory(initial: EditorState): HistoryPort;
//# sourceMappingURL=HistoryManager.d.ts.map