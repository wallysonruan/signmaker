# SignMaker Integration Handover Report

**Target audience:** Implementation agent integrating SignMaker into the LetraSinal monorepo.  
**Date:** 2026-07-13  
**Scope:** Read the entire report before writing a single line of integration code.

---

## 1. Repository Overview

### Identification

| Field | Value |
|---|---|
| Repository URL | https://github.com/wallysonruan/signmaker |
| Primary npm package | `@wallysonruan/signmaker-vue` |
| Current published version | **1.4.0** |
| License | ISC |
| Build system | Vite (Vue package), TypeScript compiler `tsc` (all others) |
| Package format | ESM (`dist/index.js`) + CJS (`dist/index.cjs`) + type declarations (`dist/index.d.ts`) |
| Vue compatibility | Vue 3 (peer dependency `"vue": "^3.0.0"`) |
| TypeScript support | Full — every export has `.d.ts` declarations; sources are strict TypeScript |
| Peer dependencies | `vue ^3.0.0` |
| Bundle note | Bundled artefacts not yet measured; Vite externalises `vue` and all internal `@signwriter/*` packages, so the consumer must install all six packages |

### What SignMaker Is

SignMaker is a browser-based editor for creating and editing signs in **Sutton SignWriting** notation. Signs are stored and exchanged as **FSW** (Formal SignWriting) strings — a compact ASCII encoding that describes which symbols appear and where in a 1000 × 1000 FSW coordinate space.

The repository is a **ground-up TypeScript rewrite** of the original SignMaker 2017 by Steve Slevinski. It is structured as an **npm workspace monorepo** with five independently publishable packages:

| Package (npm name) | Version | Role |
|---|---|---|
| `@wallysonruan/signmaker-fsw-engine` | 0.1.0 | Pure FSW parse/generate/validate/convert/symbol algebra |
| `@wallysonruan/signmaker-layout-engine` | 0.1.0 | Bounding box, FSW ↔ screen coordinates, normalization |
| `@wallysonruan/signmaker-editor-engine` | 1.1.0 | Immutable state, commands, undo/redo, selection, drag, keyboard, composition root |
| `@wallysonruan/signmaker-renderer` | 1.0.0 | SVG rendering via Sutton SignWriting TrueType fonts |
| `@wallysonruan/signmaker-vue` | 1.4.0 | Vue 3 composables + components (the integration target) |

The dependency graph flows strictly downward: `fsw ← layout ← editor ← vue`. The `renderer` package is a sibling of `editor` (both depend on `fsw`). None of the core packages depend on Vue.

---

## 2. Public API Inventory

All exports come from `@wallysonruan/signmaker-vue` (`packages/vue/src/index.ts`). This is the only package LetraSinal should install directly; the rest are transitive.

### Components

| Export | Type | Source file | Purpose | Documented |
|---|---|---|---|---|
| `SignEditorCanvas` | Vue component | `components/SignEditorCanvas.vue` | Drag-and-drop canvas with viewport, zoom, selection handles | README + this report |
| `SymbolPalette` | Vue component | `components/SymbolPalette.vue` | 3-level hierarchical ISWA 2010 symbol picker with drag support | README + this report |
| `SymbolHandles` | Vue component | `components/SymbolHandles.vue` | Rotate/flip/copy/delete overlay for selected symbol | Used internally |
| `FswPanel` | Vue component | `components/FswPanel.vue` | Footer bar: displays live FSW, accepts FSW paste-to-load | README + this report |
| `ToolbarPanel` | Vue component | `components/ToolbarPanel.vue` | Undo/Redo/Copy FSW/Paste FSW toolbar | README + this report |
| `ZoomControls` | Vue component | `components/ZoomControls.vue` | +/−/reset/fit buttons + logarithmic slider | Used internally |

### Composables

| Export | Type | Source file | Purpose | Documented |
|---|---|---|---|---|
| `useSignMaker` | composable | `useSignMaker.ts` | **Primary entry point** — wires all ports with Vue reactivity | README + this report |
| `useEditorState` | composable | `useEditorState.ts` | Lower-level: state + history + command bus only | README |
| `useViewport` | composable | `useViewport.ts` | Standalone viewport (zoom/pan/fit) state | this report |
| `useSymbolDrag` | composable | `useSymbolDrag.ts` | Symbol drag-and-drop within the canvas | README |
| `usePaletteDrag` | composable | `usePaletteDrag.ts` | Drag symbols from palette to canvas (ghost element) | this report |
| `useKeyboard` | composable | `useKeyboard.ts` | Canvas keyboard shortcuts via `attach(el)` | README |
| `useScopeManager` | composable | `useScopeManager.ts` | Scope-aware keyboard routing (canvas ↔ palette) | README |
| `usePaletteScope` | composable | `usePaletteScope.ts` | Framework-agnostic palette keyboard navigation wrapper | this report |

### Re-exported Types and Utilities (from `@wallysonruan/signmaker-editor-engine`)

| Export | Type | Purpose |
|---|---|---|
| `createSignMaker` | factory | Framework-agnostic composition root |
| `createCommandBus` | factory | Dispatch seam with before/after hooks |
| `createDefaultHistory` | factory | Default command-based undo/redo history |
| `createMementoCommand` | factory | Wrap a `Command` into a `ReversibleCommand` |
| `createScopeManager`, `createScope`, `createCanvasScope`, `createPaletteScope`, `createFocusManager` | factories | Interaction-layer primitives |
| `debounce` | utility | Debounce wrapper with `.cancel()` |
| `stateFromFsw`, `stateToFsw`, `stateToNormalizedFsw` | re-exported from editor | FSW ↔ `EditorState` bridge |
| `ALPHABET`, `GROUPS` | constant | ISWA 2010 symbol data (groups list + base-symbol lookup) |
| All `*Port`, `Scope*`, `SignMaker*`, `EditorState`, `EditorSymbol`, `Command`, etc. | types | Full TypeScript type surface |

> **Note:** `stateFromFsw`, `stateToFsw`, and `stateToNormalizedFsw` are NOT re-exported from the Vue package's `index.ts`. Import them from `@wallysonruan/signmaker-editor-engine` directly, or import `addSymbol` and the other commands the same way. The README and app demonstrate this pattern.

---

## 3. Canvas Component (`SignEditorCanvas`)

### Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `state` | `EditorState` | ✅ | — | Current immutable editor state |
| `dispatch` | `(command: Command) => void` | ✅ | — | Dispatch a command (creates undo entry) |
| `replaceState` | `(state: EditorState) => void` | ✅ | — | Replace state without undo (used for transient drag) |

### Emits

The Canvas component emits **no events**. All output flows through the injected `dispatch` and `replaceState` callbacks.

### Exposed Methods (via `defineExpose`)

| Method | Signature | Description |
|---|---|---|
| `focus` | `() => void` | Moves DOM focus to the canvas (or to the selected symbol wrapper). Called by `useScopeManager` when entering the canvas scope. |
| `dropSymbolAt` | `(key: string, clientX: number, clientY: number) => void` | Places a symbol at the given client coordinates. Call from the parent when `SymbolPalette` emits `palette-drop`. |

