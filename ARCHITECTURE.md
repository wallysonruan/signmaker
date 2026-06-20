# SignWriter Architecture Decision Record

**Status:** Accepted  
**Date:** 2026-06  
**Authors:** SignWriter core team

---

## Context

SignWriter is a browser-based editor for creating signs in **Sutton SignWriting** — a script that encodes any signed language visually using positioned symbols. Signs are stored as **FSW** (Formal SignWriting) strings: a compact ASCII notation that describes which symbols appear and where.

The central challenge is that FSW editing involves three concerns that pull in different directions:

- **Domain logic** (parsing FSW strings, applying symbol transforms, computing bounding boxes) is pure computation — it has no business being coupled to any UI framework.
- **Interaction** (drag-and-drop, undo/redo, keyboard shortcuts) is inherently stateful and event-driven, but the specific events and reactivity mechanism vary by environment.
- **Rendering** (turning a symbol key into pixels) depends on TrueType fonts that must be downloaded before any measurement is possible, making it the one genuinely async, browser-specific concern.

This ADR records the architectural decisions made to keep these concerns cleanly separated while producing a library whose core packages work equally well with Vue 3, React, vanilla web components, server-side TypeScript, or any other environment.

---

## Repository Layout

```
signmaker/
├── packages/
│   ├── fsw/              @signwriter/fsw         — FSW/SWU engine (pure functions)
│   ├── layout/           @signwriter/layout      — coordinate math, bounding box
│   ├── editor/           @signwriter/editor      — immutable state, commands, history
│   ├── renderer/         @signwriter/renderer    — SVG rendering, font loading
│   └── vue/              @signwriter/vue         — Vue 3 composables and components
└── app/                  Vite + Vue 3 reference application
```

The dependency graph flows strictly downward — no package imports from a package above it in this list:

```
renderer  ──►  fsw  ◄──  layout
                │              │
                ▼              ▼
              editor  ◄────────┘
                │
                ▼
               vue
                │
                ▼
               app
```

The four core packages (`fsw`, `layout`, `editor`, `renderer`) have no framework dependency. They can be consumed directly from React, Svelte, or any other environment. `@signwriter/vue` is the actively maintained framework adapter; adapter contributions for other frameworks are welcome.

---

## Package Reference

### `@signwriter/fsw` — The FSW Engine

All FSW/SWU operations as **pure functions**. No DOM, no side effects, no async.

**Public API:**

| Export | Signature | Description |
|---|---|---|
| `parseFsw(fsw)` | `string → Sign \| null` | Parse an FSW string into a structured `Sign` object |
| `generateFsw(sign)` | `Sign → string` | Serialise a `Sign` back to an FSW string |
| `extractSign(text)` | `string → string` | Extract the first valid FSW sign from arbitrary text |
| `isValidSign(fsw)` | `string → boolean` | Structural validation (regex, not semantic) |
| `isValidSymbolKey(key)` | `string → boolean` | Validate a 6-char symbol key |
| `fsw2swu(fsw)` | `string → string` | Convert FSW → SWU (Unicode SignWriting) |
| `swu2fsw(swu)` | `string → string` | Convert SWU → FSW |
| `symbolInfo(key)` | `string → SymbolInfo \| null` | Decompose a key into plane, base, fill, rotation |
| `rotate(key, step)` | `(string, number) → string` | Cycle rotation nibble ±1 |
| `mirror(key)` | `string → string` | Toggle mirrored flag (XOR bit 3 of rotation nibble) |
| `fill(key, step)` | `(string, number) → string` | Cycle fill digit 0–5 |
| `variation(key, step)` | `(string, number) → string` | Advance base symbol within ISWA 2010 |

**Key types:**

```typescript
interface Sign {
  sort:    string[];          // Keys in the A-prefix sort sequence
  box:     BoxType;           // 'M' | 'B' | 'L' | 'R'
  box_x:   number;            // Box x coordinate (max extent or center)
  box_y:   number;            // Box y coordinate (max extent or center)
  symbols: SymbolPlacement[]; // Ordered spatials, first = back z-order
}

interface SymbolPlacement {
  key: string;   // 6-char FSW key e.g. "S14c20"
  x:   number;   // FSW x coordinate 0–999
  y:   number;   // FSW y coordinate 0–999
}
```

**Testing:** All functions are tested against the FSW specification. Round-trip tests verify that `generateFsw(parseFsw(fsw))` is stable.

---

### `@signwriter/layout` — Coordinate Math

