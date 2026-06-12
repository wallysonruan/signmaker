import { createApp } from 'vue';
import { loadFonts, waitForFonts } from '@signwriter/renderer';
import './style.css';
import App from './App.vue';

// 1. Inject @font-face CSS (Line, Fill, OneD fonts from jsDelivr CDN).
loadFonts();

// 2. Wait until the Line + Fill fonts are actually renderable (canvas
//    measurement returns non-zero) before mounting, so every call to
//    renderSymbol / renderSign gets correct SVG dimensions.
waitForFonts().then(() => {
  createApp(App).mount('#app');
});
