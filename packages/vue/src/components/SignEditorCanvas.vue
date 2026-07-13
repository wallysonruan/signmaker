<template>
  <div
    ref="canvasEl"
    class="canvas"
    :class="{ 'canvas--pan': spaceDown }"
    role="region"
    aria-label="Sign canvas"
    :tabindex="0"
    data-canvas
    @keydown="onKeydown"
  >
    <!--
      Virtual scroll layer — sits behind content (z-index 1).
      Its phantom sizer makes the browser show scrollbars when zoomed in.
      Wheel events are always preventDefault()'d so only scrollbar drags
      move this layer; we translate those into viewport pans.
    -->
    <div
      v-if="isZoomedIn"
      ref="scrollLayerEl"
      class="canvas-scroll-layer"
      @scroll.passive="onScrollLayerScroll"
    >
      <div class="canvas-scroll-sizer" :style="scrollSizerStyle" />
    </div>

    <!-- Content layer: symbols in FSW world space, scaled by viewport transform -->
    <div class="canvas-content" :style="contentStyle">
      <div
        v-for="sym in state.symbols"
        :key="sym.id"
        class="symbol-wrapper"
        :class="{ selected: state.selection.has(sym.id) }"
        :style="symbolStyle(sym)"
        :tabindex="state.selection.has(sym.id) ? 0 : -1"
        :data-symbol-id="sym.id"
        role="img"
        :aria-label="`Symbol ${sym.key}`"
        :aria-selected="state.selection.has(sym.id)"
        @click.stop
      >
        <span v-html="renderSym(sym.key)" aria-hidden="true" />
      </div>
    </div>

    <!-- Zoom controls — screen space, outside transform layer -->
    <ZoomControls
      :viewport="viewport"
      @zoom-in="onZoomIn"
      @zoom-out="onZoomOut"
      @reset="reset()"
      @fit="onFit"
      @set-zoom="(s) => setZoom(s, midWidth, midHeight)"
    />

    <!-- Selection handles — screen space, outside transform layer -->
    <SymbolHandles
      :state="state"
      :dispatch="dispatch"
      :mid-width="midWidth"
      :mid-height="midHeight"
      :is-dragging="drag.isDragging.value"
      :viewport="viewport"
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
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useSymbolDrag } from '../useSymbolDrag';
import { useViewport } from '../useViewport';
import { selectNone, addSymbol, screenToWorld } from '@wallysonruan/signmaker-editor-engine';
import { renderSymbol } from '@wallysonruan/signmaker-renderer';
import { createGestureController } from '@wallysonruan/signmaker-interactions';
import type { EditorState, EditorSymbol, Command } from '@wallysonruan/signmaker-editor-engine';
import SymbolHandles from './SymbolHandles.vue';
import ZoomControls  from './ZoomControls.vue';

const props = defineProps<{
  state: EditorState;
  dispatch: (command: Command) => void;
  replaceState: (state: EditorState) => void;
}>();

// ─── Canvas element + size ────────────────────────────────────────────────────

const canvasEl    = ref<HTMLElement | null>(null);
const liveRegion  = ref<HTMLElement | null>(null);
const scrollLayerEl = ref<HTMLElement | null>(null);

const canvasW = ref(600);
const canvasH = ref(500);

const midWidth  = computed(() => canvasW.value / 2);
const midHeight = computed(() => canvasH.value / 2);

// ─── Viewport ─────────────────────────────────────────────────────────────────

const { viewport, zoomIn, zoomOut, zoomAtPoint, setZoom, reset, fit, pan } = useViewport();

const contentStyle = computed(() => ({
  transform: `translate(${midWidth.value + viewport.value.offsetX}px, ${midHeight.value + viewport.value.offsetY}px) scale(${viewport.value.scale})`,
}));

function onZoomIn(): void {
  zoomIn(midWidth.value, midHeight.value, midWidth.value, midHeight.value);
}

function onZoomOut(): void {
  zoomOut(midWidth.value, midHeight.value, midWidth.value, midHeight.value);
}

