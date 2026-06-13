# SignMaker

A browser-based editor for creating and editing signs in **Sutton SignWriting** notation.
Signs are stored and exchanged as **FSW** (Formal SignWriting) strings.

This repository is a ground-up TypeScript rewrite of the original SignMaker 2017.
It is structured as an **npm workspace monorepo** with framework-agnostic core packages
and thin framework bindings for Vue 3 and React.

---

## Packages

| Package | Description |
|---|---|
| [`@signwriter/fsw`](packages/fsw) | Pure TypeScript FSW engine: parse, generate, validate, convert FSW ↔ SWU, symbol key algebra |
| [`@signwriter/layout`](packages/layout) | Bounding-box calculation, FSW ↔ screen coordinate transforms, sign normalization |
| [`@signwriter/editor`](packages/editor) | Immutable editor state, commands, undo/redo history, selection, drag engine, keyboard bindings |
| [`@signwriter/renderer`](packages/renderer) | SVG symbol rendering via Sutton SignWriting TrueType fonts |
| [`@signwriter/vue`](packages/vue) | Vue 3 composables and components |
| [`@signwriter/react`](packages/react) | React hooks and components |
| [`app`](app) | Demo application built with Vue 3 + Vite (private, not published) |

---

## Quick Start

```bash
npm install          # install all workspace dependencies
npm run dev          # start the demo app (inside app/)
# or
cd app && npm run dev
```

---

## Demo App

The `app/` directory contains a fully functional Vue 3 editor demonstrating all packages together.
It is **not** published to npm — it exists to show integration and serves as a live testbed.

**Features:**
- Symbol palette with drill-down: groups → base symbols → fill/rotation variants
- Drag symbols from the palette onto the canvas
- Drag to reposition symbols already on the canvas
- Selection handles overlay: rotate CCW/CW, flip horizontal/vertical, copy
- Undo/redo (Ctrl+Z / Ctrl+Y) and keyboard nudge (arrow keys)
- FSW panel: displays the current FSW string, accepts FSW input to load a sign

---

## `@signwriter/vue`

Vue 3 composables and components. Install alongside `vue`:

```bash
npm install @signwriter/vue
```

### Composables

```typescript
import { useEditorState, useSymbolDrag, useKeyboard } from '@signwriter/vue';

const { state, canUndo, canRedo, dispatch, replaceState, undo, redo } = useEditorState();
const drag = useSymbolDrag(() => state.value, replaceState, dispatch);
const kb   = useKeyboard(dispatch, undo, redo);
```

### Components

```typescript
import {
  SymbolPalette,    // ISWA 2010 symbol picker with drag support
  SignEditorCanvas, // drag-and-drop canvas with selection handles
  SymbolHandles,    // rotate / flip / copy overlay (used inside SignEditorCanvas)
  FswPanel,         // footer bar with live FSW display and load input
} from '@signwriter/vue';
```

**`SymbolPalette`** — emits `add-symbol(key: string)` when a symbol is clicked or dropped.

**`SignEditorCanvas`** — props: `state`, `dispatch`, `replaceState`. Handles pointer drag,
HTML5 drag-and-drop from the palette, and renders the `SymbolHandles` overlay automatically.

**`FswPanel`** — props: `fsw`. Emits `load-fsw(fsw: string)` when the user submits a string.

---

## `@signwriter/react`

React hooks and components. Install alongside `react`:

```bash
npm install @signwriter/react
```

### Hooks

```typescript
import { useEditorState, useSymbolDrag, useKeyboard } from '@signwriter/react';

const { state, canUndo, canRedo, dispatch, replaceState, undo, redo } = useEditorState();
const drag = useSymbolDrag(getState, replaceState, dispatch);
const kb   = useKeyboard(dispatch, undo, redo);
```

### Components

```typescript
import {
  SymbolPalette,    // props: { onAddSymbol(key): void }
  SignEditorCanvas, // props: { state, dispatch, replaceState }
  SymbolHandles,    // props: { state, dispatch, midWidth, midHeight, isDragging }
  FswPanel,         // props: { fsw, onLoadFsw(fsw): void }
} from '@signwriter/react';
```