### Slots

None. The component is fully self-contained.

### Feature Inventory

| Feature | Status | Notes |
|---|---|---|
| Render symbols from `EditorState` | ✅ | SVG via `renderSymbol()`, injected as `v-html` |
| Add symbol by drop from palette | ✅ | `dropSymbolAt()` converts client → FSW coords via viewport |
| Drag to reposition selected symbol | ✅ | Pointer API; visual ghost via `dragOffset` ref |
| Select / deselect symbol | ✅ | Click selects; background click deselects |
| Selection handles overlay | ✅ | `SymbolHandles` sub-component (rotate/flip/copy/delete) |
| Undo / Redo | ✅ | Via injected `dispatch` (keyboard Ctrl+Z/Ctrl+Shift+Z) |
| Keyboard shortcuts | ✅ | Arrow nudge, Shift+Arrow fast nudge, Tab cycle selection, Delete, /, ., etc. |
| Zoom: mouse wheel (Ctrl+Wheel) | ✅ | `createGestureController` |
| Zoom: pinch gesture (touch) | ✅ | `createGestureController` — two-pointer distance ratio |
| Zoom: buttons (+/−/reset/fit) | ✅ | `ZoomControls` sub-component |
| Zoom: logarithmic slider | ✅ | Hidden on `max-width: 767px` |
| Pan: space+drag or middle mouse | ✅ | `createGestureController` |
| Pan: scrollbar when zoomed in | ✅ | Virtual scroll layer (`canvas-scroll-layer`) |
| Fit content to view | ✅ | `fit()` in `useViewport` |
| FSW loading | Via parent | `stateFromFsw` → `replaceState` in host |
| FSW export | Via parent | `stateToFsw(state)` in host |
| Clipboard | Via parent | `ToolbarPanel` emits `copy-fsw`/`paste-fsw` |
| Touch support | ✅ | `touch-action: none` on root; pointer events handle all input |
| Accessibility | ✅ | `role="region"`, `aria-label`, `aria-selected`, `role="img"`, screen-reader live region |
| Orientation change | ✅ | `ResizeObserver` updates `canvasW`/`canvasH` on resize |
| Dark mode | ❌ | Fixed `#f9fafb` background; no CSS custom properties |

### CSS

All styles are **scoped**. No global CSS is required for the canvas itself. Key inline style decisions:

- `touch-action: none` — disables browser's built-in pan/zoom so the gesture controller owns all touch events.
- `outline: none` — canvas is focusable (tabindex=0) with `:focus-visible` ring.
- The scroll layer has `z-index: 1`; content layer has `z-index: 2`; handles have `z-index: 20`; zoom controls have `z-index: 30`.

### Usage Example

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useSignMaker, SignEditorCanvas, SymbolPalette } from '@wallysonruan/signmaker-vue';
import { stateFromFsw, addSymbol } from '@wallysonruan/signmaker-editor-engine';

const { state, dispatch, replaceState, undo, redo, paletteNav, focusManager, attach } =
  useSignMaker();

const rootEl    = ref<HTMLElement | null>(null);
const canvasRef = ref<{ focus(): void; dropSymbolAt(k: string, x: number, y: number): void } | null>(null);
const paletteRef = ref<{ focus(): void } | null>(null);

const idGen = () => crypto.randomUUID();

function loadSign(fsw: string) {
  replaceState(stateFromFsw(fsw, idGen));
}

function onPaletteDrop(key: string, cx: number, cy: number) {
  canvasRef.value?.dropSymbolAt(key, cx, cy);
}

onMounted(() => {
  focusManager.register('canvas',  () => canvasRef.value?.focus());
  focusManager.register('palette', () => paletteRef.value?.focus());
  const detach = attach(rootEl.value ?? document);
  onUnmounted(detach);
});
</script>

<template>
  <div ref="rootEl" style="display:flex; height:100dvh; overflow:hidden;">
    <SignEditorCanvas
      ref="canvasRef"
      :state="state"
      :dispatch="dispatch"
      :replace-state="replaceState"
    />
    <SymbolPalette
      ref="paletteRef"
      v-model:nav="paletteNav"
      @add-symbol="(key) => dispatch(addSymbol(key, 500, 500, idGen))"
      @palette-drop="onPaletteDrop"
    />
  </div>
</template>
```

---

## 4. Palette Component (`SymbolPalette`)

### Props

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `nav` | `PaletteNavigationState` | ❌ | internal | When provided, the component is **controlled** (v-model:nav pattern). Omit for uncontrolled mode. |
| `clickBehavior` | `'add' \| 'navigate'` | ❌ | `'add'` | `'add'`: single click adds symbol (debounced 300 ms), double-click drills in. `'navigate'`: legacy drill-down on single click. |

### Emits

| Event | Payload | When |
|---|---|---|
| `add-symbol` | `key: string` | User single-clicks a symbol (debounced in `'add'` mode) or presses Enter with a symbol focused |
| `palette-drop` | `key: string, clientX: number, clientY: number` | User drags a symbol from the palette and releases it (anywhere on screen) |
| `update:nav` | `state: PaletteNavigationState` | Navigation state changes when running in controlled mode (use with `v-model:nav`) |

### Exposed Methods

| Method | Signature | Description |
|---|---|---|
| `focus` | `() => void` | Focuses the active (tabindex=0) button inside the palette, or falls back to the palette root. Called by `useScopeManager`. |

### Slots

None.

### Navigation Architecture

The palette has three levels, driven by `PaletteNavigationState`:

```
level: 'groups'   → 4-column grid of ISWA 2010 symbol groups
       ↓ click / Enter
level: 'bases'    → 4-column grid of base symbols within selected group
       ↓ double-click / Ctrl+Enter
level: 'variants' → 6-row × 8-column grid of fill (0-5) × rotation (0-7 or 8-f) variants
                    with two tabs ('first' / 'second') for the rotation range
