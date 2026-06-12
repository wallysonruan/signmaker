<template>
  <div
    ref="canvasEl"
    class="canvas"
    @click="onCanvasClick"
    @pointermove="onCanvasPointerMove"
    @pointerup="onCanvasPointerUp"
    @pointercancel="onCanvasPointerCancel"
  >
    <div
      v-for="sym in state.symbols"
      :key="sym.id"
      class="symbol-wrapper"
      :style="symbolStyle(sym)"
      @pointerdown="(e: PointerEvent) => onSymbolPointerDown(sym, e)"
      @click.stop
    >
      <span v-html="renderSym(sym.key)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSymbolDrag } from '@signwriter/vue';
import { selectNone } from '@signwriter/editor';
import { renderSymbol } from '@signwriter/renderer';
import type { EditorState, EditorSymbol, Command } from '@signwriter/editor';

const props = defineProps<{
  state: EditorState;
  dispatch: (command: Command) => void;
  replaceState: (state: EditorState) => void;
}>();

const canvasEl = ref<HTMLElement | null>(null);

const midWidth = computed(() => {
  return canvasEl.value ? canvasEl.value.clientWidth / 2 : 300;
});
const midHeight = computed(() => {
  return canvasEl.value ? canvasEl.value.clientHeight / 2 : 250;
});

// Local drag display offset (shows live position before commit)
const dragOffset = ref<{ symbolId: string; dx: number; dy: number } | null>(null);
const dragOrigin = ref<{ x: number; y: number } | null>(null);

const drag = useSymbolDrag(
  () => props.state,
  (s) => props.replaceState(s),
  (c) => props.dispatch(c),
);

function renderSym(key: string): string {
  return renderSymbol(key);
}

function symbolStyle(sym: EditorSymbol): Record<string, string> {
  let x = sym.x;
  let y = sym.y;
  if (dragOffset.value?.symbolId === sym.id) {
    x += dragOffset.value.dx;
    y += dragOffset.value.dy;
  }
  return {
    position: 'absolute',
    left: (x - 500 + midWidth.value) + 'px',
    top: (y - 500 + midHeight.value) + 'px',
    cursor: drag.isDragging.value ? 'grabbing' : 'grab',
    zIndex: props.state.selection.has(sym.id) ? '10' : '1',
    outline: props.state.selection.has(sym.id) ? '2px solid #3b82f6' : 'none',
  };
}

function onSymbolPointerDown(sym: EditorSymbol, e: PointerEvent): void {
  (e.currentTarget as Element).setPointerCapture(e.pointerId);
  e.stopPropagation();
  dragOrigin.value = { x: e.clientX, y: e.clientY };
  dragOffset.value = { symbolId: sym.id, dx: 0, dy: 0 };
  drag.onPointerDown(sym.id, e.clientX, e.clientY);
}

function onCanvasPointerMove(e: PointerEvent): void {
  if (!dragOffset.value || !dragOrigin.value) return;
  dragOffset.value = {
    ...dragOffset.value,
    dx: e.clientX - dragOrigin.value.x,
    dy: e.clientY - dragOrigin.value.y,
  };
  drag.onPointerMove(e.clientX, e.clientY);
}

function onCanvasPointerUp(_e: PointerEvent): void {
  dragOffset.value = null;
  dragOrigin.value = null;
  drag.onPointerUp();
}

function onCanvasPointerCancel(_e: PointerEvent): void {
  dragOffset.value = null;
  dragOrigin.value = null;
  drag.onPointerCancel();
}

function onCanvasClick(_e: MouseEvent): void {
  props.dispatch((state) => selectNone(state));
}
</script>

<style scoped>
.canvas {
  flex: 1;
  position: relative;
  min-height: 500px;
  overflow: hidden;
  background-color: #f9fafb;
  background-image:
    linear-gradient(rgba(203, 213, 225, 0.4) 1px, transparent 1px),
    linear-gradient(90deg, rgba(203, 213, 225, 0.4) 1px, transparent 1px);
  background-size: 20px 20px;
}

.symbol-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  touch-action: none;
}

.symbol-wrapper :deep(svg) {
  display: block;
}
</style>
