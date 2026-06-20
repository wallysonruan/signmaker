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
          draggable="true"
          @dragstart="onDragStart($event, groupKey)"
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
          draggable="true"
          @dragstart="onDragStart($event, baseKey)"
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
            draggable="true"
            @dragstart="onDragStart($event, variantKey(navState.selectedBase, fillIdx - 1, (navState.variantTab === 'second' ? 8 : 0) + rotIdx - 1))"
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
import { ref, computed, nextTick } from 'vue';
import { renderSymbol } from '@signwriter/renderer';
import { ALPHABET, GROUPS } from '../data/alphabet';
import {
  INITIAL_PALETTE_NAV,
  paletteNavigate,
  paletteEnterGroup,
  paletteEnterBase,
  paletteSetVariantTab,
  paletteBack,
  paletteLevel2FocusedKey,
  type PaletteNavigationState,
  type VariantTab,
} from '@signwriter/editor';

const props = defineProps<{
  /** External navigation state. When provided the component is controlled (model-style). */
  nav?: PaletteNavigationState;
  /** 'add' (default): single click adds to canvas; dblclick expands.
      'navigate': preserves legacy single-click drill-down. */
  clickBehavior?: 'add' | 'navigate';
}>();

const emit = defineEmits<{
  'add-symbol': [key: string];
  /** Emitted when nav state changes in controlled mode (use with v-model:nav). */
  'update:nav': [state: PaletteNavigationState];
}>();

const paletteEl = ref<HTMLElement | null>(null);
const internalNav = ref<PaletteNavigationState>(INITIAL_PALETTE_NAV);

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

const currentItems = computed<string[]>(() => {
  const s = navState.value;
  if (s.level === 'groups') return GROUPS;
  if (s.level === 'bases' && s.selectedGroup !== null) return ALPHABET[s.selectedGroup] ?? [];
  return [];
});

const paletteColumns = computed(() => navState.value.level === 'variants' ? 8 : 4);

const paletteItemCount = computed(() => {
  if (navState.value.level === 'variants') return 48; // 6 fills × 8 rots
  return currentItems.value.length;
});

function renderGroupIcon(key: string): string {
  return renderSymbol(key);
}

function variantKey(baseKey: string, fillDigit: number, rotation: number): string {
  return baseKey.slice(0, 4) + fillDigit.toString() + rotation.toString(16);
}

function focusedKeyAtCurrentLevel(): string | null {
  const s = navState.value;
  if (s.level === 'variants') return paletteLevel2FocusedKey(s);
  return currentItems.value[s.focusedIndex] ?? null;
}

// ─── Click/dblclick interaction model ─────────────────────────────────────────

function onItemClick(key: string): void {
  if ((props.clickBehavior ?? 'add') === 'add') {
    emit('add-symbol', key);
  } else {
    // Legacy navigate mode
    if (navState.value.level === 'groups') applyNav(paletteEnterGroup(navState.value, key));
    else if (navState.value.level === 'bases') applyNav(paletteEnterBase(navState.value, key));
  }
}

function onItemDblClick(idx: number, key: string): void {
  if ((props.clickBehavior ?? 'add') === 'navigate') {
    // Legacy mode: dblclick does nothing extra (single click already navigated)
    return;
  }
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

function onDragStart(e: DragEvent, key: string): void {
  e.dataTransfer?.setData('text/plain', key);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
}

// ─── Keyboard handling ─────────────────────────────────────────────────────────

function handleKeydown(e: KeyboardEvent): void {
  // F6 is handled globally by useScopeManager — let it bubble
  if (e.key === 'F6' || e.keyCode === 117) return;

  if (e.key === 'Escape') {
    if (navState.value.level !== 'groups') {
      e.preventDefault();
      e.stopPropagation();
      applyNav(paletteBack(navState.value));
    }
    // At groups level: let Escape bubble so useScopeManager can switch scope
    return;
  }

  const dirMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  };
  const dir = dirMap[e.key];
  if (dir) {
    e.preventDefault();
    e.stopPropagation();
    applyNav(paletteNavigate(navState.value, dir, paletteColumns.value, paletteItemCount.value));
    return;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      // Expand: drill into next level
      const s = navState.value;
      const focused = focusedKeyAtCurrentLevel();
      if (focused === null) return;
      if (s.level === 'groups') applyNav(paletteEnterGroup(s, focused));
      else if (s.level === 'bases') applyNav(paletteEnterBase(s, focused));
      else if (s.level === 'variants') applyNav(paletteSetVariantTab(s, s.variantTab === 'first' ? 'second' : 'first'));
    } else {
      // Add focused symbol to canvas
      const key = focusedKeyAtCurrentLevel();
      if (key !== null) emit('add-symbol', key);
    }
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
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  outline: none;
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
</style>
