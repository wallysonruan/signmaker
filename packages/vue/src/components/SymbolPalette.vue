<template>
  <aside
    ref="paletteEl"
    class="palette"
    role="navigation"
    aria-label="Symbol palette"
    data-palette
    @keydown="handleKeydown"
  >
    <!-- Groups level: group grid -->
    <div v-if="navState.level === 'groups'" class="palette-section">
      <div class="palette-title" aria-hidden="true">Symbol Groups</div>
      <div
        class="group-grid"
        role="grid"
        aria-label="Symbol groups"
        :aria-rowcount="Math.ceil(GROUPS.length / 4)"
      >
        <button
          v-for="(groupKey, idx) in GROUPS"
          :key="groupKey"
          class="group-btn"
          :title="groupKey"
          :aria-label="groupKey"
          :tabindex="idx === navState.focusedIndex ? 0 : -1"
          :aria-selected="idx === navState.focusedIndex"
          @pointerdown="paletteDrag.onButtonPointerDown(groupKey, $event)"
          @click="onItemClick(groupKey)"
          @dblclick.prevent="onItemDblClick(idx, groupKey)"
        >
          <span class="symbol-cell" v-html="renderGroupIcon(groupKey)" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Bases level: base symbols within group -->
    <div v-else-if="navState.level === 'bases' && navState.selectedGroup !== null" class="palette-section">
      <div class="palette-nav">
        <button class="back-btn" @click="onBack">&#8592; Groups</button>
        <span class="palette-title" aria-live="polite">{{ navState.selectedGroup }}</span>
      </div>
      <div
        class="symbol-grid"
        role="grid"
        :aria-label="`Symbols in ${navState.selectedGroup}`"
        :aria-rowcount="Math.ceil(currentItems.length / 4)"
      >
        <button
          v-for="(baseKey, idx) in currentItems"
          :key="baseKey"
          class="symbol-btn"
          :title="baseKey"
          :aria-label="baseKey"
          :tabindex="idx === navState.focusedIndex ? 0 : -1"
          :aria-selected="idx === navState.focusedIndex"
          @pointerdown="paletteDrag.onButtonPointerDown(baseKey, $event)"
          @click="onItemClick(baseKey)"
          @dblclick.prevent="onItemDblClick(idx, baseKey)"
        >
          <span class="symbol-cell" v-html="renderGroupIcon(baseKey)" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Variants level: fill/rotation variants -->
    <div v-else-if="navState.level === 'variants' && navState.selectedBase !== null" class="palette-section">
      <div class="palette-nav">
        <button class="back-btn" @click="onBack">&#8592; Base</button>
        <span class="palette-title" aria-live="polite">{{ navState.selectedBase }}</span>
      </div>
      <div class="tab-bar" role="tablist" aria-label="Rotation range">
        <button
          role="tab"
          class="tab-btn"
          :class="{ active: navState.variantTab === 'first' }"
          :aria-selected="navState.variantTab === 'first'"
          @click="onSetTab('first')"
        >0–7</button>
        <button
          role="tab"
          class="tab-btn"
          :class="{ active: navState.variantTab === 'second' }"
          :aria-selected="navState.variantTab === 'second'"
          @click="onSetTab('second')"
        >8–f</button>
      </div>
      <div
        class="variant-grid"
        role="grid"
        :aria-label="`Variants for ${navState.selectedBase}, rotations ${navState.variantTab === 'first' ? '0–7' : '8–f'}`"
        aria-rowcount="6"
      >
        <template v-for="fillIdx in 6" :key="fillIdx">
          <button
            v-for="rotIdx in 8"
            :key="rotIdx"
            class="symbol-btn"
            :title="variantKey(navState.selectedBase, fillIdx - 1, (navState.variantTab === 'second' ? 8 : 0) + rotIdx - 1)"
            :aria-label="variantKey(navState.selectedBase, fillIdx - 1, (navState.variantTab === 'second' ? 8 : 0) + rotIdx - 1)"
            :tabindex="(fillIdx - 1) * 8 + (rotIdx - 1) === navState.focusedIndex ? 0 : -1"
            :aria-selected="(fillIdx - 1) * 8 + (rotIdx - 1) === navState.focusedIndex"
            @pointerdown="paletteDrag.onButtonPointerDown(variantKey(navState.selectedBase, fillIdx - 1, (navState.variantTab === 'second' ? 8 : 0) + rotIdx - 1), $event)"
            @click="emit('add-symbol', variantKey(navState.selectedBase, fillIdx - 1, (navState.variantTab === 'second' ? 8 : 0) + rotIdx - 1))"
          >
            <span
              class="symbol-cell"
              v-html="renderGroupIcon(variantKey(navState.selectedBase, fillIdx - 1, (navState.variantTab === 'second' ? 8 : 0) + rotIdx - 1))"
              aria-hidden="true"
            />
          </button>
        </template>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted } from 'vue';