Pure functions for the spatial mathematics of sign layout. Depends on `@signwriter/fsw`; accepts a `SizeProvider` interface so font-metric concerns never leak in.

**`SizeProvider` interface:**

```typescript
interface SizeProvider {
  getSize(symbolKey: string): { width: number; height: number } | null;
}
```

This is the only place font metrics enter the system. In the browser, inject the `font-ttf`-backed provider. In tests, inject a mock that returns `{ width: 30, height: 30 }` for every symbol.

**Key functions:**

| Export | Description |
|---|---|
| `computeBoundingBox(sign, sizeProvider)` | Returns `BoundingBox` covering all symbols |
| `fswToScreen(fsw_x, fsw_y, midWidth, midHeight)` | FSW → CSS pixel position |
| `screenToFsw(screen_x, screen_y, midWidth, midHeight)` | CSS pixels → FSW coordinate |
| `recomputeBoxCoord(sign, sizeProvider)` | Recalculate `box_x/box_y` from actual extents |
| `normalizeFsw(fsw, sizeProvider)` | Re-center all symbols and update box coordinate |

**Coordinate system:**

```
FSW space:    0–999 on both axes, center at (500, 500)
              x increases right, y increases down
              1 FSW unit = 1 CSS pixel (no zoom transform)

Screen space: pixels from the top-left of the editor container
              midWidth  = containerWidth  / 2
              midHeight = containerHeight / 2

FSW → Screen: css_left = fsw_x - 500 + midWidth
              css_top  = fsw_y - 500 + midHeight

Screen → FSW: fsw_x = screen_x + 500 - midWidth
              fsw_y = screen_y + 500 - midHeight
```

---

### `@signwriter/editor` — State Machine

The heart of the library. Defines an **immutable editor state** and a **command pattern** for all mutations. No DOM, no framework, fully testable in Node.js.

**`EditorState`:**

```typescript
interface EditorState {
  readonly symbols:   readonly EditorSymbol[];   // All symbols, first = back z-order
  readonly sort:      readonly string[];          // FSW sort-prefix keys
  readonly selection: ReadonlySet<string>;        // Set of selected symbol IDs
  readonly terms:     readonly string[];          // Spoken-language gloss fields
  readonly entry:     string;                     // Active dictionary entry key
}

interface EditorSymbol {
  readonly id:  string;   // Stable UUID — never changes across renders
  readonly key: string;   // 6-char FSW symbol key
  readonly x:   number;
  readonly y:   number;
}

type Command = (state: EditorState) => EditorState;
type IdGenerator = () => string;
```

**Why symbols have stable IDs:** The original implementation stored symbols in an ordered array and addressed them by index. When the list was reordered (bring-to-front, undo, load), drag handlers holding stale indices would corrupt state. Every `EditorSymbol` carries a UUID so DOM elements, drag handlers, and selection sets never need to be invalidated by list reordering.

**Command factories:**

```typescript
// All return Command = (EditorState) => EditorState
addSymbol(key, x, y, idGen)
deleteSelected()
clearAll()
moveSelected(dx, dy)
copySelected(idGen, offsetX?, offsetY?)
bringToFront()
rotateSelected(step)
mirrorSelected()
fillSelected(step)
variationSelected(step)
addSortKey(key, position)
setTerms(terms)
setEntry(entry)
```

**History (`CommandHistory`):**

```typescript
interface History {
  readonly past:    readonly EditorState[];
  readonly present: EditorState;
  readonly future:  readonly EditorState[];
}

createHistory(initial)           // → History
apply(history, command)          // → History  (pushes present to past, clears future)
undo(history)                    // → History
redo(history)                    // → History
canUndo(history)                 // → boolean
canRedo(history)                 // → boolean
```

**`replaceState` vs `dispatch`:** Not every state change should create an undo entry. Drag start selects a symbol transiently — that selection change must not pollute the undo stack. Framework wrappers expose two operations:

- `dispatch(command)` — calls `apply(history, command)`, creates an undo entry
- `replaceState(state)` — replaces `history.present` without touching `past` or `future`

Use `replaceState` for: drag start, live drag position updates, any transient UI state. Use `dispatch` for: anything the user should be able to undo.

**`FSWBridge`:**

```typescript
stateFromFsw(fsw, idGen): EditorState   // Parse FSW → EditorState (assigns new UUIDs)
stateToFsw(state): string               // EditorState → FSW string
stateToNormalizedFsw(state, sizeProvider): string  // → normalized FSW (re-centered)
```

**`DragEngine`:**