function onFit(): void {
  fit(props.state.symbols, canvasW.value, canvasH.value);
}

// ─── Virtual scroll layer (scrollbars when zoomed in) ─────────────────────────

const isZoomedIn = computed(() => viewport.value.scale > 1);

/** Phantom sizer: 2× the canvas at current scale so scrollbars have room. */
const scrollSizerStyle = computed(() => {
  const s = viewport.value.scale;
  return {
    width:  (canvasW.value  * s * 2) + 'px',
    height: (canvasH.value * s * 2) + 'px',
    pointerEvents: 'none' as const,
  };
});

/**
 * Sync: viewport → scrollLayer.
 * scrollLeft = midW * scale - offsetX  (center = 0 pan)
 * scrollTop  = midH * scale - offsetY
 */
let syncingScroll = false;

function syncScrollFromViewport(): void {
  const el = scrollLayerEl.value;
  if (!el) return;
  syncingScroll = true;
  const vp = viewport.value;
  el.scrollLeft = midWidth.value  * vp.scale - vp.offsetX;
  el.scrollTop  = midHeight.value * vp.scale - vp.offsetY;
  requestAnimationFrame(() => { syncingScroll = false; });
}

/** Sync: scrollLayer drag → viewport pan. */
function onScrollLayerScroll(e: Event): void {
  if (syncingScroll) return;
  const el = e.target as HTMLElement;
  const vp = viewport.value;
  const newOffsetX = midWidth.value  * vp.scale - el.scrollLeft;
  const newOffsetY = midHeight.value * vp.scale - el.scrollTop;
  const dx = newOffsetX - vp.offsetX;
  const dy = newOffsetY - vp.offsetY;
  if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) pan(dx, dy);
}

// Keep scrollLayer in sync whenever the viewport changes.
watch(() => viewport.value, () => {
  if (isZoomedIn.value) syncScrollFromViewport();
}, { flush: 'post' });

// Initialise scroll position the first frame the layer is mounted.
watch(isZoomedIn, (nowZoomed) => {
  if (nowZoomed) nextTick(() => syncScrollFromViewport());
});

// ─── Symbol drag ──────────────────────────────────────────────────────────────

const dragOffset = ref<{ symbolId: string; dx: number; dy: number } | null>(null);
const dragOrigin = ref<{ x: number; y: number } | null>(null);

const drag = useSymbolDrag(
  () => props.state,
  (s) => props.replaceState(s),
  (c) => props.dispatch(c),
  () => viewport.value.scale,
);

function renderSym(key: string): string {
  return renderSymbol(key);
}

function symbolStyle(sym: EditorSymbol): Record<string, string> {
  let wx = sym.x - 500;
  let wy = sym.y - 500;
  if (dragOffset.value?.symbolId === sym.id) {
    wx += dragOffset.value.dx;
    wy += dragOffset.value.dy;
  }
  return {
    position: 'absolute',
    left:   wx + 'px',
    top:    wy + 'px',
    cursor: drag.isDragging.value ? 'grabbing' : 'grab',
    zIndex: props.state.selection.has(sym.id) ? '10' : '1',
  };
}

// ─── Gesture controller (pointer / pinch / wheel / pan / space) ──────────────

const spaceDown = ref(false);

const gesture = createGestureController({
  onZoom(factor, screenX, screenY) {
    zoomAtPoint(screenX, screenY, factor, midWidth.value, midHeight.value);
  },
  onPan(dx, dy) {
    pan(dx, dy);
  },
  onSymbolPointerDown(symbolId, clientX, clientY) {
    dragOrigin.value = { x: clientX, y: clientY };
    dragOffset.value = { symbolId, dx: 0, dy: 0 };
    drag.onPointerDown(symbolId, clientX, clientY);
  },
  onSymbolPointerMove(clientX, clientY) {
    if (!dragOffset.value || !dragOrigin.value) return;
    const scale = viewport.value.scale;
    dragOffset.value = {
      ...dragOffset.value,
      dx: (clientX - dragOrigin.value.x) / scale,
      dy: (clientY - dragOrigin.value.y) / scale,
    };
    drag.onPointerMove(clientX, clientY);
  },
  onSymbolPointerUp() {
    dragOffset.value = null;
    dragOrigin.value = null;
    drag.onPointerUp();
  },
  onSymbolPointerCancel() {
    dragOffset.value = null;
    dragOrigin.value = null;
    drag.onPointerCancel();
  },
  onBackgroundClick() {
    props.dispatch((state) => selectNone(state));
  },
  onSpaceDown() { spaceDown.value = true; },
  onSpaceUp()   { spaceDown.value = false; },
});