import { renderSymbol } from '@signwriter/renderer';
import { usePaletteDrag } from '../usePaletteDrag';
import { ALPHABET, GROUPS } from '../data/alphabet';
import {
  INITIAL_PALETTE_NAV,
  paletteEnterGroup,
  paletteEnterBase,
  paletteSetVariantTab,
  paletteBack,
  type PaletteNavigationState,
  type VariantTab,
} from '@signwriter/editor';
import { usePaletteScope } from '../usePaletteScope';
import { debounce } from '../debounce';

const props = defineProps<{
  /** External navigation state. When provided the component is controlled (model-style). */
  nav?: PaletteNavigationState;
  /** 'add' (default): single click adds to canvas; dblclick expands.
      'navigate': preserves legacy single-click drill-down. */
  clickBehavior?: 'add' | 'navigate';
}>();

const emit = defineEmits<{
  'add-symbol': [key: string];
  'palette-drop': [key: string, clientX: number, clientY: number];
  /** Emitted when nav state changes in controlled mode (use with v-model:nav). */
  'update:nav': [state: PaletteNavigationState];
}>();

const paletteEl = ref<HTMLElement | null>(null);
const internalNav = ref<PaletteNavigationState>(INITIAL_PALETTE_NAV);

const paletteDrag = usePaletteDrag((key, clientX, clientY) => {
  emit('palette-drop', key, clientX, clientY);
});

const navState = computed<PaletteNavigationState>(() => props.nav ?? internalNav.value);

function applyNav(next: PaletteNavigationState): void {
  if (props.nav !== undefined) {
    emit('update:nav', next);
  } else {
    internalNav.value = next;
  }
  // Focus the button that now has focusedIndex
  nextTick(() => focusActive());
}

function focusActive(): boolean {
  if (!paletteEl.value) return false;
  const btn = paletteEl.value.querySelector<HTMLElement>('[tabindex="0"]');
  if (!btn) return false;
  btn.focus();
  return true;
}

// All keyboard navigation logic lives in the framework-agnostic palette scope.
// The component only feeds it the current nav and reflects the result via
// applyNav (which preserves the controlled v-model:nav contract).
const paletteScope = usePaletteScope((key) => emit('add-symbol', key));
paletteScope.onNavChanged((next) => applyNav(next));

const currentItems = computed<string[]>(() => {
  const s = navState.value;
  if (s.level === 'groups') return GROUPS;
  if (s.level === 'bases' && s.selectedGroup !== null) return ALPHABET[s.selectedGroup] ?? [];
  return [];
});

function renderGroupIcon(key: string): string {
  return renderSymbol(key);
}

function variantKey(baseKey: string, fillDigit: number, rotation: number): string {
  return baseKey.slice(0, 4) + fillDigit.toString() + rotation.toString(16);
}

// ─── Click/dblclick interaction model ─────────────────────────────────────────

const addSymbolDebounced = debounce((key: string) => emit('add-symbol', key), 300);
onUnmounted(() => addSymbolDebounced.cancel());

function onItemClick(key: string): void {
  if ((props.clickBehavior ?? 'add') === 'add') {
    addSymbolDebounced(key);
  } else {
    // Legacy navigate mode — single click drills down immediately
    if (navState.value.level === 'groups') applyNav(paletteEnterGroup(navState.value, key));
    else if (navState.value.level === 'bases') applyNav(paletteEnterBase(navState.value, key));
  }
}

function onItemDblClick(idx: number, key: string): void {
  if ((props.clickBehavior ?? 'add') === 'navigate') {
    // Legacy mode: dblclick does nothing extra (single click already navigated)
    return;
  }
  // Cancel any pending debounced add before expanding variants
  addSymbolDebounced.cancel();
  // New model: dblclick expands
  if (navState.value.level === 'groups') {
    applyNav(paletteEnterGroup({ ...navState.value, focusedIndex: idx }, key));
  } else if (navState.value.level === 'bases') {
    applyNav(paletteEnterBase({ ...navState.value, focusedIndex: idx }, key));
  }
}

function onBack(): void {
  applyNav(paletteBack(navState.value));
}

function onSetTab(tab: VariantTab): void {
  applyNav(paletteSetVariantTab(navState.value, tab));
}

// ─── Keyboard handling ─────────────────────────────────────────────────────────

function handleKeydown(e: KeyboardEvent): void {
  // Sync the scope to the current (possibly externally controlled) nav, then let
  // it handle the key. Reference-equality in the scope makes this a no-op when
  // nav is already in sync, so no redundant update:nav is emitted.
  paletteScope.setNav(navState.value);
  const consumed = paletteScope.scope.handleKey({
    keyCode:  e.keyCode,
    key:      e.key,
    shiftKey: e.shiftKey,
    ctrlKey:  e.ctrlKey,
    metaKey:  e.metaKey,
  });
  // Consumed keys (arrows, Enter, Escape while backing out) are owned by the
  // palette; F6 and Escape-at-groups are left to bubble for scope switching.
  if (consumed) {
    e.preventDefault();
    e.stopPropagation();
  }
}