```

### Symbol Search

**Not implemented.** There is no search box or filter. The palette is purely hierarchical drill-down (groups → bases → variants).

### Categories / Groups

Defined in `ALPHABET` and `GROUPS` constants from `@wallysonruan/signmaker-editor-engine`. There are 30+ groups covering the ISWA 2010 symbol set. Group keys are strings (e.g. the first group key is the FSW key of a representative symbol).

### Favorites / Recents

**Not implemented.** No favorites or recent symbols feature exists.

### Keyboard Navigation

| Key | Effect |
|---|---|
| Arrow keys | Move focus within the grid |
| Enter | Add focused symbol to canvas (`add-symbol` event) |
| Ctrl/Cmd + Enter | Drill into next level (expand) |
| Escape | Go back one level; at the `groups` level, Escape bubbles (switches scope) |
| F6 | Switch scope (canvas ↔ palette); handled by `useScopeManager`, not the palette |

All keyboard logic is delegated to the framework-agnostic `createPaletteScope` (via `usePaletteScope`). The Vue component just calls `paletteScope.scope.handleKey(e)`.

### Touch Behavior

- `touch-action: none` on each button — browser default scroll/zoom is suppressed.
- Drag threshold of **10 px** before a palette-drag activates (in `createPaletteDragState`).
- Single-tap triggers `pointerdown` which starts a pending drag; if released within 300 ms without moving 10 px, it fires `onButtonPointerDown` → debounced `add-symbol`.
- Global `document` pointer listeners are registered during a drag and removed on `pointerup`/`pointercancel`.

### Mobile CSS

The palette has a dedicated `@media (max-width: 767px)` block:

```css
.palette {
  width: 100%;
  max-height: clamp(200px, 36dvh, 280px);
  border-left: none;
  border-top: 1px solid #e2e8f0;
}
.group-grid, .symbol-grid { grid-template-columns: repeat(6, 1fr); grid-auto-rows: 38px; }
.variant-grid              { grid-template-columns: repeat(8, 1fr); grid-auto-rows: 30px; }
```

This makes the palette a horizontal strip at the bottom on small screens — exactly the bottom-sheet pattern LetraSinal wants.

### Usage Example (controlled mode)

```vue
<SymbolPalette
  ref="paletteRef"
  v-model:nav="paletteNav"
  click-behavior="add"
  @add-symbol="(key) => dispatch(addSymbol(key, 500, 500, idGen))"
  @palette-drop="onPaletteDrop"
/>
```

`paletteNav` is a `Ref<PaletteNavigationState>` returned by `useSignMaker()`. Binding `v-model:nav` is required when using `useSignMaker()` so that the scope manager and palette stay in sync.

---

## 5. Data Model

### Core Types

```typescript
// packages/editor/src/types.ts

interface EditorSymbol {
  readonly id:  string;   // stable UUID (crypto.randomUUID() in production)
  readonly key: string;   // 6-char FSW symbol key, e.g. "S14c20"
  readonly x:   number;   // FSW x coordinate (0–999, center = 500)
  readonly y:   number;   // FSW y coordinate (0–999, center = 500)
}

interface EditorState {
  readonly symbols:   readonly EditorSymbol[];  // first = back z-order, last = front
  readonly sort:      readonly string[];        // FSW A-prefix sort keys
  readonly selection: ReadonlySet<string>;      // set of selected symbol IDs
  readonly terms:     readonly string[];        // 8 spoken-language gloss fields
  readonly entry:     string;                   // active dictionary entry key
}

type Command    = (state: EditorState) => EditorState;
type IdGenerator = () => string;

const EMPTY_STATE: EditorState;  // canonical starting point
```

```typescript
// packages/fsw/src/types.ts  (parse/generate layer)

interface SymbolPlacement { key: string; x: number; y: number; }

interface Sign {
  sort:    string[];
  box:     'B' | 'L' | 'M' | 'R';
  box_x:   number;   // max-extent x when produced by generateFsw
  box_y:   number;   // max-extent y when produced by generateFsw
  symbols: SymbolPlacement[];
}

interface SymbolInfo {
  plane:    number;   // 1 = hands, 2 = movement, 3 = dynamics/punctuation
  base:     string;   // 3-char hex, e.g. "14c"
  fill:     number;   // 0–5
  rotation: number;   // 0–15
  mirrored: boolean;  // true when rotation >= 8
}
```

### FSW Support

The FSW engine (`@wallysonruan/signmaker-fsw-engine`) implements the full Formal SignWriting specification:

- Parse: `parseFsw(fsw: string): Sign | null`
- Generate: `generateFsw(sign: Sign): string`
- Extract from mixed text: `extractSign(text: string): string`
- Validate: `isValidSign(fsw): boolean`, `isValidSymbolKey(key): boolean`
- Convert: `fsw2swu(fsw): string`, `swu2fsw(swu): string`

### Alternative Representations

None within the library. Internally, `EditorState` uses a flat ordered array of `EditorSymbol` objects. The `Sign` type (FSW parse layer) has a separate `sort[]` array for the `A`-prefix sort sequence.

### Serialization / Deserialization (FSWBridge)

```typescript
// packages/editor/src/FSWBridge.ts

// FSW string → EditorState (assigns new UUIDs via idGen)
stateFromFsw(fsw: string, idGen: IdGenerator): EditorState

// EditorState → FSW string (box coord = 500×500 placeholder unless sizeProvider given)
stateToFsw(state: EditorState, sizeProvider?: SizeProvider): string

// EditorState → normalized FSW (re-centered; requires sizeProvider)
stateToNormalizedFsw(state: EditorState, sizeProvider: SizeProvider): string
```

> **Important:** `stateToFsw` without a `SizeProvider` outputs `M500x500` as the box coordinate. For a geometrically correct box coordinate (needed by external SignWriting tools), pass the renderer-backed size provider. See §6 for the pattern.

### Symbol Identifiers

Symbol keys are 6-character ASCII strings in the format `S[1-3][0-9a-f]{2}[0-5][0-9a-f]`.

Example: `S14c20`

| Position | Value | Meaning |
|---|---|---|
| 0 | `S` | literal |
| 1 | `1` | plane (1=hands, 2=movement, 3=dynamics) |
| 2–3 | `4c` | base within plane (hex) |
| 4 | `2` | fill variant (0–5) |
| 5 | `0` | rotation/mirror nibble (0x0–0xf) |

### Coordinate System

- FSW space: 1000 × 1000 units, center at **(500, 500)**, x right, y down.
- Screen conversion: `screen_left = fsw_x − 500 + midWidth`
- Zoom/pan: `screen_x = (fsw_x − 500) * scale + midWidth + offsetX`
- Valid normalized range: 0–999 per axis.

### Rotation, Fill, Mirror

```typescript
rotate(key, step: number): string     // step ±1, wraps 0–15
mirror(key): string                   // XOR bit 3 of rotation nibble (0–7 ↔ 8–15)
fill(key, step: number): string       // step ±1, wraps 0–5
variation(key, step: number): string  // advance base symbol within ISWA 2010
```

### Immutability

`EditorState` is **shallow-immutable** by design. Every mutation returns a new `EditorState` object; unchanged sub-arrays are shared by reference. Commands are pure functions `(EditorState) => EditorState`. No in-place mutation occurs anywhere in the library.

---

## 6. Integration Patterns

### Create a New Sign

```typescript
import { useSignMaker } from '@wallysonruan/signmaker-vue';
import { EMPTY_STATE } from '@wallysonruan/signmaker-editor-engine';

const { replaceState } = useSignMaker();
replaceState(EMPTY_STATE);  // clear canvas to start fresh
```

### Edit an Existing Sign (Load from FSW)

```typescript
import { stateFromFsw } from '@wallysonruan/signmaker-editor-engine';

