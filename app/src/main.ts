import { createApp } from 'vue';
import { loadFonts } from '@signwriter/renderer';
import './style.css';
import App from './App.vue';

// Inject @font-face CSS for the three Sutton SignWriting TTF fonts.
// Must run before any SVG symbols are rendered in the DOM.
loadFonts();

createApp(App).mount('#app');