```typescript
startDrag(editorState, symbolId)
  → { editorState: EditorState; drag: DragState }

updateDrag(drag, deltaX, deltaY)
  → DragState          // accumulates pixel delta, no state change

endDrag(editorState, drag)
  → EditorState        // commits deltaX/deltaY via moveSelected

cancelDrag(editorState)
  → EditorState        // identity: leaves state unchanged
```

`startDrag` deselects all and selects the dragged symbol via `replaceState`. `endDrag` is dispatched as a command so it creates an undo entry. The pixel delta applied by `endDrag` equals the FSW coordinate delta (1:1 mapping).

**`KeyboardBindings`:**

```typescript
lookupAction(bindings, keyCode, shift, ctrl): ActionName | null
actionToCommand(action): Command | null   // null for 'undo', 'redo', 'center'
DEFAULT_BINDINGS: ReadonlyArray<readonly [KeyBinding, ActionName]>
```

`actionToCommand` returns `null` for `undo`, `redo`, and `center` because these require external context (the history stack, or a `SizeProvider` for normalization). Framework wrappers handle these cases directly.

---

### `@signwriter/renderer` — SVG Rendering

Wraps `@sutton-signwriting/font-ttf` to produce SVG strings. The only package in the library that has a browser-specific concern: font loading.

**Public API:**

```typescript
renderSymbol(key, x, y, style?): string   // → SVG string for one symbol
renderSymbolBody(key, x, y, style?): string  // → inner SVG body only
renderSign(fsw, style?): string            // → SVG string for a full sign
renderSignBody(fsw, style?): string        // → inner SVG body only
loadFonts(dir?): void                      // Inject @font-face CSS into document.head
waitForFonts(): Promise<void>             // Resolve when glyph measurement works
```

**The font loading problem:** `font-ttf` renders symbols by drawing Unicode characters in a `<canvas>` and scanning pixels to measure each glyph. This means:

1. The `@font-face` CSS must be injected before any measurement (`loadFonts()`).
2. The fonts must be **fully downloaded** before measurement returns non-zero. Calling `renderSymbol` before fonts are ready produces `width="0" height="0"` SVGs.
3. `waitForFonts()` wraps `font.cssLoaded()` — a polling loop that resolves only after a test glyph measures correctly.

**Usage pattern in any browser entry point:**

```typescript
import { loadFonts, waitForFonts } from '@signwriter/renderer';

loadFonts();                     // inject @font-face, kick off CDN download
await waitForFonts();            // block until canvas measurement works
// now safe to call renderSymbol / renderSign
```

By default fonts load from jsDelivr CDN (`@sutton-signwriting/font-ttf@1.0.0`). Pass a local directory to `loadFonts('/fonts/')` to serve them yourself.

**Style options:**

```typescript
interface SignStyle {
  padding?:    number;   // px padding around the sign SVG
  zoom?:       number;   // scale factor (default 1)
  background?: string;   // CSS color string
  lineColor?:  string;
  fillColor?:  string;
  colorize?:   boolean;  // use ISWA 2010 category colors
}
```

---

### `@signwriter/vue` — Vue 3 Composables

Thin reactive wrappers. All business logic lives in `@signwriter/editor`; these composables wire reactivity.

**`useEditorState()`:**

```typescript
const {
  state,         // ComputedRef<EditorState>
  canUndo,       // ComputedRef<boolean>
  canRedo,       // ComputedRef<boolean>
  dispatch,      // (command: Command) => void
  replaceState,  // (state: EditorState) => void
  undo,          // () => void
  redo,          // () => void
} = useEditorState();
```

Internally holds a `ref<History>`. `dispatch` calls `apply()`; `replaceState` directly updates `history.value.present` without touching `past`/`future`.

**`useSymbolDrag(getState, replaceState, dispatch)`:**

```typescript
const {
  isDragging,      // ComputedRef<boolean>
  onPointerDown,   // (symbolId, clientX, clientY) => void
  onPointerMove,   // (clientX, clientY) => void
  onPointerUp,     // () => void
  onPointerCancel, // () => void
} = useSymbolDrag(getState, replaceState, dispatch);
```

Tracks `activeDrag` as `ref<DragState | null>`. `onPointerMove` updates the drag delta but does **not** update state — the live drag position must be tracked separately in the component (see app architecture below). `onPointerUp` calls `dispatch((s) => endDrag(s, drag))`.

**`useKeyboard(dispatch, onUndo, onRedo)`:**

```typescript
const { attach } = useKeyboard(dispatch, onUndo, onRedo);

// In onMounted:
const detach = attach(document);   // or attach(editorElement)
onUnmounted(detach);
```