function loadSign(fsw: string): void {
  const idGen = () => crypto.randomUUID();
  replaceState(stateFromFsw(fsw, idGen));
}
```

### Extract the Resulting FSW String

```typescript
import { stateToFsw } from '@wallysonruan/signmaker-editor-engine';
import { getSymbolSize } from '@wallysonruan/signmaker-renderer';

// Simple — box coord is placeholder M500x500:
const fsw = stateToFsw(state.value);

// Accurate — box coord reflects actual bounding box:
const sizeProvider = { getSize: getSymbolSize };
const fsw = stateToFsw(state.value, sizeProvider);
```

### Persist Changes

```typescript
// Listen for any state change and persist:
import { watch } from 'vue';
watch(state, (newState) => {
  const fsw = stateToFsw(newState);
  myDocument.updateSign(signId, fsw);
}, { deep: false });  // shallow — EditorState is a new reference on every change
```

### Detect Unsaved Changes

```typescript
const initialFsw = ref('');
const isDirty = computed(() => stateToFsw(state.value) !== initialFsw.value);

function openEditor(fsw: string) {
  initialFsw.value = fsw;
  loadSign(fsw);
}
```

### Reset the Editor

```typescript
import { EMPTY_STATE } from '@wallysonruan/signmaker-editor-engine';
replaceState(EMPTY_STATE);
// Also reset undo history if desired:
import { createDefaultHistory } from '@wallysonruan/signmaker-editor-engine';
// Inject a fresh history via useSignMaker({ history: createDefaultHistory(EMPTY_STATE) })
// or call history.clear() on the history port:
history.clear();  // clears undo/redo stack
```

### Undo / Redo

```typescript
const { canUndo, canRedo, undo, redo } = useSignMaker();
// canUndo / canRedo are ComputedRef<boolean>
// undo() / redo() are plain functions
```

### Add a Symbol Programmatically

```typescript
import { addSymbol } from '@wallysonruan/signmaker-editor-engine';
dispatch(addSymbol('S14c20', 500, 500, () => crypto.randomUUID()));
```

### Hook into Dispatch (Intercept / Observe)

```typescript
const { bus } = useSignMaker();

// Observe every command after execution:
bus.afterCommand((name, state) => {
  console.log('command executed:', name, state.symbols.length);
});

// Intercept and block or transform:
bus.intercept((name, command, payload, next) => {
  if (name === 'deleteSelected') return { blocked: true };
  return next();
});
```

### Font Loading (Required at App Startup)

```typescript
import { loadFonts, waitForFonts } from '@wallysonruan/signmaker-renderer';

// In main.ts or App.vue's setup(), BEFORE mounting the editor:
loadFonts();              // inject @font-face CSS (safe to call multiple times)
await waitForFonts();     // wait for CDN download (0.5–2 s on first load)
```

> **Failure mode:** If `waitForFonts()` is not awaited before rendering, all `renderSymbol()` calls return `<svg width="0" height="0">` (invisible symbols). Render nothing until fonts are ready.

---

## 7. Mobile & Tablet Evaluation

### Touch Interaction Quality

**Good.** The pointer event API is used exclusively (no deprecated touch events). `touch-action: none` is set on both the canvas root and every symbol button in the palette. The gesture controller uses `setPointerCapture` to retain pointer events across the element boundary during drag.

### Dragging Symbols with a Finger

**Works.** The `createGestureController` uses `pointerdown`/`pointermove`/`pointerup` with `pointerType` awareness. Single-touch symbol drag is fully supported.

The palette drag also works: `createPaletteDragState` registers `document`-level pointer listeners so the ghost element follows the finger across component boundaries.

### Pinch-to-Zoom Support

**Fully implemented.** The gesture controller tracks a `Map<pointerId, position>`. When `pointerMap.size >= 2`, it computes the inter-pointer distance ratio and calls `onZoom(factor, midX, midY)`. Pinch is smooth and zooms around the midpoint of the two fingers.

### Gesture Conflicts

| Conflict | Status |
|---|---|
| Browser pinch-to-zoom vs. canvas pinch | **Resolved** — `touch-action: none` on `.canvas` suppresses browser zoom |
| Browser scroll vs. palette scroll | **Managed** — palette uses `overflow-y: scroll` with `overscroll-behavior: contain` on mobile; this prevents scroll from bubbling to the document |
| Scroll during symbol drag | **Resolved** — pointer capture prevents scroll interference during active drag |
| Safari viewport resize on keyboard open | **Partial** — `100dvh` is used for layout height, which adapts to the visual viewport. `ResizeObserver` updates canvas dimensions. Dynamic viewport height (`dvh`) is used on the palette's `max-height`. |

### Small-Screen Layout Behavior

At `max-width: 767px`:
- App layout switches from `flex-row` to `flex-column` (canvas on top, palette below).
- Canvas takes `flex: 1` (expands to fill remaining space).
- Palette is capped at `clamp(200px, 36dvh, 280px)` — approximately one-third of the screen.
- Toolbar switches to horizontal layout and shrinks below the palette.
- Zoom slider is hidden (`display: none`).
- Group/base grids expand from 4 to **6 columns**.
- Variant grid stays at 8 columns with shorter rows (30 px instead of 38 px).

### Can Palette and Canvas Coexist on a Phone Screen?

**Yes, but space is tight.** At 375 × 667 (iPhone SE):
- Canvas: ~375 × 310 px (667 − 280 palette − 40 toolbar ≈ 347, minus browser chrome ≈ 310).
- Palette: 200–280 px tall.

The canvas area is functional but small for fine symbol placement. The primary interaction model on phone is: add a symbol from the palette, then adjust position using keyboard arrow keys (via an attached Bluetooth keyboard or on-screen keyboard shortcuts). Pure finger-drag precision at this size is limited.

### Bottom-Sheet Layout

**Already implemented in spirit.** The `@media (max-width: 767px)` block makes the palette a horizontal strip anchored at the bottom of the screen with `border-top`. Adding a LetraSinal wrapper that shows the entire SignMaker UI in a full-screen dialog or bottom sheet is straightforward — see §8.

### Orientation Changes

**Handled.** `ResizeObserver` on the canvas element fires when dimensions change (including rotation). The viewport resets to `VIEWPORT_DEFAULT` on resize in the reference app (the canvas re-renders at correct dimensions). The palette reflows via CSS grid.

### Performance on Mobile Devices

- Symbol SVGs are injected as HTML strings via `v-html`. Each symbol is a `<text>` element in a small SVG. On a canvas with 10–30 symbols, this is well within mobile GPU budget.
- Reactivity uses `shallowRef` — Vue does not deeply proxy `EditorState`, so state changes trigger a single re-render of the symbol list without diffing the entire tree.
- The gesture controller is a plain JS class — no framework overhead in the event path.
- Font measurement is cached by `font-ttf` after the first call per key — repeat renders are O(1).

**Potential issue:** If a sign has many symbols (50+), the `v-for` loop in the canvas may cause jank on low-end Android devices. No virtualization is implemented.

### Minimum Viewport Sizes

| Dimension | Recommended minimum |
|---|---|
| Width | 320 px (iPhone 5) |
| Height | 568 px (iPhone 5 landscape) |
| For comfortable editing | 375 × 667 px |

### Recommendations

1. **Keep the palette collapsible on mobile.** Add a toggle button that hides/shows the palette, giving the canvas more space for fine editing.
2. **Fullscreen editing is preferable on mobile.** Open SignMaker in a full-screen dialog (`position: fixed; inset: 0`). This eliminates competition with the LetraSinal document UI for screen space and simplifies focus trapping.
3. **Required CSS on the host dialog:** `overflow: hidden` and `touch-action: none` to prevent document scroll from bleeding through during editing.
4. **Z-index budget:** SignMaker components use z-indices 1–30 internally. The host dialog should use a base z-index of 1000+ so it sits above LetraSinal's existing overlays.

### Known Problems and Potential Fixes

| Problem | Severity | Fix |
|---|---|---|
| No dark-mode support | Low | Wrap in a `[data-theme="dark"]` override block; replace the `#f9fafb` canvas background and `#f8fafc` palette background with CSS variables |
| `window`/`document` usage (ghost element, `document.elementsFromPoint`, font injection) | Medium for SSR | Conditionally render only on client; use `defineAsyncComponent` with `ssr: false`. See §9. |
| Zoom slider hidden on mobile but no alternative continuous zoom control | Low | The pinch gesture is the intended replacement; acceptable for v1 |
| `SymbolHandles` toolbars (rotate/flip/delete) appear above and below the selected symbol; on phone this may clip outside the canvas | Low | Add `overflow: visible` on the canvas or reposition handles to avoid edges |
| Safari bounce scroll — document may scroll while the user drags a palette symbol | Low | Add `@touchmove.prevent` on the host dialog's root element, or set `overscroll-behavior: none` on `<body>` while the editor is open |
| Font loading delay (blank symbols) | Medium | Show a loading spinner while `waitForFonts()` resolves; mount the editor only after promise resolves |

