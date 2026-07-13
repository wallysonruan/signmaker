<template>
  <div class="zoom-controls" role="toolbar" aria-label="Zoom controls">
    <div class="zoom-row">
      <!-- Zoom out -->
      <button
        class="zoom-btn"
        title="Zoom out (Ctrl+−)"
        aria-label="Zoom out"
        :disabled="atMin"
        @click="$emit('zoom-out')"
      >−</button>

      <!-- Percentage — click to reset to 100 % -->
      <button
        class="zoom-pct"
        title="Reset zoom to 100% (Ctrl+0)"
        aria-label="`Current zoom: ${pctText}. Click to reset.`"
        @click="$emit('reset')"
      >{{ pctText }}</button>

      <!-- Zoom in -->
      <button
        class="zoom-btn"
        title="Zoom in (Ctrl+=)"
        aria-label="Zoom in"
        :disabled="atMax"
        @click="$emit('zoom-in')"
      >+</button>

      <!-- Fit content -->
      <button
        class="zoom-btn zoom-btn--fit"
        title="Fit content to view (Ctrl+Shift+F)"
        aria-label="Fit content"
        @click="$emit('fit')"
      >⊡</button>
    </div>

    <!-- Logarithmic range slider (hidden on narrow viewports via CSS) -->
    <div class="zoom-slider-row" aria-hidden="true">
      <input
        type="range"
        class="zoom-slider"
        min="0"
        max="100"
        step="0.1"
        :value="sliderPos"
        title="Drag to adjust zoom"
        @input="onSlider"
        @pointerdown.stop
        @click.stop
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { createZoomSliderModel, type ViewportState } from '@wallysonruan/signmaker-editor-engine';

const props = defineProps<{
  viewport: ViewportState;
}>();

const emit = defineEmits<{
  'zoom-in':  [];
  'zoom-out': [];
  'reset':    [];
  'fit':      [];
  'set-zoom': [scale: number];
}>();

const zm = createZoomSliderModel();

const pctText   = computed(() => zm.formatScale(props.viewport.scale));
const atMin     = computed(() => zm.atMin(props.viewport.scale));
const atMax     = computed(() => zm.atMax(props.viewport.scale));
const sliderPos = computed(() => zm.scaleToSlider(props.viewport.scale));

function onSlider(e: Event): void {
  emit('set-zoom', zm.sliderToScale(Number((e.target as HTMLInputElement).value)));
}
</script>

<style scoped>
.zoom-controls {
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 4px;
  pointer-events: auto;
  user-select: none;
}

.zoom-row {
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(30, 41, 59, 0.92);
  backdrop-filter: blur(4px);
  border-radius: 6px;
  padding: 3px 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.zoom-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  background: transparent;
  color: #e2e8f0;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  transition: background 0.1s, border-color 0.1s;
  touch-action: manipulation;
}

.zoom-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
}

.zoom-btn:active:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.zoom-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.zoom-btn:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: 1px;
}

.zoom-btn--fit {
  font-size: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.18);
  margin-left: 2px;
}

.zoom-pct {
  min-width: 46px;
  height: 26px;
  padding: 0 4px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #f1f5f9;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: center;
  letter-spacing: 0.01em;
  transition: background 0.1s;
}

.zoom-pct:hover {
  background: rgba(255, 255, 255, 0.1);
}

.zoom-pct:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: 1px;
}

/* Slider row */
.zoom-slider-row {
  padding: 0 2px;
}

.zoom-slider {
  width: 120px;
  height: 4px;
  accent-color: #3b82f6;
  cursor: pointer;
}

/* Hide slider on narrow screens (mobile portrait) */
@media (max-width: 767px) {
  .zoom-slider-row {
    display: none;
  }
}
</style>