Returns `{ attach(el: EventTarget): () => void }`. Not lifecycle-coupled — callers choose where and when to attach. This makes it testable without a mounted component and usable with any event target.

---

## Key Design Decisions

### 1. Commands are plain functions, not objects

`Command = (EditorState) => EditorState`

Commands are not classes with an `execute()` and `undo()` method. History is just an array of `EditorState` snapshots. This makes undo/redo trivially correct: restoring previous state means returning the previous snapshot, with no risk of a partially-inverted command leaving state corrupt.

The trade-off: state snapshots use more memory than command objects would. In practice, `EditorState` is shallow-immutable and every unmodified sub-tree is shared by reference, so the overhead is small even for long undo histories.

### 2. Selection is part of EditorState, not a separate UI concern

Selection could have been stored as local component state. It is not, because:

- Commands like `deleteSelected`, `rotateSelected`, and `bringToFront` need to read selection to know which symbols to act on.
- Undo must restore selection to the state it was in when the command ran, not the current UI selection.
- The drag engine (`startDrag`) modifies selection; that modification needs to feed through `replaceState` to avoid a history entry.

Consequence: do not read `editorElement.state.selection` to drive focus rings or cursor styles synchronously with drag. Instead track a separate `dragOffset` ref in the rendering layer for live visual feedback (see app architecture).

### 3. `SizeProvider` is injected, not imported

`@signwriter/layout` never imports from `@signwriter/renderer`. This makes every layout function testable in Node.js with a mock `SizeProvider`, without pulling in the `font-ttf` dependency (which requires DOM and a running browser to measure fonts). The injection point is explicit: any function that needs to know symbol dimensions accepts a `SizeProvider` parameter.

### 4. Font loading is the only async boundary

Everything in `@signwriter/fsw`, `@signwriter/layout`, and `@signwriter/editor` is synchronous. The only `async` in the system is font readiness. `waitForFonts()` is the gate: mount the application after it resolves. Do not attempt to render symbol SVGs before this resolves — they will have `width="0" height="0"`.

### 5. Framework wrappers own no business logic

The Vue composables, React hooks, and web component are binding layers only. They translate framework events into `dispatch` / `replaceState` calls and expose reactive views of `EditorState`. If you find yourself adding FSW logic, coordinate math, or selection reasoning to a framework package, that code belongs in `@signwriter/editor` or `@signwriter/layout` instead.

### 6. The live drag display offset lives outside history

The `DragEngine` accumulates a pixel delta during `onPointerMove` but does not update `EditorState` until `endDrag`. This means the moved symbol appears to stay put during the drag unless the rendering layer handles it. The correct pattern:

```typescript
// In the sign canvas component:
const dragOffset = ref<{ symbolId: string; dx: number; dy: number } | null>(null);

function symbolLeft(sym: EditorSymbol): number {
  let x = sym.x;
  if (dragOffset.value?.symbolId === sym.id) x += dragOffset.value.dx;
  return x - 500 + midWidth.value;
}

function onPointerDown(sym: EditorSymbol, e: PointerEvent) {
  (e.currentTarget as Element).setPointerCapture(e.pointerId);
  e.stopPropagation();
  dragOffset.value = { symbolId: sym.id, dx: 0, dy: 0 };
  drag.onPointerDown(sym.id, e.clientX, e.clientY);
}

function onPointerMove(e: PointerEvent) {
  if (!dragOffset.value) return;
  dragOffset.value = { ...dragOffset.value,
    dx: e.clientX - pointerStart.x,
    dy: e.clientY - pointerStart.y,
  };
  drag.onPointerMove(e.clientX, e.clientY);
}

function onPointerUp() {
  dragOffset.value = null;
  drag.onPointerUp();  // commits via dispatch
}
```

`dragOffset` is never committed to history. It is purely a display artefact.

---

## FSW Format Reference

```
[A<sort>]? <box><coord> [<sym><coord>]* [<style>]?

sort   = one or more: S[1-3][0-9a-f]{2}[0-5][0-9a-f]
box    = B | L | M | R
coord  = [0-9]{3}x[0-9]{3}           (000x000 to 999x999)
sym    = S[1-3][0-9a-f]{2}[0-5][0-9a-f]
style  = - followed by style directives
```

**Example sign:**
```
AS14c20S27106M518x529S14c20481x471S27106503x489
│         │   │      │             │
│ sort ───┘   │ box  │ spatial 1   │ spatial 2
│ prefix      │ coord│             │
└─ A prefix   └─ M518x529: box type M, maxX=518, maxY=529
```