---

## 8. LetraSinal Integration Proposal

### Component Placement

Recommendation: create a new package `packages/sign-editor` in the LetraSinal monorepo.

```
letrasinal/
└── packages/
    └── sign-editor/           # new package
        ├── package.json
        └── src/
            ├── SignMakerDialog.vue
            ├── MobileSignEditor.vue
            └── index.ts
```

Rationale: isolating the SignMaker wrapper in its own package keeps it out of `packages/editor` (the document editor) and `packages/ui` (generic UI), respects the existing monorepo boundary pattern, and makes it possible to lazy-load the entire module at the route/dialog level.

### Wrapper Component: `SignMakerDialog.vue`

This component owns the modal/fullscreen overlay and the SignMaker lifecycle.

#### Props

```typescript
interface SignMakerDialogProps {
  /** FSW string to load for editing. Empty string = new sign. */
  modelValue: string;
  /** Whether the dialog is open. */
  open: boolean;
  /** Visual mode hint. The dialog uses fullscreen on mobile regardless. */
  preferFullscreen?: boolean;
}
```

#### Emits

```typescript
interface SignMakerDialogEmits {
  /** Emitted when the user confirms. Carries the updated FSW string. */
  (e: 'confirm', fsw: string): void;
  /** Emitted when the user cancels. No FSW payload. */
  (e: 'cancel'): void;
  /** Two-way binding: mirrors 'confirm' for v-model support. */
  (e: 'update:modelValue', fsw: string): void;
}
```

#### Responsibilities

- Open/close animation (transition).
- Mount `loadFonts()` + `waitForFonts()` gating (show spinner until fonts ready).
- Instantiate `useSignMaker()` and provide it to the canvas + palette.
- Load `modelValue` FSW into the editor on open.
- Extract FSW from `state` on confirm.
- Focus trap: prevent Tab from reaching the document behind the dialog.
- Restore focus to the triggering element on close.
- Emit `confirm` with the current FSW or `cancel` without.

#### Skeleton Implementation

```vue
<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import {
  useSignMaker, SignEditorCanvas, SymbolPalette, ToolbarPanel,
} from '@wallysonruan/signmaker-vue';
import {
  stateFromFsw, stateToFsw, addSymbol, EMPTY_STATE,
} from '@wallysonruan/signmaker-editor-engine';
import { loadFonts, waitForFonts } from '@wallysonruan/signmaker-renderer';

const props = defineProps<{
  modelValue: string;
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'confirm', fsw: string): void;
  (e: 'cancel'): void;
  (e: 'update:modelValue', fsw: string): void;
}>();

const fontsReady = ref(false);
onMounted(async () => {
  loadFonts();
  await waitForFonts();
  fontsReady.value = true;
});

const {
  state, dispatch, replaceState, undo, redo, canUndo, canRedo,
  paletteNav, focusManager, attach,
} = useSignMaker();

const rootEl     = ref<HTMLElement | null>(null);
const canvasRef  = ref<{ focus(): void; dropSymbolAt(k: string, x: number, y: number): void } | null>(null);
const paletteRef = ref<{ focus(): void } | null>(null);
const detach     = ref<(() => void) | null>(null);

const idGen = () => crypto.randomUUID();

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    const initial = props.modelValue
      ? stateFromFsw(props.modelValue, idGen)
      : EMPTY_STATE;
    replaceState(initial);
    // Re-attach keyboard when dialog re-opens
    detach.value?.();
    detach.value = attach(rootEl.value ?? document);
    focusManager.register('canvas',  () => canvasRef.value?.focus());
    focusManager.register('palette', () => paletteRef.value?.focus());
  } else {
    detach.value?.();
    detach.value = null;
  }
});

function confirm(): void {
  const fsw = stateToFsw(state.value);
  emit('confirm', fsw);
  emit('update:modelValue', fsw);
}

function cancel(): void {
  emit('cancel');
}

function onPaletteDrop(key: string, cx: number, cy: number) {
  canvasRef.value?.dropSymbolAt(key, cx, cy);
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="sm-dialog-overlay" role="dialog" aria-modal="true">
      <div ref="rootEl" class="sm-dialog" :aria-busy="!fontsReady">
        <div v-if="!fontsReady" class="sm-loading">Loading fonts…</div>
        <template v-else>
          <ToolbarPanel
            :can-undo="canUndo"
            :can-redo="canRedo"
            @undo="undo"
            @redo="redo"
            @copy-fsw="() => navigator.clipboard.writeText(stateToFsw(state))"
            @paste-fsw="async () => replaceState(stateFromFsw(await navigator.clipboard.readText(), idGen))"
          />
          <div class="sm-editor-body">
            <SignEditorCanvas
              ref="canvasRef"
              :state="state"
              :dispatch="dispatch"
              :replace-state="replaceState"
            />
            <SymbolPalette
              ref="paletteRef"
              v-model:nav="paletteNav"
              @add-symbol="(key) => dispatch(addSymbol(key, 500, 500, idGen))"
              @palette-drop="onPaletteDrop"
            />
          </div>
          <div class="sm-footer">
            <button @click="cancel">Cancel</button>
            <button class="sm-confirm" @click="confirm">Insert Sign</button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.sm-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
}

.sm-dialog {
  display: flex;
  flex-direction: column;
  width: min(900px, 100vw);
  height: min(700px, 100dvh);
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

/* Full-screen on mobile */
@media (max-width: 767px) {
  .sm-dialog {
    width: 100vw;
    height: 100dvh;
    border-radius: 0;
  }
}

.sm-editor-body {
  flex: 1;
  display: flex;
  flex-direction: row;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 767px) {
  .sm-editor-body {
    flex-direction: column;
  }
}

.sm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.sm-confirm {
  background: #3b82f6;
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
</style>
```