// ─── Keyboard shortcuts (Ctrl+= / Ctrl+- / etc.) ─────────────────────────────

function onKeydown(e: KeyboardEvent): void {
  const mod = e.ctrlKey || e.metaKey;
  if (!mod) return;

  switch (e.key) {
    case '=':
    case '+':
      e.preventDefault();
      onZoomIn();
      break;
    case '-':
    case '_':
      e.preventDefault();
      onZoomOut();
      break;
    case '0':
      e.preventDefault();
      reset();
      break;
    case 'F':
    case 'f':
      if (e.shiftKey) {
        e.preventDefault();
        onFit();
      }
      break;
  }
}

// ─── Drop symbol from palette ─────────────────────────────────────────────────

function dropSymbolAt(key: string, clientX: number, clientY: number): void {
  if (!canvasEl.value) return;
  const rect    = canvasEl.value.getBoundingClientRect();
  const screenX = clientX - rect.left;
  const screenY = clientY - rect.top;
  const { x: fswX, y: fswY } = screenToWorld(screenX, screenY, viewport.value, midWidth.value, midHeight.value);
  props.dispatch(addSymbol(key, Math.round(fswX), Math.round(fswY), () => crypto.randomUUID()));
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

// ─── Lifecycle ────────────────────────────────────────────────────────────────

let resizeObserver: ResizeObserver | null = null;
let detachGestures: (() => void) | null = null;

onMounted(() => {
  if (canvasEl.value) {
    canvasW.value = canvasEl.value.clientWidth;
    canvasH.value = canvasEl.value.clientHeight;

    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        canvasW.value = entry.contentRect.width;
        canvasH.value = entry.contentRect.height;
      }
    });
    resizeObserver.observe(canvasEl.value);

    detachGestures = gesture.attach(canvasEl.value);
  }
});

onBeforeUnmount(() => {
  detachGestures?.();
  resizeObserver?.disconnect();
});

defineExpose({ focus, dropSymbolAt });
</script>

<style scoped>
.canvas {
  flex: 1;
  position: relative;
  min-height: 0;
  overflow: hidden;
  background-color: #f9fafb;
  background-image:
    linear-gradient(rgba(203, 213, 225, 0.4) 1px, transparent 1px),
    linear-gradient(90deg, rgba(203, 213, 225, 0.4) 1px, transparent 1px);
  background-size: 20px 20px;
  outline: none;
  touch-action: none; /* Disable browser pan/zoom — we handle it */
}

.canvas:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

.canvas--pan {
  cursor: grab;
}

.canvas--pan:active {
  cursor: grabbing;
}

/* Virtual scroll layer: behind all content but provides native scrollbars */
.canvas-scroll-layer {
  position: absolute;
  inset: 0;
  overflow: auto;
  z-index: 1;
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.45) transparent;
}

.canvas-scroll-layer::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.canvas-scroll-layer::-webkit-scrollbar-track {
  background: transparent;
}

.canvas-scroll-layer::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.45);
  border-radius: 4px;
}

.canvas-scroll-layer::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.7);
}

.canvas-scroll-layer::-webkit-scrollbar-corner {
  background: transparent;
}

/* The content layer sits at (0,0) and is moved by the viewport transform */
.canvas-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  z-index: 2; /* Above scroll layer (z-index: 1) */
  transform-origin: 0 0;
  will-change: transform;
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
