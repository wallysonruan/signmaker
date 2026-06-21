<template>
  <div
    ref="canvasEl"
    class="canvas"
    role="region"
    aria-label="Sign canvas"
    :tabindex="0"
    data-canvas
    @click="onCanvasClick"
    @pointermove="onCanvasPointerMove"
    @pointerup="onCanvasPointerUp"
    @pointercancel="onCanvasPointerCancel"
  >
    <div
      v-for="sym in state.symbols"
      :key="sym.id"
      class="symbol-wrapper"
      :class="{ selected: state.selection.has(sym.id) }"
      :style="symbolStyle(sym)"
      :tabindex="state.selection.has(sym.id) ? 0 : -1"
      role="img"
      :aria-label="`Symbol ${sym.key}`"
      :aria-selected="state.selection.has(sym.id)"
      @pointerdown="(e: PointerEvent) => onSymbolPointerDown(sym, e)"
      @click.stop
    >
      <span v-html="renderSym(sym.key)" aria-hidden="true" />
    </div>

    <SymbolHandles
      :state="state"
      :dispatch="dispatch"
      :mid-width="midWidth"
      :mid-height="midHeight"
      :is-dragging="drag.isDragging.value"
    />

    <!-- Screen-reader live region for state change announcements -->
    <div
      ref="liveRegion"
      class="sr-only"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useSymbolDrag } from '../useSymbolDrag';
import { selectNone, addSymbol } from '@signwriter/editor';
import { renderSymbol } from '@signwriter/renderer';
import type { EditorState, EditorSymbol, Command } from '@signwriter/editor';
import SymbolHandles from './SymbolHandles.vue';

const props = defineProps<{
  state: EditorState;
  dispatch: (command: Command) => void;
  replaceState: (state: EditorState) => void;
}>();

const canvasEl   = ref<HTMLElement | null>(null);
const liveRegion = ref<HTMLElement | null>(null);

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
    top:  (y - 500 + midHeight.value) + 'px',
    cursor: drag.isDragging.value ? 'grabbing' : 'grab',
    zIndex: props.state.selection.has(sym.id) ? '10' : '1',
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

function dropSymbolAt(key: string, clientX: number, clientY: number): void {
  if (!canvasEl.value) return;
  const rect = canvasEl.value.getBoundingClientRect();
  const fswX = Math.round(clientX - rect.left - midWidth.value + 500);
  const fswY = Math.round(clientY - rect.top - midHeight.value + 500);
  props.dispatch(addSymbol(key, fswX, fswY, () => crypto.randomUUID()));
}

// ─── Accessibility: live region announcements ──────────────────────────────────

function announce(msg: string): void {
  if (!liveRegion.value) return;
  liveRegion.value.textContent = '';
  requestAnimationFrame(() => {
    if (liveRegion.value) liveRegion.value.textContent = msg;
  });
}

watch(() => props.state, (next, prev) => {
  const added = next.symbols.length - prev.symbols.length;
  if (added > 0) {
    const newest = next.symbols[next.symbols.length - 1];
    announce(`Symbol ${newest?.key ?? ''} added`);
  } else if (added < 0) {
    const n = Math.abs(added);
    announce(n === 1 ? 'Symbol deleted' : `${n} symbols deleted`);
  } else if (next.selection.size !== prev.selection.size) {
    if (next.selection.size === 0) {
      announce('Selection cleared');
    } else {
      const ids = [...next.selection];
      const sym = next.symbols.find((s) => s.id === ids[0]);
      announce(sym ? `${sym.key} selected` : 'Symbol selected');
    }
  }
}, { deep: false });

// ─── Focus management: move DOM focus to selected symbol ───────────────────────

watch(() => props.state.selection, (sel) => {
  if (sel.size !== 1 || !canvasEl.value) return;
  const wrapper = canvasEl.value.querySelector<HTMLElement>('[aria-selected="true"]');
  if (canvasEl.value.contains(document.activeElement)) {
    wrapper?.focus();
  }
}, { deep: true });

/** Focus the canvas element (called by useScopeManager when entering canvas scope). */
function focus(): void {
  const selected = canvasEl.value?.querySelector<HTMLElement>('[aria-selected="true"]');
  (selected ?? canvasEl.value)?.focus();
}

defineExpose({ focus, dropSymbolAt });
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
  outline: none;
}

.canvas:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

.symbol-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  touch-action: none;
  border-radius: 4px;
  outline: none;
}

.symbol-wrapper :deep(svg) {
  display: block;
}

.symbol-wrapper.selected {
  box-shadow: 0 0 0 2px #3b82f6;
}

.symbol-wrapper:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
  pointer-events: none;
}
</style>
