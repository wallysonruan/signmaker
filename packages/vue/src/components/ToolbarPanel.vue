<template>
  <nav class="toolbar" aria-label="Editor toolbar">
    <button
      class="tool-btn"
      :disabled="!canUndo"
      :aria-disabled="!canUndo"
      :aria-label="`Undo${!canUndo ? ', unavailable' : ''} (Ctrl+Z)`"
      title="Undo (Ctrl+Z)"
      @click="$emit('undo')"
    >
      Undo
    </button>
    <button
      class="tool-btn"
      :disabled="!canRedo"
      :aria-disabled="!canRedo"
      :aria-label="`Redo${!canRedo ? ', unavailable' : ''} (Ctrl+Shift+Z)`"
      title="Redo (Ctrl+Shift+Z)"
      @click="$emit('redo')"
    >
      Redo
    </button>
    <button
      class="tool-btn"
      aria-label="Copy FSW to clipboard"
      title="Copy FSW"
      @click="$emit('copy-fsw')"
    >
      Copy FSW
    </button>
    <button
      class="tool-btn"
      aria-label="Paste FSW from clipboard"
      title="Paste FSW"
      @click="$emit('paste-fsw')"
    >
      Paste FSW
    </button>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  canUndo: boolean;
  canRedo: boolean;
}>();

defineEmits<{
  (e: 'undo'): void;
  (e: 'redo'): void;
  (e: 'copy-fsw'): void;
  (e: 'paste-fsw'): void;
}>();
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  padding: 8px 4px;
  background: #1e293b;
  border-left: 1px solid #334155;
  border-right: 1px solid #334155;
  flex-shrink: 0;
}

.tool-btn {
  padding: 6px 10px;
  border: 1px solid #475569;
  border-radius: 4px;
  background: #334155;
  color: #f1f5f9;
  cursor: pointer;
  font-size: 0.8rem;
  white-space: nowrap;
  transition: background 0.15s;
  touch-action: manipulation;
}

.tool-btn:hover:not(:disabled) {
  background: #475569;
}

.tool-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tool-btn:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: 2px;
}

@media (max-width: 767px) {
  .toolbar {
    flex-direction: row;
    flex-shrink: 0;
    border-left: none;
    border-right: none;
    border-top: 1px solid #334155;
    padding: 4px 8px;
    width: 100%;
    justify-content: center;
    gap: 4px;
  }

  .tool-btn {
    flex: 1;
    max-width: 80px;
    padding: 5px 4px;
    font-size: 0.75rem;
  }
}
</style>