**Symbol key anatomy:**
```
S  1  4  c  2  0
│  │  └──┘  │  │
│  │  base  │  └── rotation nibble 0x0–0xf
│  │        └───── fill digit 0–5
│  └────────────── category plane 1–3
└──────────────── literal 'S'
```

- Plane 1 (`S1xxxx`): hand shapes
- Plane 2 (`S2xxxx`): movement symbols
- Plane 3 (`S3xxxx`): dynamics, punctuation, face, body

Total variants per base: 6 fills × 16 rotations = **96**. Rotations 0–7 are non-mirrored; 8–f are their mirrored counterparts.

**Box type semantics:**
- `M` = Movement (most common; the only type `generateFsw` outputs)
- `B` = Base, `L` = Left, `R` = Right (preserved by `parseFsw`, not generated)
- The box coordinate records `(maxX, maxY)` of the sign's bounding extent when produced by `generateFsw`, and the sign's geometric center when produced by `normalizeFsw`.

---

## Symbol Rendering Pipeline

```
renderSymbol("S14c20", 481, 471)
  └─ fswSpatial("S14c20", 481, 471) → "S14c20481x471"
  └─ fttFsw.symbolSvg("S14c20481x471")
       └─ symbolSize(key2id("S14c20"))
            └─ canvas.getContext("2d")
            └─ context.font = "30px 'SuttonSignWritingLine'"
            └─ context.fillText(glyph, 0, 0)
            └─ getImageData → scan pixels → width, height
       └─ generate <svg width=W height=H viewBox="...">
            <text font-family="SuttonSignWritingLine">…</text>
            <text font-family="SuttonSignWritingFill">…</text>
       └─ return SVG string
```

The resulting SVG string is injected with `v-html` / `dangerouslySetInnerHTML`. The browser renders the `<text>` elements using the loaded fonts. Symbol dimensions are cached by the library after first measurement; repeat calls for the same symbol key are O(1).

---

## Adding a New Framework Binding

If you are adding `@signwriter/svelte`, `@signwriter/solid`, or any other framework:

1. **Do not copy logic from `@signwriter/editor`** — import it.
2. Map `dispatch(command)` → the framework's state update primitive.
3. Map `replaceState(state)` → a state update that does not create a history entry.
4. Implement `{ attach(el): () => void }` for keyboard binding — not lifecycle-coupled.
5. Implement live drag offset tracking locally (do not modify `DragEngine`).
6. Gate the component mount on `waitForFonts()` from `@signwriter/renderer`.

---

## Adding a New Command

1. Add a command factory to `packages/editor/src/commands/symbols.ts` (or a new file if it belongs to a different domain).
2. Re-export it from `packages/editor/src/commands/index.ts`.
3. The factory must return `Command = (EditorState) => EditorState`.
4. Write tests in `packages/editor/tests/commands.test.ts`.
5. If the command maps to a keyboard shortcut, add an entry to `DEFAULT_BINDINGS` and `actionToCommand` in `KeyboardBindings.ts`.

---

## Testing

Each package has its own Jest test suite under `tests/`. Run all suites from the repo root:

```bash
npm test --workspaces --if-present
```

**Test counts (baseline):**

| Package | Tests |
|---|---|
| `@signwriter/fsw` | 93 |
| `@signwriter/layout` | 49 |
| `@signwriter/editor` | 144 |
| `@signwriter/renderer` | 42 |
| `@signwriter/vue` | 16 |
| **Total** | **344** |

**Testing philosophy:**

- `@signwriter/fsw`, `@signwriter/layout`, `@signwriter/editor`: pure function tests, no DOM. Run identically in Node.js.
- `@signwriter/renderer`: tests use Node.js path of `font-ttf` which bypasses canvas measurement. SVG structure is verified, not pixel output.
- `@signwriter/vue`: uses `jsdom` environment with `@vue/test-utils`.

---

## Running the Application

```bash
cd app
npm run dev        # start Vite dev server at http://localhost:5173
npm run build      # production build to app/dist/
npm run typecheck  # vue-tsc --noEmit (no emit, type-check only)
```

The app uses Vite source aliases to resolve `@signwriter/*` packages directly from TypeScript source, so packages do not need to be pre-built during development.

On first load the app calls `loadFonts()` then `waitForFonts()` before mounting. Expect a brief blank page (~0.5–2 seconds depending on CDN latency) while the three Sutton SignWriting TTF fonts download.
