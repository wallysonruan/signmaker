<template>
  <aside class="palette">
    <!-- Level 0: group grid -->
    <div v-if="level === 0" class="palette-section">
      <div class="palette-title">Symbol Groups</div>
      <div class="group-grid">
        <button
          v-for="groupKey in GROUPS"
          :key="groupKey"
          class="group-btn"
          :title="groupKey"
          draggable="true"
          @dragstart="onDragStart($event, groupKey)"
          @click="selectGroup(groupKey)"
        >
          <span
            class="symbol-cell"
            v-html="renderGroupIcon(groupKey)"
          />
        </button>
      </div>
    </div>

    <!-- Level 1: base symbols within group -->
    <div v-else-if="level === 1 && selectedGroup !== null" class="palette-section">
      <div class="palette-nav">
        <button class="back-btn" @click="level = 0">&#8592; Groups</button>
        <span class="palette-title">{{ selectedGroup }}</span>
      </div>
      <div class="symbol-grid">
        <button
          v-for="baseKey in ALPHABET[selectedGroup]"
          :key="baseKey"
          class="symbol-btn"
          :title="baseKey"
          draggable="true"
          @dragstart="onDragStart($event, baseKey)"
          @click="selectBase(baseKey)"
        >
          <span
            class="symbol-cell"
            v-html="renderGroupIcon(baseKey)"
          />
        </button>
      </div>
    </div>

    <!-- Level 2: fill/rotation variants -->
    <div v-else-if="level === 2 && selectedBase !== null" class="palette-section">
      <div class="palette-nav">
        <button class="back-btn" @click="level = 1">&#8592; Base</button>
        <span class="palette-title">{{ selectedBase }}</span>
      </div>
      <div class="tab-bar">
        <button
          class="tab-btn"
          :class="{ active: variantTab === 0 }"
          @click="variantTab = 0"
        >0–7</button>
        <button
          class="tab-btn"
          :class="{ active: variantTab === 1 }"
          @click="variantTab = 1"
        >8–f</button>
      </div>
      <!-- 6 rows (fill 0-5) x 8 cols (rotation 0-7 or 8-f) -->
      <div class="variant-grid">
        <template v-for="fillIdx in 6" :key="fillIdx">
          <button
            v-for="rotIdx in 8"
            :key="rotIdx"
            class="symbol-btn"
            :title="variantKey(selectedBase, fillIdx - 1, (variantTab * 8) + rotIdx - 1)"
            draggable="true"
            @dragstart="onDragStart($event, variantKey(selectedBase, fillIdx - 1, (variantTab * 8) + rotIdx - 1))"
            @click="addVariant(variantKey(selectedBase, fillIdx - 1, (variantTab * 8) + rotIdx - 1))"
          >
            <span
              class="symbol-cell"
              v-html="renderGroupIcon(variantKey(selectedBase, fillIdx - 1, (variantTab * 8) + rotIdx - 1))"
            />
          </button>
        </template>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { renderSymbol } from '@signwriter/renderer';
import { ALPHABET, GROUPS } from '../data/alphabet';

const emit = defineEmits<{
  (e: 'add-symbol', key: string): void;
}>();

const level = ref<0 | 1 | 2>(0);
const selectedGroup = ref<string | null>(null);
const selectedBase = ref<string | null>(null);
const variantTab = ref<0 | 1>(0);

function renderGroupIcon(key: string): string {
  return renderSymbol(key);
}

function variantKey(baseKey: string, fillDigit: number, rotation: number): string {
  return baseKey.slice(0, 4) + fillDigit.toString() + rotation.toString(16);
}

function selectGroup(groupKey: string): void {
  selectedGroup.value = groupKey;
  level.value = 1;
}

function selectBase(baseKey: string): void {
  // Normalize to base key (first 4 chars + '00') so variants are computed correctly
  selectedBase.value = baseKey.slice(0, 4) + '00';
  variantTab.value = 0;
  level.value = 2;
}

function addVariant(key: string): void {
  emit('add-symbol', key);
}

function onDragStart(e: DragEvent, key: string): void {
  e.dataTransfer?.setData('text/plain', key);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
}
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
</style>