### Suggested Flow

```
1. User taps a sign cell in the LetraSinal document editor
       │
       ▼
2. LetraSinal retrieves the sign's current FSW string
       │
       ▼
3. <SignMakerDialog :model-value="currentFsw" :open="true" />
       │
       ├─ waitForFonts() (if not already done — cache the promise)
       ├─ stateFromFsw(currentFsw, idGen) → replaceState(...)
       └─ Keyboard attached to dialog root element
       │
       ▼
4. User edits the sign inside the dialog
   (add/drag/rotate/delete symbols, undo/redo)
       │
       ▼
5a. User taps "Insert Sign" (confirm)
       │
       ├─ stateToFsw(state.value) → newFsw
       ├─ emit('confirm', newFsw)
       └─ LetraSinal updates the document sign with newFsw
       │
5b. User taps "Cancel"
       ├─ emit('cancel')
       └─ LetraSinal discards changes, restores focus to document
```

### Sequence Diagram (text)

```
LetraSinal       SignMakerDialog        useSignMaker         Document
     │                  │                    │                  │
     │ open=true        │                    │                  │
     │ modelValue=fsw   │                    │                  │
     ├─────────────────►│                    │                  │
     │                  │ waitForFonts()     │                  │
     │                  │─────────────────── (await) ──────────►│
     │                  │ stateFromFsw(fsw)  │                  │
     │                  ├───────────────────►│                  │
     │                  │                    │ replaceState()   │
     │                  │◄───────────────────┤                  │
     │                  │                    │                  │
     │           User edits (dispatch / replaceState cycle)     │
     │                  │                    │                  │
     │                  │ confirm click      │                  │
     │                  │ stateToFsw(state)  │                  │
     │                  ├───────────────────►│                  │
     │                  │◄───────────────────┤ fsw string       │
     │ emit('confirm')  │                    │                  │
     │◄─────────────────┤                    │                  │
     │ updateSign(fsw)  │                    │                  │
     ├──────────────────────────────────────────────────────────►
     │                  │                    │                  │
     │ open=false       │                    │                  │
     ├─────────────────►│                    │                  │
```

### State Management

**How LetraSinal should store the current FSW:**

Store FSW strings as plain strings in the document model (Pinia store or equivalent). The `state` inside `useSignMaker` is transient — it exists only while the dialog is open. On `confirm`, overwrite the stored FSW. On `cancel`, discard the in-dialog `state`.

```typescript
// In a Pinia store or composable:
const signFsw = ref<string>('');

function openSignEditor(fsw: string) {
  signFsw.value = fsw;
  dialogOpen.value = true;
}

function onSignConfirmed(newFsw: string) {
  signFsw.value = newFsw;
  dialogOpen.value = false;
  // Persist to document model here
}
```

**Live vs. confirmation-only updates:**

Recommendation: **update only on confirmation**. Do not stream FSW back to the document on every keypress. The editor's undo stack lives inside `useSignMaker` and should not be coupled to the document undo stack.

**Error handling:**

- `stateFromFsw` returns `EMPTY_STATE` for invalid FSW — no exception is thrown.
- `waitForFonts()` does not reject; it is an infinite poll. Add a timeout wrapper if needed:

```typescript
const timeout = new Promise<void>((_, reject) =>
  setTimeout(() => reject(new Error('Font load timeout')), 10_000)
);
await Promise.race([waitForFonts(), timeout]);
```

### Overlay and Focus Handling

**Focus trapping:** Use a focus trap library (e.g. `focus-trap-vue` or a custom implementation) inside `SignMakerDialog`. The dialog root element should be the focus boundary. SignMaker's `attach(rootEl)` registers keyboard on the dialog root, not `document`, so keys do not leak.

**Preventing document gestures while editing:**
- Add `pointer-events: none` on the document layer while the dialog is open (via a CSS class toggled on `<body>`).
- OR use the `sm-dialog-overlay` with `touch-action: none` to swallow pointer events (already in the skeleton above).
- Set `overflow: hidden` on `<body>` while the dialog is open to prevent background scroll.

**Restoring caret position:**
- Before opening the dialog, store a reference to the focused LetraSinal element: `const returnFocus = document.activeElement as HTMLElement`.
- After closing: `returnFocus?.focus()`.

---

## 9. SSR & Lazy Loading

### Does SignMaker Depend on `window` or `document`?

**Yes**, in two locations:

