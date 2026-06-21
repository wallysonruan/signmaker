<template>
  <div ref="rootRef" class="app-layout">
    <!-- Sign editor canvas (left on md+, top on sm) -->
    <SignEditorCanvas
      ref="canvasRef"
      :state="state"
      :dispatch="dispatch"
      :replace-state="replaceState"
    />

    <!-- Vertical toolbar (md+) / horizontal toolbar (sm) -->
    <ToolbarPanel
      :can-undo="canUndo"
      :can-redo="canRedo"
      @undo="undo"
      @redo="redo"
      @copy-fsw="handleCopyFsw"
      @paste-fsw="handlePasteFsw"
    />

    <!-- Symbol palette (right on md+, middle on sm) -->
    <SymbolPalette
      ref="paletteRef"
      v-model:nav="paletteNav"
      @add-symbol="handleAddSymbol"
      @palette-drop="onPaletteDrop"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
  useSignMaker,
  SymbolPalette,
  SignEditorCanvas,
  ToolbarPanel,
} from '@signwriter/vue';
import { stateToFsw, stateFromFsw, addSymbol } from '@signwriter/editor';
import type { IdGenerator } from '@signwriter/editor';

const {
  state, canUndo, canRedo, dispatch, replaceState, undo, redo,
  paletteNav, focusManager, attach,
} = useSignMaker();

const currentFsw = computed(() => stateToFsw(state.value));
const idGen: IdGenerator = () => crypto.randomUUID();

function handleAddSymbol(key: string) {
  dispatch(addSymbol(key, 500, 500, idGen));
}

function onPaletteDrop(key: string, clientX: number, clientY: number) {
  canvasRef.value?.dropSymbolAt(key, clientX, clientY);
}

function handleLoadFsw(fsw: string) {
  const newState = stateFromFsw(fsw, idGen);
  replaceState(newState);
}

async function handleCopyFsw() {
  try { await navigator.clipboard.writeText(currentFsw.value); } catch { /* denied */ }
}

async function handlePasteFsw() {
  try {
    const text = await navigator.clipboard.readText();
    if (text.trim()) handleLoadFsw(text.trim());
  } catch { /* denied */ }
}

const rootRef    = ref<HTMLElement | null>(null);
const paletteRef = ref<{ focus(): void } | null>(null);
const canvasRef  = ref<{ focus(): void; dropSymbolAt(key: string, clientX: number, clientY: number): void } | null>(null);

onMounted(() => {
  focusManager.register('palette', () => paletteRef.value?.focus());
  focusManager.register('canvas',  () => canvasRef.value?.focus());

  const detach = attach(rootRef.value ?? document);
  onUnmounted(detach);
});
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: row;
  height: 100vh;
  overflow: hidden;
}

@media (max-width: 767px) {
  .app-layout {
    flex-direction: column;
  }

  .app-layout :deep(.canvas)   { order: 1; }
  .app-layout :deep(.palette)  { order: 2; }
  .app-layout :deep(.toolbar)  { order: 3; }
}
</style>
