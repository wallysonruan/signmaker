import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  base: '/signmaker/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@signwriter/fsw':          resolve(__dirname, '../packages/fsw/src/index.ts'),
      '@signwriter/layout':       resolve(__dirname, '../packages/layout/src/index.ts'),
      '@signwriter/editor':       resolve(__dirname, '../packages/editor/src/index.ts'),
      '@signwriter/renderer':     resolve(__dirname, '../packages/renderer/src/index.ts'),
      '@signwriter/interactions': resolve(__dirname, '../packages/interactions/src/index.ts'),
      '@signwriter/vue':          resolve(__dirname, '../packages/vue/src/index.ts'),
    },
  },
});
