/**
 * A symbol placed in the sign editor.
 *
 * Unlike the original signmaker spatials.Symbol, each EditorSymbol carries a
 * stable string ID so that selection and history can reference symbols without
 * depending on array index (which changes on splice/reorder).
 */
export interface EditorSymbol {
    readonly id: string;
    readonly key: string;
    readonly x: number;
    readonly y: number;
}
/**
 * Complete, immutable editor document state.
 *
 * All mutations return a new EditorState — none modify in place.
 */
export interface EditorState {
    readonly symbols: readonly EditorSymbol[];
    readonly sort: readonly string[];
    readonly selection: ReadonlySet<string>;
    readonly terms: readonly string[];
    readonly entry: string;
}
/** A pure state transformation. Commands are composable and serialisable. */
export type Command = (state: EditorState) => EditorState;
/** Factory for stable symbol IDs. Inject a counter in tests; crypto.randomUUID in production. */
export type IdGenerator = () => string;
/** Empty document state — the canonical starting point. */
export declare const EMPTY_STATE: EditorState;
//# sourceMappingURL=types.d.ts.map