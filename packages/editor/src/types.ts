/**
 * A symbol placed in the sign editor.
 *
 * Unlike the original signmaker spatials.Symbol, each EditorSymbol carries a
 * stable string ID so that selection and history can reference symbols without
 * depending on array index (which changes on splice/reorder).
 */
export interface EditorSymbol {
  readonly id: string;   // stable unique identifier (UUID or similar)
  readonly key: string;  // 6-char FSW symbol key, e.g. "S14c20"
  readonly x: number;    // FSW x coordinate
  readonly y: number;    // FSW y coordinate
}

/**
 * Complete, immutable editor document state.
 *
 * All mutations return a new EditorState — none modify in place.
 */
export interface EditorState {
  readonly symbols:   readonly EditorSymbol[];  // ordered: first = back (lowest z), last = front
  readonly sort:      readonly string[];        // A-prefix symbol keys for FSW sort sequence
  readonly selection: ReadonlySet<string>;      // IDs of currently selected symbols
  readonly terms:     readonly string[];        // 8 spoken-language gloss fields
  readonly entry:     string;                   // current dictionary entry (for update/delete)
}

/** A pure state transformation. Commands are composable and serialisable. */
export type Command = (state: EditorState) => EditorState;

/** Factory for stable symbol IDs. Inject a counter in tests; crypto.randomUUID in production. */
export type IdGenerator = () => string;

/** Empty document state — the canonical starting point. */
export const EMPTY_STATE: EditorState = {
  symbols:   [],
  sort:      [],
  selection: new Set<string>(),
  terms:     ['', '', '', '', '', '', '', ''],
  entry:     '',
};