---

## `@signwriter/editor`

Framework-agnostic state management. Core building block for both Vue and React packages.

```typescript
import { EMPTY_STATE, addSymbol, rotateSelected, mirrorSelected,
         copySelected, deleteSelected, selectNone, getSelected,
         createHistory, apply, undo, redo, canUndo, canRedo } from '@signwriter/editor';
```

**State shape:**

```typescript
interface EditorState {
  symbols:   EditorSymbol[];   // ordered array; later = higher z-order
  selection: Set<string>;      // symbol ids currently selected
}

interface EditorSymbol {
  id:  string;   // stable UUID
  key: string;   // 6-char FSW symbol key, e.g. "S14c20"
  x:   number;   // FSW coordinate (0–999, center = 500)
  y:   number;
}
```

**Commands** are pure functions `(state: EditorState) => EditorState`. Pass them to `dispatch`.

---

## `@signwriter/fsw`

Pure FSW string utilities with no DOM or font dependencies.

```typescript
import { parseFsw, generateFsw, normalizeFsw, fsw2swu, swu2fsw } from '@signwriter/fsw';
```

**FSW format:** `[A<sort>]? <box><coord> [<sym><coord>]*`

Example: `AS14c20S27106M518x529S14c20481x471S27106503x489`

---

## `@signwriter/renderer`

Renders individual symbol SVGs using the Sutton SignWriting TrueType fonts.

```typescript
import { renderSymbol, getSymbolSize } from '@signwriter/renderer';

const svg  = renderSymbol('S14c20');        // returns SVG string
const size = getSymbolSize('S14c20');       // { width, height } | null
```

Rendering requires the Sutton SignWriting fonts to be loaded in the browser.
The `app/` entry point injects the required `@font-face` CSS automatically.

---

## Development

```bash
# Run all package tests
npm run test:packages

# Build all packages (produces dist/ in each)
npm run build:packages

# Build a single package
cd packages/vue && npm run build
cd packages/react && npm run build

# Type-check the demo app
cd app && npm run typecheck
```

### Repository Structure

```
signmaker/
├── app/                        # Vue 3 demo application (private)
│   ├── src/
│   │   ├── App.vue
│   │   └── main.ts
│   └── vite.config.ts
├── packages/
│   ├── fsw/                    # @signwriter/fsw
│   ├── layout/                 # @signwriter/layout
│   ├── editor/                 # @signwriter/editor
│   │   └── src/
│   │       ├── commands/       # addSymbol, rotateSelected, mirrorSelected, …
│   │       ├── CommandHistory.ts
│   │       ├── SelectionEngine.ts
│   │       ├── DragEngine.ts
│   │       └── KeyboardBindings.ts
│   ├── renderer/               # @signwriter/renderer
│   ├── vue/                    # @signwriter/vue
│   │   └── src/
│   │       ├── components/     # SymbolPalette, SignEditorCanvas, SymbolHandles, FswPanel
│   │       └── useEditorState, useSymbolDrag, useKeyboard
│   └── react/                  # @signwriter/react
│       └── src/
│           ├── components/     # same four components as Vue, in TSX + CSS modules
│           └── useEditorState, useSymbolDrag, useKeyboard
└── package.json                # npm workspace root
```

---

## FSW Coordinate System

Symbols are placed in a **1000×1000** coordinate space with the logical center at **(500, 500)**.
X increases rightward, Y increases downward.

Screen position is derived as:
```
screen_left = fsw_x − 500 + midWidth
screen_top  = fsw_y − 500 + midHeight
```

where `midWidth`/`midHeight` are half the canvas element's pixel dimensions.

---

## License

MIT

---

## Original Author

Steve Slevinski — https://SteveSlevinski.me

The FSW format is defined in [draft-slevinski-formal-signwriting].
Symbol data is from the International SignWriting Alphabet 2010 (ISWA 2010) by Valerie Sutton.

[draft-slevinski-formal-signwriting]: http://tools.ietf.org/html/draft-slevinski-formal-signwriting
