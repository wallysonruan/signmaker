# @wallysonruan/signmaker-vue

[![npm version](https://img.shields.io/npm/v/@wallysonruan/signmaker-vue)](https://www.npmjs.com/package/@wallysonruan/signmaker-vue)
[![npm downloads](https://img.shields.io/npm/dm/@wallysonruan/signmaker-vue)](https://www.npmjs.com/package/@wallysonruan/signmaker-vue)
[![license](https://img.shields.io/npm/l/@wallysonruan/signmaker-vue)](./LICENSE)

Vue 3 composables and components for building a [Sutton SignWriting](https://www.signwriting.org/forums/software/sw10/sw10.html) sign editor. SignWriting is a writing system for sign languages that represents handshapes, locations, and movements visually.

This package provides everything you need to embed a fully interactive sign editor into your Vue 3 application — keyboard navigation, drag-and-drop, undo/redo, FSW import/export, zoom controls, and accessibility built in.

## Key Features

- **Ready-to-use components** — `SignEditorCanvas`, `SymbolPalette`, `ToolbarPanel`, `ZoomControls`, `FswPanel`
- **Composable-first API** — `useSignMaker` wires up state, history, keyboard, scope routing, and focus management in one call
- **FSW support** — load and export signs as [Formal SignWriting](https://tools.ietf.org/id/draft-slevinski-formal-signwriting-09.html) strings
- **Full keyboard navigation** — arrow keys, F6 scope switching, Ctrl+Z/Ctrl+Shift+Z undo/redo, zoom shortcuts
- **Drag-and-drop** — palette-to-canvas and symbol repositioning, touch-friendly via pointer events
- **Accessible** — ARIA roles, live regions, roving `tabindex`, screen-reader announcements
- **Responsive** — desktop layout (canvas + sidebar palette) and mobile layout (stacked, keyboard-like palette)
- **TypeScript** — full type declarations included

---

## Installation

```bash
# npm
npm install @wallysonruan/signmaker-vue

# pnpm
pnpm add @wallysonruan/signmaker-vue

# yarn
yarn add @wallysonruan/signmaker-vue
```

### Requirements

| Requirement | Version |
|---|---|
| Vue | `^3.0.0` (peer dependency) |
| TypeScript | `^5.0` (optional but recommended) |
| Node.js | `>=18` |

Vue is a **peer dependency** — install it separately if you haven't already:

```bash
npm install vue@^3
```

---

## Quick Start

### 1. Register and use in a component

```vue
<template>
  <div ref="rootRef" style="display: flex; height: 100dvh; overflow: hidden;">
    <SignEditorCanvas
      ref="canvasRef"
      :state="state"
      :dispatch="dispatch"
      :replace-state="replaceState"
    />
    <ToolbarPanel
      :can-undo="canUndo"
      :can-redo="canRedo"
      @undo="undo"
      @redo="redo"
      @copy-fsw="handleCopyFsw"
      @paste-fsw="handlePasteFsw"
    />
    <SymbolPalette
      ref="paletteRef"
      v-model:nav="paletteNav"
      @add-symbol="handleAddSymbol"
      @palette-drop="onPaletteDrop"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  useSignMaker,
  SignEditorCanvas,
  SymbolPalette,
  ToolbarPanel,
} from '@wallysonruan/signmaker-vue';
import { addSymbol, stateToFsw, stateFromFsw } from '@wallysonruan/signmaker-vue';

const {
  state, canUndo, canRedo,
  dispatch, replaceState, undo, redo,
  paletteNav, focusManager, attach,
} = useSignMaker();

const rootRef    = ref<HTMLElement | null>(null);
const canvasRef  = ref<{ focus(): void; dropSymbolAt(key: string, x: number, y: number): void } | null>(null);
const paletteRef = ref<{ focus(): void } | null>(null);

const currentFsw = computed(() => stateToFsw(state.value));

function handleAddSymbol(key: string) {
  dispatch(addSymbol(key, 500, 500, () => crypto.randomUUID()));
}

function onPaletteDrop(key: string, clientX: number, clientY: number) {
  canvasRef.value?.dropSymbolAt(key, clientX, clientY);
}

async function handleCopyFsw() {
  await navigator.clipboard.writeText(currentFsw.value);
}

async function handlePasteFsw() {
  const text = await navigator.clipboard.readText();
  if (text.trim()) replaceState(stateFromFsw(text.trim(), () => crypto.randomUUID()));
}

onMounted(() => {
  focusManager.register('palette', () => paletteRef.value?.focus());
  focusManager.register('canvas',  () => canvasRef.value?.focus());
  const detach = attach(rootRef.value ?? document);
  onUnmounted(detach);
});
</script>
```

---

## API Reference

### Components

#### `<SignEditorCanvas>`

The main editing surface. Renders the current sign as SVG, supports zoom/pan, drag-to-reposition, and keyboard nudging of selected symbols.

**Props**

| Prop | Type | Required | Description |
|---|---|---|---|
| `state` | `EditorState` | Yes | Current editor state (symbols and selection) |
| `dispatch` | `(command: Command) => void` | Yes | Dispatches a command to the state machine |
| `replaceState` | `(state: EditorState) => void` | Yes | Replaces state without recording history |

**Exposed methods** (access via template ref)

| Method | Signature | Description |
|---|---|---|
| `focus` | `() => void` | Moves keyboard focus to the canvas |
| `dropSymbolAt` | `(key: string, clientX: number, clientY: number) => void` | Drops a symbol at screen coordinates (used by palette drag-and-drop) |

**Keyboard shortcuts**

| Shortcut | Action |
|---|---|
| Arrow keys | Nudge selected symbol by 1 unit |
| `Ctrl+=` / `Ctrl+-` | Zoom in / zoom out |
| `Ctrl+0` | Reset zoom |
| `Ctrl+Shift+F` | Fit all symbols in view |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / redo |
| `Delete` / `Backspace` | Delete selected symbol |
| `F6` | Switch focus to palette |

---

#### `<SymbolPalette>`

A three-level hierarchical browser for SignWriting symbols: category groups → base symbols → fill/rotation variants.

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `nav` | `PaletteNavigationState` | `undefined` | Controlled navigation state (use with `v-model:nav`) |
| `clickBehavior` | `'add' \| 'navigate'` | `'add'` | Whether a single click adds the symbol or navigates deeper |

**Events**

| Event | Payload | Description |
|---|---|---|
| `add-symbol` | `key: string` | User selected a symbol to add to the canvas |
| `palette-drop` | `key: string, clientX: number, clientY: number` | User dragged a symbol onto the canvas |
| `update:nav` | `PaletteNavigationState` | Navigation state changed (used by `v-model:nav`) |

**Exposed methods**

| Method | Signature | Description |
|---|---|---|
| `focus` | `() => void` | Moves keyboard focus into the palette |

**Keyboard shortcuts**

| Shortcut | Action |
|---|---|
| Arrow keys | Navigate symbols in the grid |
| `Enter` | Select / drill into symbol or group |
| `Escape` / `Backspace` | Go back to the previous level |
| `Tab` | Move to next focusable element |
| `F6` | Switch focus to canvas |

---

#### `<ToolbarPanel>`

Provides undo, redo, copy FSW, and paste FSW buttons.

**Props**

| Prop | Type | Description |
|---|---|---|
| `canUndo` | `boolean` | Whether undo is available |
| `canRedo` | `boolean` | Whether redo is available |

**Events**

| Event | Description |
|---|---|
| `undo` | User clicked Undo |
| `redo` | User clicked Redo |
| `copy-fsw` | User clicked Copy FSW |
| `paste-fsw` | User clicked Paste FSW |

---

#### `<ZoomControls>`

Standalone zoom control bar with zoom-in/out buttons and a range slider.

**Props**

| Prop | Type | Description |
|---|---|---|
| `viewport` | `ViewportState` | Current viewport (scale and pan offset) |

**Events**

| Event | Payload | Description |
|---|---|---|
| `zoom-in` | — | Zoom in by one step |
| `zoom-out` | — | Zoom out by one step |
| `reset` | — | Reset zoom to 100% |
| `fit` | — | Fit all symbols in the viewport |
| `set-zoom` | `scale: number` | Set an explicit zoom level (e.g., `1.5` for 150%) |

---

#### `<FswPanel>`

A text input for loading and displaying the FSW string of the current sign.

**Props**

| Prop | Type | Description |
|---|---|---|
| `fsw` | `string` | The FSW string representing the current sign |

**Events**

| Event | Payload | Description |
|---|---|---|
| `load-fsw` | `fsw: string` | User submitted a new FSW string to load |

---

#### `<SymbolHandles>`

Renders the manipulation toolbar (rotate, flip, copy, delete) around a selected symbol. Normally used internally by `SignEditorCanvas`, but exported for custom canvas implementations.

**Props**

| Prop | Type | Description |
|---|---|---|
| `state` | `EditorState` | Current editor state |
| `dispatch` | `(command: Command) => void` | Command dispatcher |
| `midWidth` | `number` | Half the canvas width in pixels |
| `midHeight` | `number` | Half the canvas height in pixels |
| `isDragging` | `boolean` | Hides handles while a drag is in progress |
| `viewport` | `ViewportState` | Current viewport for coordinate transforms |

---

### Composables

#### `useSignMaker(options?)`

The recommended entry point. Sets up the complete editor stack: state management, command history, scope routing (palette ↔ canvas), keyboard bindings, and focus management.

```typescript
import { useSignMaker } from '@wallysonruan/signmaker-vue';

const {
  // Reactive state
  state,      // ComputedRef<EditorState>
  canUndo,    // ComputedRef<boolean>
  canRedo,    // ComputedRef<boolean>

  // Scope and palette navigation
  scope,      // ComputedRef<'palette' | 'canvas'>
  paletteNav, // Ref<PaletteNavigationState>

  // Actions
  dispatch,     // (command: Command) => void
  replaceState, // (state: EditorState) => void
  undo,         // () => void
  redo,         // () => void

  // Keyboard attachment
  attach, // (el: EventTarget) => () => void  — returns detach fn

  // Advanced: injectable ports for custom integration
  bus,          // CommandBusPort
  history,      // HistoryPort
  scopeManager, // ScopeManager
  focusManager, // FocusManagerPort
  signMaker,    // SignMaker
} = useSignMaker();
```

**Options**

| Option | Type | Description |
|---|---|---|
| `router.scopeSwitchBinding` | `{ keyCode: number; shift?: boolean; ctrl?: boolean }` | Override the scope-switch key (default: F6) |
| `router.canvasBindings` | `Partial<KeyboardBindings>` | Override individual canvas keyboard bindings |
| `history` | `HistoryPort` | Provide a custom history/undo implementation |

---

#### `useEditorState(options?)`

Lower-level composable for state and history only — no scope switching or keyboard routing.

```typescript
import { useEditorState } from '@wallysonruan/signmaker-vue';

const {
  state, canUndo, canRedo,
  dispatch, replaceState, undo, redo,
  bus, history,
} = useEditorState();
```

Use this when you want to manage keyboard events yourself or integrate with an existing interaction system.

---

#### `useViewport()`

Manages viewport zoom and pan state.

```typescript
import { useViewport } from '@wallysonruan/signmaker-vue';

const {
  viewport,          // Readonly<Ref<ViewportState>>
  zoomIn,            // (screenX, screenY, midW, midH) => void
  zoomOut,           // (screenX, screenY, midW, midH) => void
  zoomAtPoint,       // (screenX, screenY, factor, midW, midH) => void
  setZoom,           // (scale, midW, midH) => void
  reset,             // () => void
  fit,               // (symbols, canvasW, canvasH) => void
  pan,               // (dx, dy) => void
} = useViewport();
```

---

#### `useScopeManager(dispatch, onUndo, onRedo, options?)`

Manages focus scope routing between palette and canvas, and attaches keyboard handlers per scope.

```typescript
import { useScopeManager } from '@wallysonruan/signmaker-vue';

const {
  scope,        // ComputedRef<'palette' | 'canvas'>
  paletteNav,   // Ref<PaletteNavigationState>
  manager,      // ScopeManager
  focusManager, // FocusManagerPort
  attach,       // (el: EventTarget) => () => void
} = useScopeManager(dispatch, undo, redo);
```

---

#### `useKeyboard(dispatch, onUndo, onRedo)`

Attaches the default canvas keyboard bindings to any `EventTarget`, without scope switching.

```typescript
import { useKeyboard } from '@wallysonruan/signmaker-vue';

const { attach } = useKeyboard(dispatch, undo, redo);

onMounted(() => {
  const detach = attach(document);
  onUnmounted(detach);
});
```

---

#### `useSymbolDrag(getState, replaceState, dispatch, getScale?)`

Handles pointer-based symbol repositioning within the canvas.

```typescript
import { useSymbolDrag } from '@wallysonruan/signmaker-vue';

const {
  isDragging,      // ComputedRef<boolean>
  onPointerDown,   // (symbolId, clientX, clientY) => void
  onPointerMove,   // (clientX, clientY) => void
  onPointerUp,     // () => void
  onPointerCancel, // () => void
} = useSymbolDrag(
  () => state.value,
  replaceState,
  dispatch,
  () => viewport.value.scale,
);
```

---

#### `usePaletteDrag(onDrop)`

Handles drag-and-drop from the palette to the canvas, including a ghost preview element.

```typescript
import { usePaletteDrag } from '@wallysonruan/signmaker-vue';

const {
  isDragging,         // ComputedRef<boolean>
  onButtonPointerDown, // (key: string, e: PointerEvent) => void
} = usePaletteDrag((key, clientX, clientY) => {
  canvasRef.value?.dropSymbolAt(key, clientX, clientY);
});
```

---

### TypeScript Types

All public types are exported from the package root.

```typescript
import type {
  // Editor state
  EditorState,
  EditorSymbol,

  // Commands
  Command,

  // Viewport
  ViewportState,

  // Palette navigation
  PaletteNavigationState,

  // Composable return types
  UseSignMakerReturn,
  UseSignMakerOptions,
  UseEditorStateReturn,
  UseEditorStateOptions,
  UseScopeManagerReturn,
  UseScopeManagerOptions,
  UseSymbolDragReturn,
  UsePaletteDragReturn,
  UseViewportReturn,
  UseKeyboardReturn,

  // Ports (for custom integration)
  CommandBusPort,
  HistoryPort,
  ScopeManager,
  FocusManagerPort,

  // Hooks
  BeforeHook,
  AfterHook,
  Interceptor,
  Unsubscribe,
  ReversibleCommand,
} from '@wallysonruan/signmaker-vue';
```

**Core data structures**

```typescript
interface EditorState {
  symbols:   EditorSymbol[];  // Ordered array; later entries render on top
  selection: Set<string>;     // Set of selected symbol IDs
}

interface EditorSymbol {
  id:  string;  // Stable UUID
  key: string;  // 6-character FSW symbol key, e.g. "S14c20"
  x:   number;  // FSW coordinate space (0–999, origin at top-left, center = 500)
  y:   number;
}

interface ViewportState {
  scale:   number;  // Zoom factor: 1 = 100%, 2 = 200%
  offsetX: number;  // Pan offset in pixels
  offsetY: number;
}

interface PaletteNavigationState {
  level:          'groups' | 'bases' | 'variants';
  selectedGroup?: string | null;
  selectedBase?:  string | null;
  focusedIndex:   number;
  variantTab?:    'first' | 'second';  // Rotation range 0–7 or 8–f
}
```

---

## Usage Examples

### Load and export FSW

```typescript
import { stateToFsw, stateFromFsw } from '@wallysonruan/signmaker-vue';

// Export current sign to FSW string
const fsw = stateToFsw(state.value);
// e.g. "M518x518 S14c20 500x500"

// Load a sign from an FSW string
const newState = stateFromFsw('M518x518 S14c20 500x500', () => crypto.randomUUID());
replaceState(newState);
```

### Add a symbol programmatically

```typescript
import { addSymbol } from '@wallysonruan/signmaker-vue';

// Add symbol "S14c20" at the center of the sign space
dispatch(addSymbol('S14c20', 500, 500, () => crypto.randomUUID()));
```

### Intercept commands (analytics, persistence)

```typescript
const { bus, state } = useSignMaker();

// Run after every command
bus.after((command) => {
  const fsw = stateToFsw(state.value);
  localStorage.setItem('sign', fsw);
});
```

### Custom history limit

```typescript
import { createDefaultHistory, useSignMaker } from '@wallysonruan/signmaker-vue';

const history = createDefaultHistory({ maxSize: 50 });
const sm = useSignMaker({ history });
```

### Override scope-switch key (e.g., use Tab instead of F6)

```typescript
const sm = useSignMaker({
  router: {
    scopeSwitchBinding: { keyCode: 9 },  // Tab key
  },
});
```

### Minimal read-only display (state only, no keyboard)

```typescript
import { useEditorState, SignEditorCanvas } from '@wallysonruan/signmaker-vue';
import { stateFromFsw } from '@wallysonruan/signmaker-vue';

const { state, dispatch, replaceState } = useEditorState();

// Load an FSW string once on mount
onMounted(() => {
  replaceState(stateFromFsw(props.fsw, () => crypto.randomUUID()));
});
```

### Integrating with an existing focus system

```typescript
import { createFocusManager, useSignMaker } from '@wallysonruan/signmaker-vue';
import type { FocusManagerPort } from '@wallysonruan/signmaker-vue';

// Provide your own focus manager
const myFocusManager: FocusManagerPort = {
  register(key, fn) { /* ... */ },
  focus(key) { /* ... */ },
};

const sm = useSignMaker({ focusManager: myFocusManager });
```

---

## Customization and Styling

All component styles are **scoped** — they do not leak into the host application and cannot be overridden via global CSS selectors by default. Components use Vue's `<style scoped>` feature.

To customize the appearance, use Vue's [deep selector](https://vuejs.org/guide/components/scoped-styles.html#deep-selectors):

```vue
<style scoped>
/* Customize the canvas background */
:deep(.canvas) {
  background: #0d1117;
}

/* Customize palette button appearance */
:deep(.symbol-button) {
  border-radius: 8px;
}

/* Customize selection highlight */
:deep(.symbol-wrapper.selected) {
  box-shadow: 0 0 0 2px #f59e0b;
}
</style>
```

### Color reference

| Purpose | Default value |
|---|---|
| Primary / focus / selection | `#3b82f6` |
| Canvas background | `#f9fafb` |
| Toolbar background | `#1e293b` |
| Selected symbol outline | `2px solid #3b82f6` |
| Delete button | `#f87171` |
| Copy button | `#4ade80` |

### Responsive breakpoint

Components switch to a mobile layout below **768 px**. On desktop, the palette sits to the right of the canvas with a vertical toolbar. On mobile, the layout stacks vertically (canvas → palette → toolbar) and the zoom slider is hidden.

---

## TypeScript Support

The package ships with `.d.ts` declarations generated by `vue-tsc`. No `@types/` package is needed.

```typescript
import type { EditorState, EditorSymbol, ViewportState } from '@wallysonruan/signmaker-vue';

// Type-safe state access
function getSelectedSymbols(state: EditorState): EditorSymbol[] {
  return state.symbols.filter(s => state.selection.has(s.id));
}
```

TypeScript 5.0 or later is required. The package targets ES2022 and assumes a modern bundler (Vite, Webpack 5, Rollup) or Node.js 18+.

---

## SSR and Nuxt Compatibility

This package is **client-side only**. It relies on:

- Browser fonts for SVG symbol rendering
- Pointer, keyboard, and wheel DOM events
- `requestAnimationFrame` for viewport transitions

**Nuxt users:** register the package as a client-side plugin and wrap usage in `<ClientOnly>`.

```typescript
// plugins/signmaker.client.ts
// (The `.client` suffix tells Nuxt to load this only in the browser)
export default defineNuxtPlugin(() => {
  // No global registration needed — import components directly
});
```

```vue
<!-- pages/editor.vue -->
<template>
  <ClientOnly>
    <SignEditor />
  </ClientOnly>
</template>
```

If you use `nuxt-module` auto-imports, add `@wallysonruan/signmaker-vue` to the `transpile` list in `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  build: {
    transpile: ['@wallysonruan/signmaker-vue'],
  },
});
```

---

## Accessibility

The editor is designed with accessibility as a first-class concern.

### ARIA roles

| Component | Roles used |
|---|---|
| `SymbolPalette` | `navigation`, `grid`, `gridcell`, `tablist`, `tab` |
| `SignEditorCanvas` | `region`, `img` (per symbol), `status` (live region) |
| `ZoomControls` | `toolbar` |

### Screen reader support

- A `role="status"` live region with `aria-live="polite"` announces symbol additions, deletions, and selection changes.
- Every interactive element has an `aria-label`.
- Symbol grid cells include the symbol key as their accessible name.

### Keyboard navigation

All interactions are fully keyboard-accessible. See the keyboard shortcuts listed under each component above. Focus is managed automatically when switching between the palette and canvas scopes.

### Focus management

The palette uses a roving `tabindex` pattern so that only the currently focused item is in the tab order at any time. The canvas similarly moves DOM focus to the selected symbol.

---

## Development

```bash
# 1. Clone the repository
git clone https://github.com/wallysonruan/signmaker.git
cd signmaker

# 2. Install all dependencies and activate git hooks
make install

# 3. Build the Vue package
cd packages/vue
npm run build

# 4. Run tests
npm test

# 5. Watch tests during development
npm run test:watch

# 6. Type-check without emitting
npm run typecheck
```

### Run the demo app

```bash
cd app
npm run dev
```

The demo app at `app/` uses every exported component and composable and is the canonical reference for integration patterns.

---

## Contributing

Bug reports and pull requests are welcome on [GitHub](https://github.com/wallysonruan/signmaker).

- **Bug reports:** Open an issue with a minimal reproduction.
- **Pull requests:** Branch off `main`, keep commits to [Conventional Commits](https://www.conventionalcommits.org/) format (`feat(vue): ...`, `fix(vue): ...`), and ensure `make ci` passes before opening a PR.

Valid commit scopes for this package: **`vue`**

---

## License

[ISC](./LICENSE) © Wallyson Ruan
