<template>
  <div class="app-layout">
    <!-- Header bar -->
    <header class="header-bar">
      <h1 class="app-title">SignMaker</h1>
      <div class="header-controls">
        <button
          class="btn"
          :disabled="!canUndo"
          :aria-label="`Undo (Ctrl+Z)${!canUndo ? ', unavailable' : ''}`"
          @click="undo"
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <button
          class="btn"
          :disabled="!canRedo"
          :aria-label="`Redo (Ctrl+Shift+Z)${!canRedo ? ', unavailable' : ''}`"
          @click="redo"
          title="Redo (Ctrl+Shift+Z)"
        >
          Redo
        </button>
        <!-- Scope indicator for sighted keyboard users -->
        <span
          class="scope-indicator"
          aria-live="polite"
          aria-label="Active scope"
          :title="`Active scope: ${scope} (F6 to switch)`"
        >
          {{ scope === 'palette' ? '⌨ Palette' : '⌨ Canvas' }}
        </span>
        <span class="fsw-display" :title="currentFsw" aria-label="Current FSW string">
          {{ currentFsw || '(empty)' }}
        </span>
      </div>
    </header>

    <!-- Main content area -->
    <div ref="rootRef" class="main-content">
      <!-- Symbol palette sidebar -->
      <SymbolPalette
        ref="paletteRef"
        v-model:nav="paletteNav"
        @add-symbol="handleAddSymbol"
      />

      <!-- Sign editor canvas -->
      <SignEditorCanvas
        ref="canvasRef"
        :state="state"
        :dispatch="dispatch"
        :replace-state="replaceState"
      />
    </div>

    <!-- FSW panel footer -->
    <FswPanel :fsw="currentFsw" @load-fsw="handleLoadFsw" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
  useSignMaker,
  SymbolPalette,
  SignEditorCanvas,
  FswPanel,
} from '@signwriter/vue';
import { stateToFsw, stateFromFsw, addSymbol } from '@signwriter/editor';
import type { IdGenerator } from '@signwriter/editor';

// Single composition root: editor state + history + scope/keyboard/focus.
const {
  state, canUndo, canRedo, dispatch, replaceState, undo, redo,
  scope, paletteNav, focusManager, attach,
} = useSignMaker();

const currentFsw = computed(() => stateToFsw(state.value));
const idGen: IdGenerator = () => crypto.randomUUID();

function handleAddSymbol(key: string) {
  dispatch(addSymbol(key, 500, 500, idGen));
}

function handleLoadFsw(fsw: string) {
  const newState = stateFromFsw(fsw, idGen);
  replaceState(newState);
}

// ─── Scope management ──────────────────────────────────────────────────────────
// useSignMaker exposes a writable `paletteNav` ref.
// Vue auto-unwraps refs in templates, so v-model:nav="paletteNav" works:
//   :nav reads paletteNav.value; @update:nav="paletteNav = $event" writes paletteNav.value.

// Template refs — expose({ focus }) is called by the focus manager on scope change.
const rootRef    = ref<HTMLElement | null>(null);
const paletteRef = ref<{ focus(): void } | null>(null);
const canvasRef  = ref<{ focus(): void } | null>(null);

onMounted(() => {
  // Register focus targets; the focus manager moves focus on scope changes.
  focusManager.register('palette', () => paletteRef.value?.focus());
  focusManager.register('canvas',  () => canvasRef.value?.focus());

  // Attach keyboard to the scoped container (not document) so SignMaker does
  // not capture keys globally and can coexist with other widgets on the page.
  const detach = attach(rootRef.value ?? document);
  onUnmounted(detach);
});
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.header-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  background: #1e293b;
  color: #f1f5f9;
  flex-shrink: 0;
  border-bottom: 1px solid #334155;
}

.app-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  white-space: nowrap;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.btn {
  padding: 4px 12px;
  border: 1px solid #475569;
  border-radius: 4px;
  background: #334155;
  color: #f1f5f9;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.15s;
}

.btn:hover:not(:disabled) {
  background: #475569;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: 2px;
}

.scope-indicator {
  font-size: 0.75rem;
  color: #94a3b8;
  padding: 2px 6px;
  border: 1px solid #334155;
  border-radius: 4px;
  white-space: nowrap;
}

.fsw-display {
  flex: 1;
  font-family: monospace;
  font-size: 0.8rem;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 600px;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
