/**
 * Global Jest setup for SignMaker.
 *
 * Execution environment: Jest jsdom (window === global).
 *
 * Load order mirrors index.html:
 *   1. Stubs for UI / interaction libs not needed in unit tests
 *   2. SuttonSignWriting.min.js  → global.ssw  (eval-wrapped to capture var)
 *   3. config/messages.js        → global.defmessages, global.messages
 *   4. config/keyboard.js        → global.keyboard
 *   5. config/alphabet.js        → global.alphabet  (already sets window.alphabet)
 *   6. config/dictionary.js      → global.dict
 *   7. index.js                  → global.signmaker, global.spatials, etc.
 *
 * Font-dependent ssw functions are patched after loading to return
 * deterministic values (symbol size = 30×30 px) so that bbox/norm
 * calculations are testable without a real browser.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
function readLib(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

// ── 1. Stubs ──────────────────────────────────────────────────────────────────

// classie is bundled inside draggabilly.min.js and used by index.js.
// We stub it because we do not test drag/DOM interactions in unit tests.
global.classie = {
  add:         function() {},
  remove:      function() {},
  addClass:    function() {},
  removeClass: function() {},
  hasClass:    function() { return false; },
};

// Minimal Mithril v1 stub.
// Only m.prop, m.redraw, m.trust, m.mount, m.withAttr are needed by index.js.
// m.prop must include toJSON so JSON.stringify(symbol) serializes the stored
// value rather than omitting the function (Mithril v1 adds toJSON for this).
global.m = {
  prop: function(initialValue) {
    var val = initialValue;
    function prop(newVal) {
      if (arguments.length > 0) val = newVal;
      return val;
    }
    prop.toJSON = function() { return val; };
    return prop;
  },
  redraw:   function() {},
  trust:    function(html) { return html || ''; },
  mount:    function() {},
  withAttr: function(attr, fn) { return function(e) { fn(e.target[attr]); }; },
};

// Draggabilly stub.  Drag interaction is not unit-testable here.
global.Draggabilly = function(el) {
  this.element   = el || {};
  this.dragPoint = { x: 0, y: 0 };
  this.position  = { x: 0, y: 0 };
  this.startPoint = { x: 0, y: 0 };
  this.on        = function() {};
};

// translate.js stub.
global.libTranslate = {
  getTranslationFunction: function() {
    return function(key) { return key || ''; };
  },
};

// ── 2. SuttonSignWriting library ──────────────────────────────────────────────
//
// The library declares `var ssw = {...}` at top scope (no module.exports).
// Wrapping it in an IIFE lets us capture and export the variable.
//
const sswCode = readLib('lib/SuttonSignWriting.min.js');
global.ssw = (0, eval)('(function(){\n' + sswCode + ';\nreturn ssw;\n})()');

// Patch font-dependent functions so tests run without a real browser.
// ssw.size(key) normally measures rendered text via CSS font metrics and
// returns a string in "WxH" format (e.g. "30x30") that ssw.max() splits on "x".
// We return a fixed "30x30" for all symbols.
global.ssw.size = function(key) {
  if (!key || key.length < 6) return null;
  return '30x30';
};

// ssw.svg() uses font metrics for layout.  Return a minimal valid SVG.
global.ssw.svg = function(key) {
  if (!key) return '';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"></svg>';
};

// ssw.canvas() returns an HTMLCanvasElement.  Return a stub.
global.ssw.canvas = function() {
  return null;
};

// ── 3-6. Config files ─────────────────────────────────────────────────────────
//
// Each file declares top-level `var` names.  We wrap in an IIFE and explicitly
// assign to global so tests see them as globals (just like a browser <script>).

var _msgResult = (0, eval)('(function(){\n' + readLib('config/messages.js') + ';\nreturn {defmessages:defmessages,messages:messages};\n})()');
global.defmessages = _msgResult.defmessages;
global.messages    = _msgResult.messages;

global.keyboard = (0, eval)('(function(){\n' + readLib('config/keyboard.js') + ';\nreturn keyboard;\n})()');

// alphabet.js does `window.alphabet = {...}`.
// We must set it as non-configurable BEFORE loading index.js because
// index.js calls setAlphabet('') on startup which does `delete window.alphabet`.
// Making it non-configurable means the delete silently fails and the data persists.
;(function() {
  var code = readLib('config/alphabet.js');
  var fn   = new Function('return ' + code.replace(/^\s*window\.alphabet\s*=\s*/, ''));
  var data = fn();
  Object.defineProperty(global, 'alphabet', {
    configurable: false,  // prevents delete window.alphabet from clearing it
    writable:     true,   // allows palette.vm.init() to re-read it
    enumerable:   true,
    value:        data,
  });
}());

// dictionary.js declares `var dict = "\n"` which index.js reads as window.dict.
global.dict = '\n';
if (typeof window !== 'undefined') window.dict = global.dict;

// ── 7. DOM scaffold ───────────────────────────────────────────────────────────
//
// index.js references these elements at load time and inside event handlers.

document.body.innerHTML = `
  <div id="header"></div>
  <div id="palette"></div>
  <div id="dictionary"></div>
  <div id="signmaker" style="width:800px;height:600px;"></div>
  <div id="signtext"></div>
  <div id="sequence"></div>
  <div id="signbox"></div>
  <input id="search" value="" />
  <input id="fsw" value="" />
  <input id="swu" value="" />
  <textarea id="dictText"></textarea>
  <a id="downloadlink" href="#"></a>
`;

// ── 8. Main application ───────────────────────────────────────────────────────
//
// Loading index.js runs top-level statements (setColoring, allSignLang setup).
// window.onload is set but NOT called; tests access signmaker.vm directly.
(0, eval)(readLib('index.js'));

// ── 9. Per-test reset helper ──────────────────────────────────────────────────
//
// Exported so individual test files can call resetEditor() in beforeEach.

global.resetEditor = function() {
  signmaker.vm.list  = new spatials.List();
  signmaker.vm.sort  = [];
  signmaker.vm.terms = ['', '', '', '', '', '', '', ''];
  signmaker.vm.entry('');
  signmaker.vm.history = ['{"list":[],"sort":[],"terms":["","","","","","","",""],"entry":""}'];
  signmaker.vm.cursor  = 0;
  signmaker.vm.midWidth  = 125;
  signmaker.vm.midHeight = 125;
};