| Location | Dependency | When |
|---|---|---|
| `packages/renderer/src/fonts.ts` (`loadFonts`) | `document.head` (via `font-ttf`'s `cssAppend`) | Only when `loadFonts()` is called |
| `packages/interactions/src/createPaletteDragState.ts` | `document.addEventListener` / `document.elementsFromPoint` | Only during an active palette drag |
| `packages/vue/src/usePaletteDrag.ts` (`createGhost`) | `document.createElement`, `document.body.appendChild` | Only when a drag threshold is crossed |
| `packages/renderer` (indirectly) | Canvas 2D API for font measurement | Only when `renderSymbol` is called |

The editor engine, FSW engine, and layout engine are **fully SSR-safe** — no `window`/`document` references.

### Is SignMaker Safe for SSR?

**No, not without guards.** The Vue components call `renderSymbol()` in the template (via `v-html`), which triggers font-ttf canvas measurement — a browser-only API.

### Recommended Import Strategy

```typescript
// In SignMakerDialog.vue:
const SignEditorCanvas = defineAsyncComponent(() =>
  import('@wallysonruan/signmaker-vue').then(m => ({ default: m.SignEditorCanvas }))
);
```

Or use Nuxt / Vite's client-only wrapper:

```vue
<!-- Nuxt -->
<ClientOnly>
  <SignMakerDialog :open="open" :model-value="fsw" @confirm="onConfirm" />
</ClientOnly>
```

Or in `vite.config.ts` with `ssr.noExternal`:

```typescript
// In Nuxt/vite SSR config:
ssr: { noExternal: ['@wallysonruan/signmaker-vue'] }
```

### Route-Level vs. Dialog-Level Lazy Loading

Recommendation: **dialog-level lazy loading** (not route-level). The SignMaker packages are opened on demand; pre-loading at the route boundary would unnecessarily delay the document editor's initial load.

```typescript
const SignMakerDialog = defineAsyncComponent({
  loader: () => import('./SignMakerDialog.vue'),
  loadingComponent: SignMakerDialogSkeleton,
  delay: 200,
});
```

### Font Caching

`loadFonts()` is idempotent (guarded by a stable element id `"SgnwFontCss"`). Cache the `waitForFonts()` promise at the module level so multiple dialog open/close cycles do not re-poll:

```typescript
let fontPromise: Promise<void> | null = null;

export function ensureFontsLoaded(): Promise<void> {
  if (!fontPromise) {
    loadFonts();
    fontPromise = waitForFonts();
  }
  return fontPromise;
}
```

Call `ensureFontsLoaded()` once when the LetraSinal app mounts (or when the user first opens a sign editor dialog), then the promise is immediately resolved on subsequent calls.

### Bundle Splitting Opportunities

```
@wallysonruan/signmaker-vue          — components + composables
@wallysonruan/signmaker-editor-engine — state, commands, history, interaction
@wallysonruan/signmaker-renderer     — SVG + font-ttf (largest transitive dep)
@wallysonruan/signmaker-fsw-engine   — tiny, no DOM
@wallysonruan/signmaker-layout-engine — tiny, no DOM
```

All five packages are imported together by `@wallysonruan/signmaker-vue`. Vite will tree-shake unused exports. The heaviest dependency is `@sutton-signwriting/font-ttf` — it includes the actual TTF font data and cannot be split further. Serve fonts separately and cache aggressively.

---

## 10. Styling Requirements

### Imported CSS Files

**None.** `@wallysonruan/signmaker-vue` does not import any global CSS files. All styles are **scoped** within each Vue single-file component (`<style scoped>`).

### Required Global Styles

The only global style requirement is the **Sutton SignWriting `@font-face` CSS**, injected dynamically by `loadFonts()`. This injection uses `document.createElement('style')` and is idempotent. It loads three font families:

- `SuttonSignWritingLine` (line glyphs)
- `SuttonSignWritingFill` (fill glyphs)
- `SuttonSignWritingOneD` (1D glyphs)

By default these load from jsDelivr CDN. For offline or intranet deployments, call `loadFonts('/path/to/local/fonts/')`.

### CSS Variables

**None defined.** SignMaker uses hard-coded color values (slate-100 through slate-900 palette, blue-500 for selection/focus rings). This is a limitation for theming.

### Theme Support

**None.** Dark mode is not supported. All backgrounds, borders, and text colors are fixed light-theme values. For LetraSinal integration:

- Wrap the `SignMakerDialog` in a container with `color-scheme: light` to prevent system dark mode from inverting child component styles.
- Long term, submit a PR to replace fixed colors with CSS custom properties.

### Dark-Mode Behavior

As noted: fixed light-mode colors. Dark mode requires CSS overrides.

### Z-Index Map (Internal)

| Element | z-index |
|---|---|
| `canvas-scroll-layer` | 1 |
| `canvas-content` | 2 |
| `ZoomControls` | 30 |
| `SymbolHandles` | 20 |
| Palette drag ghost | 9999 (fixed, appended to `<body>`) |

LetraSinal dialog should use `z-index: 1000+` to sit above all internal z-indices.

### Style Collisions with Vuetify

Potential issues:

| Issue | Description | Fix |
|---|---|---|
| Button reset | Vuetify applies global button styles (display, padding, font-size). SignMaker's `.tool-btn`, `.back-btn`, `.tab-btn`, `.handle-btn`, `.zoom-btn` are scoped, but `<button>` resets from Vuetify may bleed in. | Wrap SignMaker components in a CSS isolation layer or reset boundary. |
| `overflow: hidden` | Vuetify dialogs set `overflow: hidden` on `<body>`. This conflicts with the palette drag ghost element (appended to `<body>`) if the body scroll is locked. | Use `document.documentElement` scroll lock instead of `body`. |
| Focus outline | Vuetify overrides `:focus-visible` globally. SignMaker uses `outline: 2px solid #3b82f6`. | Override with SignMaker's selector or keep Vuetify's focus ring (they are similar). |
| Font inheritance | Vuetify sets `font-family` on `<html>` or `:root`. SignMaker's text labels will inherit this — it is acceptable. | No action needed. |

---

## 11. Testing Strategy

### Unit Tests (Jest / Vitest recommended)

These test the FSW and state contract, not the UI.

```typescript
// Load initial FSW → correct EditorState
it('loads FSW and creates correct symbol list', () => {
  const state = stateFromFsw('AS14c20S27106M518x529S14c20481x471S27106503x489', () => 'id1');
  expect(state.symbols).toHaveLength(2);
  expect(state.symbols[0].key).toBe('S14c20');
  expect(state.symbols[0].x).toBe(481);
});

// Emit updated FSW after editing
it('round-trips FSW after addSymbol command', () => {
  const { getState, dispatch } = createSignMaker();
  dispatch('add', addSymbol('S14c20', 500, 500, () => 'id1'));
  const fsw = stateToFsw(getState());
  expect(isValidSign(fsw)).toBe(true);
});

// Cancel = no change to original FSW
it('cancel returns original FSW unchanged', () => {
  const original = 'AS14c20M500x500S14c20500x500';
  let saved = original;
  // Simulate opening and cancelling
  const state = stateFromFsw(original, () => 'id1');
  const fsw = stateToFsw(state);
  // Cancel: don't emit confirm, saved remains original
  expect(saved).toBe(original);
});
```

### Component Tests (`@vue/test-utils`)

```typescript
// Palette inserts symbols on add-symbol event
it('emits add-symbol when a palette button is clicked', async () => {
  const wrapper = mount(SymbolPalette);
  await wrapper.find('.group-btn').trigger('click');
  await nextTick();
  // Should emit add-symbol for the clicked group key
  expect(wrapper.emitted('add-symbol')).toBeTruthy();
});

// Canvas updates state on dropSymbolAt
it('adds symbol when dropSymbolAt is called', async () => {
  const state = ref(EMPTY_STATE);
  const dispatch = vi.fn((cmd) => { state.value = cmd(state.value); });
  const wrapper = mount(SignEditorCanvas, {
    props: { state: state.value, dispatch, replaceState: vi.fn() },
  });
  wrapper.vm.dropSymbolAt('S14c20', 200, 200);
  expect(dispatch).toHaveBeenCalled();
});
```

### Mobile E2E Tests (Playwright recommended)

```typescript
// Open editor on phone viewport
test('opens editor on iPhone SE viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await expect(page.locator('.palette')).toBeVisible();
  await expect(page.locator('.canvas')).toBeVisible();
});

// Insert symbol from palette
test('taps palette button and adds symbol to canvas', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const groupBtn = page.locator('.group-btn').first();
  await groupBtn.tap();
  await expect(page.locator('.symbol-wrapper')).toHaveCount(1);
});

// Save sign
test('confirm button emits FSW', async ({ page }) => {
  // ... open dialog, add symbol, click confirm, assert FSW non-empty
});

// Rotate device
test('layout reflows on orientation change', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.setViewportSize({ width: 667, height: 375 });
  await expect(page.locator('.canvas')).toBeVisible();
});
```

For pinch-to-zoom E2E testing, use Playwright's `touchscreen.tap` with multi-touch simulation or BrowserStack real-device testing.

### Recommended Tooling

| Layer | Tool |
|---|---|
| Unit (pure functions) | Jest (already configured in the repo) |
| Component tests | `@vue/test-utils` + Vitest |
| E2E desktop | Playwright |
| E2E mobile | Playwright + `setViewportSize` for viewport testing; BrowserStack for real-device |
| Visual regression | Percy or Chromatic |

---

## 12. Migration & Rollout Plan

### Phase 1 — Install and Verify

**Goal:** Confirm packages install and render isolated components.

1. Add to `packages/sign-editor/package.json`:
   ```json
   {
     "dependencies": {
       "@wallysonruan/signmaker-vue": "^1.4.0",
       "@wallysonruan/signmaker-editor-engine": "^1.1.0",
       "@wallysonruan/signmaker-renderer": "^1.0.0",
       "@wallysonruan/signmaker-fsw-engine": "^0.1.0",
       "@wallysonruan/signmaker-layout-engine": "^0.1.0"
     }
   }
   ```
2. Create a throwaway `SignMakerSandbox.vue` page.
3. Call `loadFonts()` + `waitForFonts()`.
4. Render `<SignEditorCanvas>` and `<SymbolPalette>` side by side.
5. Verify symbols appear and drag works.

**Risks:** Font CDN availability; jsDelivr may be blocked in some networks. **Mitigation:** Self-host fonts via `loadFonts('/fonts/')` and copy TTF files into `public/fonts/`.

### Phase 2 — Fullscreen Mobile Editor

**Goal:** `SignMakerDialog.vue` works end-to-end for creating a new sign on mobile.

1. Implement `SignMakerDialog.vue` (skeleton above).
2. Add a test route in LetraSinal that opens the dialog.
3. Verify on physical iOS and Android devices.
4. Add focus trap.
5. Add `ensureFontsLoaded()` caching.

**Risks:** `touch-action: none` conflict with LetraSinal's document scroll. **Mitigation:** Lock `<body>` scroll when dialog is open.

### Phase 3 — Edit Existing Document Signs

**Goal:** Tap a sign in the document → edit → save back.

1. Wire `SignMakerDialog` into the LetraSinal document editor (tap handler → open dialog with sign's FSW → on confirm → update sign in document model).
2. Implement `isDirty` check and confirmation on accidental close.
3. Add undo/redo integration.

**Risks:** LetraSinal document undo stack vs. SignMaker undo stack are independent. **Mitigation:** Treat the full edit session as one atomic operation from the document's perspective: the document records `(oldFsw → newFsw)` as a single undo entry; SignMaker's internal undo stack is discarded on dialog close.

### Phase 4 — Tablet Optimizations

**Goal:** On tablets (768 px+), show palette on the side instead of bottom.

1. Switch to `flex-row` layout at 768 px+ (already the default SignMaker layout).
2. Make palette width configurable (prop on `SignMakerDialog`).
3. Add a collapse/expand toggle for the palette.
4. Test on iPad Safari.

**Risks:** Pinch-to-zoom on iPad Safari may conflict if `viewport` meta tag has `user-scalable=yes`. **Mitigation:** Ensure `<meta name="viewport" content="user-scalable=no">` is set while the dialog is open (restore on close).

### Phase 5 — Optional Desktop Reuse

**Goal:** Reuse `SignMakerDialog` on desktop (1024 px+) as a centered modal.

1. `SignMakerDialog` already works on desktop (the skeleton CSS uses `min(900px, 100vw)`).
2. Add keyboard shortcut to open the editor (e.g. `E` or `Enter` when a sign is focused in the document).
3. Add resizable dialog handle (optional).

**Risks:** Low — desktop is the simpler case; tablet/mobile work implicitly validates desktop.

---

## 13. Executive Summary

### What SignMaker Can Do Today

- **Full FSW editing:** Create, load, and export Sutton SignWriting signs as FSW strings.
- **Symbol palette:** Hierarchical browse of all ISWA 2010 symbols (groups → bases → fill/rotation variants).
- **Drag and drop:** Drag symbols from the palette onto the canvas; drag to reposition on canvas.
- **Selection:** Click to select; selection handles for rotate CCW/CW, flip H/V, copy, delete.
- **Undo/redo:** Full command-based undo/redo with named history entries.
- **Keyboard shortcuts:** Arrow nudge, Tab cycle, Delete, rotation/fill/variation cycles.
- **Zoom and pan:** Pinch-to-zoom, Ctrl+Wheel, button controls, fit-to-content.
- **Mobile layout:** Responsive CSS at 767 px breakpoint — palette becomes a bottom strip.
- **Touch support:** Full pointer event API with gesture controller (pinch, pan, drag).
- **Accessibility:** ARIA roles, live regions, keyboard navigation, focus management.
- **Ports & adapters:** All major services (history, command bus, scope manager, focus manager) are injectable — SignMaker participates in a larger application rather than owning its own services.

### What Is Missing

| Gap | Impact for LetraSinal |
|---|---|
| No dark-mode support | Medium — LetraSinal likely has dark mode |
| No symbol search | Medium — users must drill through groups to find symbols |
| No favorites/recents | Low |
| No SSR safety guard (font loading, DOM usage) | High if LetraSinal uses Nuxt/SSR |
| No CSS custom properties for theming | Low — requires CSS overrides |
| No built-in dialog/modal wrapper | Low — trivial to add (see §8 skeleton) |
| Font loading delay (blank symbols on first open) | Medium — needs loading state UX |
| Fixed FSW box coordinate without size provider | Low — cosmetic; external tools may misread box coord |

### Easiest Integration Path

1. Install the five packages.
2. Call `loadFonts()` + `waitForFonts()` once at app startup.
3. Copy the `SignMakerDialog.vue` skeleton from §8, adjust styling to match LetraSinal's design system.
4. Wire it into the document editor's sign-tap handler.

Total estimated integration surface: ~200 lines of new code in LetraSinal.

### Recommended Mobile UX

**Fullscreen dialog** (not bottom sheet). On phone:
- The dialog occupies 100 × 100dvh.
- Canvas takes the top ~64% of the screen.
- Palette takes the bottom ~36% as a scrollable bottom strip.
- A two-button footer (Cancel / Insert Sign) lives below the palette.

This matches how mobile design tools (Figma Mobile, Canva) handle complex editing on phone.

### Estimated Integration Complexity

**Medium.**

- The API is clean and well-documented; the port-injection pattern makes it easy to wire into an existing app.
- The main complexity is the font loading lifecycle, focus management, and CSS collision avoidance with Vuetify.
- A focused developer should complete Phase 1 + Phase 2 in 2–3 days; Phase 3 in 1–2 additional days.
