<template>
  <div class="app-layout">
    <!-- Header bar -->
    <header class="header-bar">
      <h1 class="app-title">SignMaker</h1>
      <div class="header-controls">
        <button
          class="btn"
          :disabled="!canUndo.value"
          @click="undo"
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <button
          class="btn"
          :disabled="!canRedo.value"
          @click="redo"
          title="Redo (Ctrl+Y)"
        >
          Redo
        </button>
        <span class="fsw-display" :title="currentFsw">
          {{ currentFsw || '(empty)' }}
        </span>
      </div>
    </header>

    <!-- Main content area -->
    <div class="main-content">
      <!-- Symbol palette sidebar -->
      <SymbolPalette @add-symbol="handleAddSymbol" />

      <!-- Sign editor canvas -->
      <SignEditorCanvas
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
import { computed, onMounted, onUnmounted } from 'vue';
import { useEditorState, useKeyboard } from '@signwriter/vue';
import { stateToFsw, stateFromFsw, addSymbol } from '@signwriter/editor';
import type { IdGenerator } from '@signwriter/editor';
import SymbolPalette from './components/SymbolPalette.vue';
import SignEditorCanvas from './components/SignEditorCanvas.vue';
import FswPanel from './components/FswPanel.vue';

const { state, canUndo, canRedo, dispatch, replaceState, undo, redo } = useEditorState();

const currentFsw = computed(() => stateToFsw(state.value));

const idGen: IdGenerator = () => crypto.randomUUID();

function handleAddSymbol(key: string) {
  dispatch(addSymbol(key, 500, 500, idGen));
}

function handleLoadFsw(fsw: string) {
  const newState = stateFromFsw(fsw, idGen);
  replaceState(newState);
}

const kb = useKeyboard(dispatch, undo, redo);

onMounted(() => {
  const detach = kb.attach(document);
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