/** Focus the palette root element (called by useScopeManager when entering palette scope). */
function focus(): void {
  nextTick(() => {
    focusActive() || paletteEl.value?.focus();
  });
}

defineExpose({ focus });
</script>

<style scoped>
.palette {
  width: 280px;
  flex-shrink: 0;
  min-height: 0; /* Allow flex to constrain height so overflow-y: auto triggers */
  background: #f8fafc;
  border-left: 1px solid #e2e8f0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  outline: none;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.palette::-webkit-scrollbar {
  width: 6px;
}

.palette::-webkit-scrollbar-track {
  background: transparent;
}

.palette::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.palette::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.palette-section {
  padding: 8px;
}

.palette-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  padding: 0 2px;
}

.palette-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.back-btn {
  padding: 2px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #fff;
  color: #475569;
  cursor: pointer;
  font-size: 0.75rem;
}

.back-btn:hover {
  background: #f1f5f9;
}

.back-btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.symbol-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.variant-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
}

.group-btn,
.symbol-btn {
  width: 100%;
  aspect-ratio: 1;
  padding: 2px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: border-color 0.1s, background 0.1s;
  touch-action: none;
}

.group-btn:hover,
.symbol-btn:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.group-btn:focus-visible,
.symbol-btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-color: #3b82f6;
  background: #eff6ff;
}

.symbol-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  overflow: hidden;
}

.symbol-cell :deep(svg) {
  max-width: 100%;
  max-height: 100%;
}

.tab-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.tab-btn {
  padding: 2px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #fff;
  color: #475569;
  cursor: pointer;
  font-size: 0.75rem;
}

.tab-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

.tab-btn:hover:not(.active) {
  background: #f1f5f9;
}

.tab-btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

@media (max-width: 767px) {
  /* Palette shrinks to fit its content, but never taller than this cap */
  .palette {
    width: 100%;
    max-height: clamp(200px, 36vh, 280px);   /* fallback */
    max-height: clamp(200px, 36dvh, 280px);  /* tracks dynamic viewport */
    flex-shrink: 0;
    border-left: none;
    border-top: 1px solid #e2e8f0;
    overflow: hidden;
  }

  /* Section fills the palette and lays out header + grid as a flex column */
  .palette-section {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 3px 4px;
    overflow: hidden;
  }

  /* Compact header text */
  .palette-title {
    flex-shrink: 0;
    font-size: 0.65rem;
    line-height: 1;
    margin-bottom: 2px;
    padding: 0;
  }

  /* Compact back-navigation bar */
  .palette-nav {
    flex-shrink: 0;
    gap: 4px;
    margin-bottom: 2px;
  }

  .back-btn {
    font-size: 0.65rem;
    padding: 1px 6px;
  }

  /* Compact rotation tab bar */
  .tab-bar {
    flex-shrink: 0;
    gap: 2px;
    margin-bottom: 2px;
  }

  .tab-btn {
    font-size: 0.65rem;
    padding: 1px 6px;
  }

  /* Groups and bases: 6 columns, keyboard-like rows */
  .group-grid,
  .symbol-grid {
    grid-template-columns: repeat(6, 1fr);
    grid-auto-rows: 38px;
    gap: 2px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    align-content: start;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }

  /* Variants: 8 columns, shorter rows to fit all 6×8 entries */
  .variant-grid {
    grid-template-columns: repeat(8, 1fr);
    grid-auto-rows: 30px;
    gap: 1px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    align-content: start;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
  }

  .group-grid::-webkit-scrollbar,
  .symbol-grid::-webkit-scrollbar,
  .variant-grid::-webkit-scrollbar {
    width: 4px;
  }

  .group-grid::-webkit-scrollbar-track,
  .symbol-grid::-webkit-scrollbar-track,
  .variant-grid::-webkit-scrollbar-track {
    background: transparent;
  }

  .group-grid::-webkit-scrollbar-thumb,
  .symbol-grid::-webkit-scrollbar-thumb,
  .variant-grid::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }

  /* Buttons fill their grid cell height instead of using aspect-ratio */
  .group-btn,
  .symbol-btn {
    aspect-ratio: auto;
    height: 100%;
    padding: 1px;
  }

  /* Symbol cell expands to fill the button so the SVG scales with it */
  .symbol-cell {
    width: 100%;
    height: 100%;
  }

  .symbol-cell :deep(svg) {
    max-width: 100%;
    max-height: 100%;
  }
}
</style>
