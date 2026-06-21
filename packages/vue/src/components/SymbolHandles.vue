<template>
  <div
    v-if="box"
    class="handles-root"
    :style="rootStyle"
    @click.stop
    @pointerdown.stop
  >
    <!-- Bounding box outline with corner handles -->
    <div class="handles-box">
      <span class="handle handle--tl" />
      <span class="handle handle--tr" />
      <span class="handle handle--bl" />
      <span class="handle handle--br" />
    </div>

    <!-- Toolbar above: rotate controls -->
    <div class="handles-toolbar handles-toolbar--top">
      <button class="handle-btn" title="Rotate counter-clockwise" @click="rotateCCW">↺</button>
      <button class="handle-btn" title="Rotate clockwise" @click="rotateCW">↻</button>
    </div>

    <!-- Toolbar below: flip + copy + delete -->
    <div class="handles-toolbar handles-toolbar--bottom">
      <button class="handle-btn" title="Flip horizontal" @click="flipHorizontal">⟺</button>
      <button class="handle-btn" title="Flip vertical" @click="flipVertical">↕</button>
      <button class="handle-btn handle-btn--copy" title="Copy symbol" @click="copySymbol">⊕</button>
      <button
        class="handle-btn handle-btn--delete"
        title="Delete symbol (Backspace)"
        aria-label="Delete symbol"
        @click="deleteSymbol"
      >✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  getSelected,
  rotateSelected,
  mirrorSelected,
  copySelected,
  deleteSelected,
} from '@signwriter/editor';
import type { ViewportState } from '@signwriter/editor';
import { getSymbolSize } from '@signwriter/renderer';
import type { EditorState, Command } from '@signwriter/editor';

const props = defineProps<{
  state: EditorState;
  dispatch: (command: Command) => void;
  midWidth: number;
  midHeight: number;
  isDragging: boolean;
  viewport: ViewportState;
}>();

const selected = computed(() => {
  if (props.isDragging) return null;
  const sel = getSelected(props.state);
  return sel.length === 1 ? sel[0] : null;
});

const box = computed(() => {
  const sym = selected.value;
  if (!sym) return null;
  const size = getSymbolSize(sym.key) ?? { width: 40, height: 40 };
  const { scale, offsetX, offsetY } = props.viewport;
  return {
    left:   (sym.x - 500) * scale + props.midWidth + offsetX,
    top:    (sym.y - 500) * scale + props.midHeight + offsetY,
    width:  size.width  * scale,
    height: size.height * scale,
  };
});

const rootStyle = computed(() => {
  const b = box.value;
  if (!b) return {};
  return {
    position:      'absolute' as const,
    left:          b.left   + 'px',
    top:           b.top    + 'px',
    width:         b.width  + 'px',
    height:        b.height + 'px',
    zIndex:        '20',
    pointerEvents: 'none' as const,
  };
});

function rotateCCW(): void {
  props.dispatch(rotateSelected(-1));
}

function rotateCW(): void {
  props.dispatch(rotateSelected(1));
}

function flipHorizontal(): void {
  props.dispatch(mirrorSelected());
}

function flipVertical(): void {
  // Rotate 180° (4 nibble steps) then mirror = geometric vertical flip
  props.dispatch((s) => mirrorSelected()(rotateSelected(4)(s)));
}

function copySymbol(): void {
  props.dispatch(copySelected(() => crypto.randomUUID()));
}

function deleteSymbol(): void {
  props.dispatch(deleteSelected());
}
</script>

<style scoped>
.handles-root {
  /* pointer-events: none on root; children opt in */
}

.handles-box {
  position: absolute;
  inset: 0;
  border: 2px solid #3b82f6;
  border-radius: 2px;
  pointer-events: none;
}

/* Corner handles */
.handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #fff;
  border: 2px solid #3b82f6;
  border-radius: 1px;
}
.handle--tl { top: -4px;  left: -4px; }
.handle--tr { top: -4px;  right: -4px; }
.handle--bl { bottom: -4px; left: -4px; }
.handle--br { bottom: -4px; right: -4px; }

/* Toolbars */
.handles-toolbar {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 3px;
  pointer-events: auto;
}

.handles-toolbar--top {
  bottom: calc(100% + 6px);
}

.handles-toolbar--bottom {
  top: calc(100% + 6px);
}

.handle-btn {
  width: 26px;
  height: 26px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border: 1px solid #93c5fd;
  border-radius: 4px;
  background: #eff6ff;
  color: #1d4ed8;
  cursor: pointer;
  line-height: 1;
  transition: background 0.1s, border-color 0.1s;
  user-select: none;
}

.handle-btn:hover {
  background: #dbeafe;
  border-color: #3b82f6;
}

.handle-btn:active {
  background: #bfdbfe;
}

.handle-btn--copy {
  border-color: #86efac;
  background: #f0fdf4;
  color: #15803d;
}

.handle-btn--copy:hover {
  background: #dcfce7;
  border-color: #4ade80;
}

.handle-btn--delete {
  border-color: #fca5a5;
  background: #fff1f2;
  color: #dc2626;
}

.handle-btn--delete:hover {
  background: #fee2e2;
  border-color: #f87171;
}

.handle-btn--delete:active {
  background: #fecaca;
}
</style>
