<template>
  <footer class="fsw-panel">
    <span class="fsw-label">FSW:</span>
    <span class="fsw-current">{{ fsw || '(empty)' }}</span>
    <div class="fsw-input-group">
      <input
        v-model="inputValue"
        class="fsw-input"
        type="text"
        placeholder="Paste FSW to load a sign…"
        @keydown.enter="loadFsw"
      />
      <button class="fsw-load-btn" @click="loadFsw">Load</button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  fsw: string;
}>();

const emit = defineEmits<{
  (e: 'load-fsw', fsw: string): void;
}>();

const inputValue = ref('');

function loadFsw(): void {
  const trimmed = inputValue.value.trim();
  if (trimmed) {
    emit('load-fsw', trimmed);
    inputValue.value = '';
  }
}
</script>

<style scoped>
.fsw-panel {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: #1e293b;
  color: #f1f5f9;
  border-top: 1px solid #334155;
  flex-shrink: 0;
}

.fsw-label {
  font-weight: 600;
  font-size: 0.8rem;
  color: #94a3b8;
  white-space: nowrap;
}

.fsw-current {
  font-family: monospace;
  font-size: 0.8rem;
  color: #cbd5e1;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.fsw-input-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.fsw-input {
  padding: 4px 8px;
  border: 1px solid #475569;
  border-radius: 4px;
  background: #0f172a;
  color: #f1f5f9;
  font-family: monospace;
  font-size: 0.8rem;
  width: 280px;
}

.fsw-input::placeholder {
  color: #64748b;
}

.fsw-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.fsw-load-btn {
  padding: 4px 12px;
  border: 1px solid #475569;
  border-radius: 4px;
  background: #334155;
  color: #f1f5f9;
  cursor: pointer;
  font-size: 0.8rem;
  white-space: nowrap;
}

.fsw-load-btn:hover {
  background: #475569;
}
</style>
