# SignMaker Architecture Research Report

> **Purpose:** Reverse-engineer the SignMaker repository in enough detail that a developer could build a modern replacement without consulting the original source again.  
> **Scope:** The entire repository at `/home/user/signmaker` — a single-page, zero-build, vanilla JavaScript SignWriting editor.

---

## 1. Repository Overview

### Main Purpose

SignMaker 2017 (v2.0.5) is a browser-based editor for creating, editing, and storing signs in **Sutton SignWriting** notation. Users drag symbols onto a canvas, position them spatially, attach spoken-language glosses, and save signs to a local dictionary. The editor reads and writes **FSW** (Formal SignWriting) and **SWU** (SignWriting Unicode) strings.

### Directory Tree

```
signmaker/
├── index.html          — Single HTML shell; mounts four Mithril component roots
├── index.js            — Entire application logic (1,563 lines, no modules)
├── index.css           — Layout + component styles (556 lines)
├── noscript.css        — No-JS fallback
├── README.md
├── lib/
│   ├── SuttonSignWriting.min.js  (38 KB) — FSW/SWU engine: parse, render, bbox, normalize
│   ├── mithril.min.js            (19 KB) — MVC/virtual-DOM framework (v1.x)
│   ├── draggabilly.min.js        (14 KB) — Cross-browser drag-and-drop
│   └── translate.min.js          (1.4 KB) — i18n / pluralization
└── config/
    ├── alphabet.js     — 32 ISWA 2010 symbol groups → base symbol key arrays
    ├── keyboard.js     — Keycode → action map
    ├── messages.js     — ~100 language UI strings (1,627 lines)
    ├── dictionary.js   — Empty template (window.dict = "")
    ├── alphabet/       — Language-specific symbol subsets (loaded on demand)
    └── dictionary/     — Language-specific dictionaries (loaded on demand)
```

### Build System

**There is no build system.** The project is pure ES5 JavaScript served directly from disk or any static HTTP server. No npm, no webpack, no TypeScript, no transpilation, no tests, no linting.

### Entry Points

**`index.html`** is the sole entry point. Script load order is critical (all globals):

```
1. lib/draggabilly.min.js   → window.Draggabilly
2. lib/mithril.min.js       → window.m
3. lib/translate.min.js     → window.libTranslate
4. lib/SuttonSignWriting.min.js → window.ssw, window.classie
5. config/messages.js       → window.messages, window.defmessages
6. config/keyboard.js       → window.keyboard
7. index.js                 → mounts all components (when fonts are ready)
```

**HTML mount points:**

```html
<div id="header"></div>      ← header component
<div id="palette"></div>     ← palette component (symbol picker)
<div id="dictionary"></div>  ← dictionary component
<div id="signmaker"></div>   ← sign editor component (the main canvas)
<div id="signtext"></div>    ← (unused in code, kept in HTML)
```

### External Libraries Used

| Library | Version | Role |
|---|---|---|
| **SuttonSignWriting.js** | 2.1.1 | FSW/SWU parsing, SVG rendering, bounding box, normalization, canvas export |
| **Mithril.js** | 1.x | Virtual DOM, component model, reactive properties (`m.prop`) |
| **Draggabilly** | latest | Touch+mouse drag-and-drop for symbol placement |
| **Translate.js** | latest | i18n translation with pluralization |
| **Sutton fonts** (CDN) | 1.0.0 | TrueType fonts for symbol rendering (loaded at runtime from unpkg) |

### Module Relationships (Dependency Graph)

```
index.html
  └─ index.js
       ├─ window.ssw           (SuttonSignWriting.min.js)
       │    └─ fonts (CDN TTF) — ssw.size() detects font load
       ├─ window.m             (mithril.min.js)
       ├─ window.Draggabilly   (draggabilly.min.js)
       ├─ window.libTranslate  (translate.min.js)
       ├─ window.defmessages / window.messages (config/messages.js)
       ├─ window.keyboard      (config/keyboard.js)
       └─ window.alphabet      (config/alphabet.js, replaced dynamically)
            └─ config/alphabet/alphabet-<lang>.js  (loaded on demand)
            └─ config/dictionary/dictionary-<lang>.js (loaded on demand)
```

### Application Structure Diagram

```
┌───────────────────────────────────────────────────────────┐
│  Browser Window                                            │
│                                                            │
│  ┌──────────┐  ┌────────────────────────────────────────┐ │
│  │ #palette │  │          #signmaker                    │ │
│  │          │  │  ┌──────────────────┐  ┌────────────┐  │ │
│  │ Symbol   │  │  │   #signbox       │  │ #sequence  │  │ │
│  │ picker   │─drag▶│  (editor canvas) │  │ (sort list)│  │ │
│  │ grid     │  │  │  Symbols as abs- │  │            │  │ │
│  └──────────┘  │  │  positioned divs │  └────────────┘  │ │
│                │  └──────────────────┘                   │ │
│  ┌────────────┐│  ┌─────────────────────────────────────┐│ │
│  │#dictionary ││  │  #command (tab panel)               ││ │
│  │            ││  │  Tab 0: Edit  Tab 1: Dict  Tab 2:   ││ │
│  │ Search +   ││  │  Search  Tab 3-8: More/Export/Prefs ││ │
│  │ grid view  ││  └─────────────────────────────────────┘│ │
│  └────────────┘└────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

---

## 2. Sign Editor Deep Dive

### Main Component

The sign editor is implemented as a single **Mithril component** — `signmaker` — defined entirely in `index.js`. It has no dedicated file. All editor state, business logic, interaction handlers, and rendering live in one object:

```
signmaker.vm       — view model (state + all methods)
signmaker.controller — empty function
signmaker.view     — renders the entire editor UI (lines 758–1145)
```

### Internal State (`signmaker.vm`, index.js:336–712)

| Property | Type | Description |
|---|---|---|
| `list` | `spatials.List` (Array) | Ordered array of `spatials.Symbol` objects being edited |
| `sort` | `string[]` | Array of 6-char symbol keys for the FSW `A` sort prefix |
| `terms` | `string[8]` | Eight spoken-language gloss fields |
| `entry` | `m.prop(string)` | The original dictionary entry string (for update/delete) |
| `history` | `string[]` | JSON-serialized snapshots of `{list, sort, terms, entry}` |
| `cursor` | `number` | Index into `history` array (undo/redo position) |
| `current` | `m.prop(number)` | Active tab (0–8) |
| `chars` | `'fsw' \| 'swu'` | Display encoding preference (persisted in localStorage) |
| `midWidth` | `number` | Half of editor div clientWidth (px); recalculated on every render |
| `midHeight` | `number` | Half of editor div clientHeight (px); recalculated on every render |
| `grid` | `m.prop(0\|1\|2)` | Grid display mode |
| `size`, `pad` | `m.prop(string)` | Export size multiplier and padding |
| `linecolor`, `fillcolor`, `backcolor` | `m.prop(string)` | Export colors |
| `colorize` | `m.prop(string)` | Colorize flag for export |
| `styling` | `m.prop(string)` | FSW style suffix appended on export |
| `fswraw`, `swuraw` | `string` | In-progress text field values (before parsing) |

### The Symbol Data Model (`spatials.Symbol`, index.js:323–328)

```javascript
spatials.Symbol = function(data) {
  this.key      = m.prop(data.key);      // 6-char FSW symbol key, e.g. "S14c20"
  this.x        = m.prop(data.x);        // X in FSW coordinate space (integer)
  this.y        = m.prop(data.y);        // Y in FSW coordinate space (integer)
  this.selected = m.prop(true);          // Selection state for editing
};
spatials.List = Array;                   // No custom collection; plain Array subtype
```

`m.prop` is Mithril v1's getter/setter factory: `symbol.x()` reads, `symbol.x(42)` writes and schedules a redraw.

### Public API Methods on `signmaker.vm`

| Method | Signature | Description |
|---|---|---|
| `fsw(fsw?, silent?)` | `(string?, bool?) → string` | Setter: parse FSW string into `list`+`sort`. Getter: return `fswlive()` |
| `fswlive()` | `() → string` | Generate FSW from current `list`+`sort`, update box coordinate |
| `fswnorm()` | `() → string` | `ssw.norm(fswlive())` — normalized FSW (centered, standard box) |
| `fswview(fsw?)` | `(string?) → string` | Two-way binding for the FSW text input field |
| `swu(swu?, silent?)` | `(string?, bool?)` | Same as `fsw()` but in SWU encoding |
| `swulive()` | `() → string` | `ssw.fsw2swu(fswlive())` |
| `swunorm()` | `() → string` | `ssw.fsw2swu(fswnorm())` |
| `add(symbol)` | `({key,x,y})` | Push new Symbol onto list, addhistory |
| `addSeq(key, pos)` | `(string, int)` | Insert key into `sort` at `pos` |
| `delete()` | `()` | Splice selected symbols from list |
| `clear()` | `()` | Empty list and sort |
| `copy()` | `()` | Duplicate selected symbols at +10,+10 offset |
| `over()` | `()` | Move selected symbols to end of list (bring to front) |
| `move(x,y)` | `(int, int)` | Translate selected symbols by delta |
| `select(step)` | `(int)` | Cycle selection by ±1 |
| `selnone()` | `()` | Deselect all |
| `rotate(step)` | `(±1)` | Apply `ssw.rotate(key, step)` to selected |
| `mirror()` | `()` | Apply `ssw.mirror(key)` to selected |
| `fill(step)` | `(±1)` | Apply `ssw.fill(key, step)` to selected |
| `variation(step)` | `(±1)` | Apply `ssw.scroll(key, step)` to selected |
| `center()` | `()` | Normalize sign: `fsw(ssw.norm(fsw()))` |
| `undo()` | `()` | Restore previous history entry |
| `redo()` | `()` | Restore next history entry |
| `addhistory(silent?)` | `(bool?)` | Push current state to history if changed |
| `load(entry)` | `(string)` | Load a dictionary entry (FSW + tab-separated terms) |
| `insert()` | `()` | Save current sign as new dictionary entry |
| `update()` | `()` | Update existing dictionary entry |
| `delentry()` | `()` | Delete dictionary entry |
| `dlpng()` | `()` | Download sign as PNG via canvas |
| `dlsvg()` | `()` | Download sign as SVG |
| `search(flags?)` | `(string?)` | Convert current sign to search query, run dictionary search |

### Editor Instantiation Sequence

```
window.onload fires
  └─ ssw.size("S10000") checked — is the font loaded?
       If NO → show "waiting" message, poll every 100ms
       If YES → initPage()
                  └─ initApp()
                       ├─ m.mount(#palette, palette)
                       ├─ m.mount(#header, header)
                       ├─ m.mount(#dictionary, dictionary)
                       └─ m.mount(#signmaker, signmaker)
                  └─ hashSet() — set URL hash from localStorage
                  └─ checkSignLang('alphabet') — probe CDN for language alphabets
                  └─ checkSignLang('dictionary') — probe CDN for language dictionaries
```

### Rendering Lifecycle

Every time state changes, `m.redraw()` is called explicitly. Mithril then:
1. Calls `signmaker.view(ctrl)` to produce a new virtual DOM tree
2. Diffs the virtual DOM against the real DOM
3. Applies minimal patches

The `config` callback on symbol divs (Mithril v1's lifecycle hook, equivalent to `oncreate`) is called only once per element (`isInitialized` guard) to attach Draggabilly instances.

### Symbol Loading (FSW → Internal Model)

```javascript
// index.js:426-444
signmaker.vm.fsw = function(fsw, silent) {
  if (typeof fsw !== 'undefined') {
    fsw = ssw.sign(fsw);  // validate & extract sign from larger text
    // extract spatials: key(6) + x(3) + 'x' + y(3)
    var syms = fsw.match(/S[1-3][0-9a-f]{2}[0-5][0-9a-f][0-9]{3}x[0-9]{3}/g) || [];
    signmaker.vm.list = new spatials.List();
    for (var i = 0; i < syms.length; i++) {
      signmaker.vm.list.push(new spatials.Symbol({
        key: syms[i].slice(0, 6),          // symbol key
        x:   parseInt(syms[i].slice(6, 9)),  // 3-digit X
        y:   parseInt(syms[i].slice(10, 13)) // 3-digit Y
      }));
    }
    // extract sort prefix
    var sortMatch = fsw.match(/A(S[1-3][0-9a-f]{2}[0-5][0-9a-f])+/) || [];
    signmaker.vm.sort = sortMatch.length ? sortMatch[0].slice(1).match(/.{6}/g) : [];
    signmaker.vm.addhistory(silent);
    signmaker.vm.selnone();
  }
  return signmaker.vm.fswlive();
};
```

### FSW Generation (Internal Model → FSW)

```javascript
// index.js:405-416
signmaker.vm.fswlive = function() {
  var fsw = 'M500x500';
  if (signmaker.vm.sort.length) fsw = "A" + signmaker.vm.sort.join('') + fsw;
  if (signmaker.vm.list.length) {
    for (var i = 0; i < signmaker.vm.list.length; i++) {
      fsw += signmaker.vm.list[i].key() +
             signmaker.vm.list[i].x() + 'x' +
             signmaker.vm.list[i].y();
    }
    // set box coordinate to sign's max extent
    var bbox = ssw.bbox(ssw.max(fsw)).split(' ');
    fsw = fsw.replace("M500x500", "M" + bbox[1] + 'x' + bbox[3]);
  }
  return fsw === "M500x500" ? '' : fsw;
};
```

**Key insight:** The `M` box coordinate in the generated FSW is not fixed at 500×500. It is set to `maxX × maxY` of the sign's bounding box via `ssw.bbox(ssw.max(fsw))`.

---

## 3. Bounding Box System

### Data Model

The bounding box is not stored as an object. It is computed on demand by `ssw.bbox()` from the SuttonSignWriting library and returned as a space-separated string `"minX maxX minY maxY"`.

```javascript
var bbox = ssw.bbox(ssw.max(fsw)).split(' ');
// bbox[0] = minX, bbox[1] = maxX, bbox[2] = minY, bbox[3] = maxY
```

The SuttonSignWriting library determines symbol dimensions from the loaded TrueType fonts (via CSS `ssw.size(key)` calls that measure rendered text).

### Coordinate System

- FSW coordinate space is **1000×1000** with logical center at **(500, 500)**
- Coordinates are always non-negative integers in the range **0–999**
- X increases rightward, Y increases downward (standard screen convention)
- The `M` box marker records the **maximum extent** of the sign (not its center), which serves as a metadata anchor in the FSW string

### Box Marker Semantics

The FSW `M500x500` (or `B`, `L`, `R`) marker at the start of the spatial section records:
- The box type (`M` = Movement, `B` = Base, `L` = Left, `R` = Right)
- The sign's **max-X × max-Y** bounding values (after `fswlive()` recalculates it)

`ssw.norm()` recenters the sign so the box coordinate represents the geometric center.

### Symbol Insertion Algorithm

```
1. User drags symbol from palette, drops onto #signbox
2. palDragEnd() computes FSW coordinate:
     x = 500 - midWidth  + 1 + offset(symbol).left - offset(signbox).left
     y = 500 - midHeight     + offset(symbol).top  - offset(signbox).top
3. signmaker.vm.add({key, x, y}) pushes new spatials.Symbol
4. m.redraw() triggers re-render
5. fswlive() regenerates FSW string and updates M coordinate
```

### Symbol Movement Algorithm

**Via drag (Draggabilly):**
```
1. sbDragStart: selnone(), select dragged symbol
2. sbDragEnd: if element overlaps #signbox:
     symbol.x += dragPoint.x  (pixel delta = coordinate delta, 1:1)
     symbol.y += dragPoint.y
3. addhistory(), m.redraw()
```

**Via keyboard (1px or 10px steps):**
```
move(dx, dy): for each selected symbol:
  symbol.x(symbol.x() + dx)
  symbol.y(symbol.y() + dy)
```

**Important:** Pixel coordinates in the display map 1:1 to FSW coordinate units. There is no scaling transform between screen pixels and the 1000×1000 coordinate space.

### Sign Dimensions Calculation

```javascript
// fswlive(), index.js:412-413
var bbox = ssw.bbox(ssw.max(fsw)).split(' ');
fsw = fsw.replace("M500x500", "M" + bbox[1] + 'x' + bbox[3]);
```

The sign dimensions are implicitly `maxX × maxY` from `ssw.bbox()`. The library uses symbol glyph metrics (from the TTF font) to compute per-symbol extents, then aggregates over all spatials.

### Auto-centering Viewport Algorithm

```javascript
// signmaker.view(), index.js:763-771
var bbox = ssw.bbox(ssw.max(signmaker.vm.fsw())).split(" ");
if (bbox.length == 4) {
  // if sign extends beyond visible left/right:
  if (bbox[0] < 510 - midWidth || bbox[1] > 490 + midWidth) {
    signmaker.vm.midWidth = midWidth + 500 - (bbox[0] + bbox[1]) / 2;
  }
  // if sign extends beyond visible top/bottom:
  if (bbox[2] < 510 - midHeight || bbox[3] > 490 + midHeight) {
    signmaker.vm.midHeight = midHeight + 500 - (bbox[2] + bbox[3]) / 2;
  }
}
```

`midWidth/midHeight` are offsets that map FSW coordinate 500 to screen center. When the sign overflows, these offsets shift so the sign center aligns with screen center.

### Symbol Deletion

```javascript
signmaker.vm.delete = function() {
  for (var i = 0; i < signmaker.vm.list.length; i++) {
    if (signmaker.vm.list[i].selected()) {
      signmaker.vm.list.splice(i, 1);  // mutates array in place
    }
  }
  signmaker.vm.addhistory();
  m.redraw();
};
```

**Bug note:** The splice inside a forward-iterating for-loop will skip the element immediately after a deleted symbol. If two consecutive symbols are selected, the second may survive deletion.

### Selection Model

- **Single selection only** — `selnone()` deselects all, then one symbol is marked selected
- **No multi-selection** — `select(step)` cycles one symbol at a time via Tab/Shift-Tab
- **All operations** (`rotate`, `mirror`, `fill`, etc.) iterate `signmaker.vm.list` and apply to every symbol where `selected() === true`
- Dragging auto-selects the dragged symbol

### Z-Ordering

Z-order equals **array position** in `signmaker.vm.list`. Last element renders on top (CSS z-index is not explicitly set; DOM order governs stacking of absolutely-positioned divs). `signmaker.vm.over()` moves selected symbols to the end of the array (front):

```javascript
signmaker.vm.over = function() {
  var len = signmaker.vm.list.length;
  for (var i = 0; i < len; i++) {
    if (signmaker.vm.list[i].selected()) {
      var symbol = signmaker.vm.list[i];
      signmaker.vm.add({key:symbol.key(), x:symbol.x(), y:symbol.y()});
      signmaker.vm.list.splice(i, 1);
      len--;
    }
  }
};
```

---

## 4. Coordinate System Analysis

### Coordinate Spaces

**FSW coordinate space:**
- Range: 0–999 on both axes
- Logical origin: (0, 0) top-left
- Logical center: (500, 500)
- X increases rightward, Y increases downward
- Default sign placement origin: (500, 500)

**Screen coordinate space:**
- Origin: top-left of `#signbox` div
- `midWidth` and `midHeight` are the pixel offsets of FSW center (500, 500) from screen origin

### Coordinate Transformations

**FSW → Screen** (index.js:811–812):
```
screen_left = fsw_x - 500 + midWidth
screen_top  = fsw_y - 500 + midHeight
```

**Screen → FSW** (index.js:1381, palette drag drop):
```
fsw_x = 500 - midWidth  + 1 + screen_left_of_symbol - screen_left_of_signbox
fsw_y = 500 - midHeight     + screen_top_of_symbol  - screen_top_of_signbox
```

**Drag delta update** (index.js:721–722):
```
new_fsw_x = old_fsw_x + pixel_drag_delta_x   (1:1 mapping)
new_fsw_y = old_fsw_y + pixel_drag_delta_y
```

### Can Coordinates Be Negative?

In the internal `spatials.Symbol` model: **yes, coordinates can become negative or exceed 999** because drag deltas are applied without bounds checking. The FSW string, however, encodes only 3-digit decimal values, so coordinates outside 0–999 are technically invalid FSW. The SuttonSignWriting library's `ssw.norm()` re-normalizes coordinates to valid ranges.

### FSW Coordinate Conventions

In an FSW string, the `M500x500` box marker is eventually replaced with the sign's bounding-box max values. For example:

```
AS14c20S27106M518x529S14c20481x471S27106503x489
```
- `M518x529` = maxX is 518, maxY is 529
- `S14c20481x471` = symbol S14c20 placed at x=481, y=471
- `S27106503x489` = symbol S27106 placed at x=503, y=489

### Normalization Before Export

Before export (PNG, SVG, dictionary save), `fswnorm()` is called:
```javascript
signmaker.vm.fswnorm = function() {
  return ssw.norm(signmaker.vm.fswlive());
};
```

`ssw.norm()` (in SuttonSignWriting.min.js) performs:
1. Recalculate all coordinates so the sign is centered
2. Set the box coordinate to the sign's geometric center
3. Ensure all coordinates are valid (within bounds)

**Dictionary save** also normalizes:
```javascript
signmaker.vm.newentry = function() {
  return (ssw.norm(signmaker.vm.fsw()) + '\t' + signmaker.vm.terms.join('\t'))
    .replace(/\t\t/g, '').trim();
};
```

---

## 5. FSW Internals (Highest Priority)

### FSW String Format

```
[A<sort>]? <box><coord> [<sym><coord>]* [<style>]?

<sort>  = (S[1-3][0-9a-f]{2}[0-5][0-9a-f])+
<box>   = [BLMR]
<coord> = [0-9]{3}x[0-9]{3}
<sym>   = S[1-3][0-9a-f]{2}[0-5][0-9a-f]
<style> = -...  (color, size, padding directives)
```

**Example:**
```
AS14c20S27106M518x529S14c20481x471S27106503x489
│─────────────────────│ sort prefix (A + 2 keys)
                       │ M518x529 = box + max coords
                              │ S14c20481x471 = spatial (key + coord)
```

### Files Involved with FSW

| File | Role |
|---|---|
| `lib/SuttonSignWriting.min.js` | ALL FSW parsing, validation, normalization, rendering |
| `index.js:405–416` | FSW generation (`fswlive()`) |
| `index.js:426–444` | FSW parsing back into `list`+`sort` (`fsw()` setter) |
| `index.js:423–424` | Normalization wrapper (`fswnorm()`) |
| `index.js:452–462` | `fswview()` — two-way binding for text input |
| `index.js:493–494` | `newentry()` — normalized FSW for dictionary save |
| `config/dictionary.js` | Stores FSW entries in `window.dict` (tab-separated lines) |

### FSW Parsing (index.js side)

The application itself performs **only** structural regex parsing; all semantic validation is delegated to `ssw.sign()`:

```javascript
// Step 1: validate and extract
fsw = ssw.sign(fsw);   // returns valid FSW or empty string

// Step 2: extract spatials
var syms = fsw.match(/S[1-3][0-9a-f]{2}[0-5][0-9a-f][0-9]{3}x[0-9]{3}/g) || [];

// Step 3: extract sort prefix
var sortMatch = fsw.match(/A(S[1-3][0-9a-f]{2}[0-5][0-9a-f])+/) || [];
```

The regex `S[1-3][0-9a-f]{2}[0-5][0-9a-f][0-9]{3}x[0-9]{3}` captures:
- `S` — literal prefix
- `[1-3]` — symbol category plane (1=hand, 2=movement, 3=dynamics/punctuation)
- `[0-9a-f]{2}` — base symbol hex index
- `[0-5]` — fill variation (0–5)
- `[0-9a-f]` — rotation/mirror index (0–f = 16 orientations)
- `[0-9]{3}` — X coordinate (000–999)
- `x`
- `[0-9]{3}` — Y coordinate

### FSW Generation

The generation pipeline is fully documented in §2 above (`fswlive()`). Key steps:
1. Start with `M500x500`
2. Prepend `A` + sort keys if `sort` array is non-empty
3. Append each symbol: `key + x + 'x' + y`
4. Replace `M500x500` with `M{maxX}x{maxY}` from `ssw.bbox(ssw.max(fsw))`

### SWU ↔ FSW Conversion

All conversions are delegated to the library:
```javascript
ssw.fsw2swu(fsw)  // FSW string → SWU Unicode string
ssw.swu2fsw(swu)  // SWU Unicode string → FSW string
ssw.parse(str, "fsw")  // parse FSW from mixed text
ssw.parse(str, "swu")  // parse SWU from mixed text
```

### Round-Trip Analysis: FSW → Internal Model → FSW

**What is preserved:**
- All symbol keys (exact 6-character codes)
- All spatial coordinates (x, y per symbol)
- Sort prefix (A + ordered keys)

**What is discarded:**
- The `M` box coordinate from the input (it is **recalculated** by `fswlive()`)
- The box type letter (always outputs `M`; `B`, `L`, `R` are lost)
- Style suffix (not stored in `list`/`sort`; stored separately in `signmaker.vm.styling`)
- Any text outside the FSW string

**Round-trip is lossy** in these ways:
1. Box type `B/L/R` → always becomes `M` on output
2. Box coordinate → recalculated from `ssw.bbox(ssw.max(fsw))`, not preserved
3. Export always calls `ssw.norm()` which further transforms coordinates

**Normalization side-effects:**
`ssw.norm()` re-centers the sign so that all coordinates change. A raw edit session (dragging symbols around) preserves coordinates exactly; saving to dictionary normalizes them.

### FSW Validation

The application relies entirely on `ssw.sign(fsw)` for validation. If the string is not a valid FSW sign, `ssw.sign()` returns an empty string/falsy value, and the `list` is set to empty.

The `dictionary.vm.import()` method (index.js:170–190) uses `ssw.sign()` to validate each line before importing.

---

## 6. Symbol Model

### Identifier Format

A symbol key is a **6-character ASCII string**:

```
S  [1-3]  [0-9a-f]{2}  [0-5]  [0-9a-f]
│   │      │            │      │
│   │      │            │      └── Rotation/mirror index (0x0–0xf = 16 values)
│   │      │            └───────── Fill variant (0–5, 6 values)
│   │      └────────────────────── Base symbol hex (2 hex digits)
│   └───────────────────────────── Category plane (1=hands, 2=movement, 3=dynamics)
└───────────────────────────────── Literal 'S' prefix
```

Total variations per base symbol: 6 fills × 16 rotations = **96 variants**

Lower 8 rotations (0–7): standard rotations in 45° increments  
Upper 8 rotations (8–f): mirrored versions of lower 8

### Storage Format

In memory: `spatials.Symbol` object with `m.prop`-wrapped fields  
In FSW string: `S` + 5 hex/decimal chars + 3-digit X + `x` + 3-digit Y  
In dictionary: part of the FSW string (tab-separated line)  
In history: JSON-serialized via `JSON.stringify(history).replace(/true/g,'false')`

### Rendering Format

Each symbol is rendered by `ssw.svg(symbol.key())` which returns an SVG string. The symbol is displayed in a `<div>` with absolute CSS positioning. The SVG contains font-based glyphs using the installed Sutton SignWriting TTF fonts.

### Symbol Categories

`config/alphabet.js` defines **32 top-level groups** (but alphabet navigation in the palette has ~43 display groups based on the palette grid structure). Each group key is a 6-char FSW key (e.g., `S10000`, `S14400`), and its value is an ordered array of base symbol keys within that group.

The groups broadly correspond to ISWA 2010 categories:
- `S10000`–`S1f500`: Hand shapes (planes 1×, various groups)
- `S20500`–`S26400`: Movement symbols
- `S26500`–`S38b00`: Dynamics, punctuation, face, body, etc.

### Rotation Support

Rotation is encoded in the last nibble of the symbol key. The library function `ssw.rotate(key, step)` increments or decrements this nibble. There are 16 rotation/mirror variants total (nibble 0–f).

### Mirroring Support

Mirroring is encoded in the upper half of the rotation nibble (8–f = mirrored versions). `ssw.mirror(key)` toggles between the mirrored and non-mirrored half.

### Fill/Variant Support

`ssw.fill(key, step)` cycles the fill nibble (position 4, values 0–5).  
`ssw.scroll(key, step)` cycles to the next or previous **base symbol** in the sequence (different category member, changing positions 1–3).

### Symbol Lookup

The palette uses `window.alphabet[groupKey]` to get an array of base symbol keys. The palette grid shows individual variants by iterating fill (0–5) × rotation (0–7 or 8–f). No explicit metadata database exists in the application; all symbol properties are computed from the key string itself.

---

## 7. Rendering Pipeline

### Complete Rendering Path

```
User action / state change
  → m.redraw() called
    → signmaker.view(ctrl) invoked by Mithril
      → fswlive() called → current FSW string
      → ssw.bbox(ssw.max(fsw)) → bounding box
      → midWidth/midHeight recalculated from DOM clientWidth/clientHeight
      → SVG grid string generated
      → signmaker.vm.list.map():
          for each symbol:
            ssw.svg(symbol.key()) → SVG string
            CSS position: left = (x - 500 + midWidth) px
                          top  = (y - 500 + midHeight) px
            Draggabilly attached on first render (config callback)
      → Mithril virtual DOM diffing
        → DOM patched
```

### DOM Structure in #signbox

```html
<div id="signbox">
  <div><!-- SVG grid overlay --></div>
  <div class="selected" style="left: Xpx; top: Ypx">
    <!-- ssw.svg(key) output -->
    <svg ...><g>...</g></svg>
  </div>
  <!-- ... one div per symbol ... -->
</div>
```

Each symbol div is **absolutely positioned** within `#signmaker` (the Draggabilly containment boundary).

### SVG Usage

SVG is used for:
1. Individual symbol glyphs: `ssw.svg(key)` → inline SVG per symbol
2. Grid overlay: manually constructed SVG string
3. Export preview (tab 5): `ssw.svg(fswnorm + styling, options)` → full sign SVG
4. Dictionary thumbnails: `ssw.svg(ssw.sign(fsw))` per entry
5. UI labels: `ssw.svg(text)` for SignWriting symbol labels in menus

### Canvas Usage

Canvas is used **only** for PNG export:
```javascript
var canvas = ssw.canvas(fswnorm + styling, {size, pad, line, fill, back, colorize});
var data = canvas.toDataURL("image/png");
```

Canvas is not used for the live editor view.

### Asset Loading

Symbol glyphs are rendered via **TrueType font characters** loaded from unpkg CDN:
```css
@font-face { font-family: "SuttonSignWritingLine"; src: url(CDN/SuttonSignWritingLine.ttf); }
@font-face { font-family: "SuttonSignWritingFill"; src: url(CDN/SuttonSignWritingFill.ttf); }
@font-face { font-family: "SuttonSignWritingOneD"; src: url(CDN/SuttonSignWritingOneD.ttf); }
```

Application startup blocks until `ssw.size("S10000")` returns a non-zero value (font loaded). The size function attempts to measure rendered text using DOM metrics.

### Re-render Triggers

`m.redraw()` is called explicitly after **every mutation**:
- Symbol add / delete / clear
- Symbol move / rotate / mirror / fill / variation
- Selection change
- Undo / redo
- Tab switch
- History update
- Keyboard events
- Window resize → `window.onresize = function(){ m.redraw(); }`
- URL hash change

There is no batching or debouncing of redraws.

### Caching

None. Every render call re-invokes `ssw.svg()` for every symbol in the list. The SuttonSignWriting library may have internal caching; the application layer does not.

### Coupling Assessment

The rendering layer is deeply tangled with business logic in `signmaker.view()`:
- FSW generation happens inside the view function (via `signmaker.vm.fsw()`)
- Bounding box auto-centering (`midWidth`/`midHeight` mutation) happens inside view
- Draggabilly initialization happens inside the view config callback
- Export rendering (canvas, SVG) is triggered from within the view switch statement

---

## 8. Interaction System

### Dragging (Palette → Editor)

```
User drags symbol from palette
  → palDragMove: add CSS class "topleft" to symbol div
  → palDragEnd:
      if overlap(symbol, #signbox):
        compute FSW coord from element positions
        signmaker.vm.add({key, x, y})
      elif overlap(symbol, #sequence):
        compute list position from Y coord
        signmaker.vm.addSeq(key, position)
      else:
        no-op
      reset element position to 0,0
      if drag.x==0 && drag.y==0: palette.click(key)  ← treat as click
```

### Dragging (Symbol within Editor)

```
User drags existing symbol
  → sbDragStart: selnone(), select dragged symbol
  → sbDragEnd:
      if overlap(symbol, #signbox):
        symbol.x += dragPoint.x
        symbol.y += dragPoint.y
        addhistory(), m.redraw()
      elif overlap(symbol, #sequence):
        addSeq(key, position)
      else:
        reset position (cancel drag)
```

### Sequence Reordering

```
User drags sort key in #sequence
  → seqDragEnd:
      position1 = startY / (windowHeight/20)
      position2 = (startY + deltaY) / (windowHeight/20)
      if position1 == position2: splice out (delete)
      else: splice from pos1, insert at pos2
      addhistory(), m.redraw()
```

### Click on Palette Symbol

```
palette.click(key)
  → palette.vm.select(group?, base?, lower?) based on current drill-down level
  → m.redraw()
```

The palette has a 4-level drill-down:
1. **Top level:** All 32+ groups (group key as representative symbol)
2. **Group level:** All base symbols in that group
3. **Base level:** 6×8 grid of fill(0–5) × rotation(0–7)
4. **Lower level:** 6×8 grid of fill(0–5) × rotation(8–f) (mirrored)

### Keyboard Shortcuts

| Key | Action |
|---|---|
| `←` / `Shift+←` | `move(-1,0)` / `move(-10,0)` |
| `→` / `Shift+→` | `move(1,0)` / `move(10,0)` |
| `↑` / `Shift+↑` | `move(0,-1)` / `move(0,-10)` |
| `↓` / `Shift+↓` | `move(0,1)` / `move(0,10)` |
| `Tab` | `select(+1)` |
| `Shift+Tab` | `select(-1)` |
| `Backspace` / `Delete` | `delete()` |
| `Ctrl+Z` | `undo()` |
| `Ctrl+Shift+Z` | `redo()` |
| `/` / `Shift+/` | `rotate(+1)` / `rotate(-1)` |
| `.` / `Shift+.` | `variation(+1)` / `variation(-1)` |
| `,` | `mirror()` |
| `N` / `Shift+N` | `fill(+1)` / `fill(-1)` |
| `Ctrl+Home` | `center()` |
| `Escape` | cycle tabs |

Keys `8, 9, 191` (Backspace, Tab, `/`) have `preventDefault()` called on `keydown`.

### Event Flow Diagram

```
keyup event
  └─ checkKeyboard(event, name) → checks against keyboard config
       └─ matching action called on signmaker.vm
            └─ state mutation
            └─ addhistory()
            └─ m.redraw()
                 └─ signmaker.view() → virtual DOM → DOM patch

dragEnd event (Draggabilly)
  └─ overlap detection (sbDragEnd / palDragEnd / seqDragEnd)
       └─ coordinate calculation
       └─ state mutation (add / move / addSeq)
       └─ addhistory()
       └─ m.redraw()

click event (button, palette symbol)
  └─ bound onclick handler on virtual DOM element
       └─ signmaker.vm.method() or palette.vm.method()
       └─ m.redraw() (explicit or via Mithril auto-redraw)
```

### Undo/Redo State Machine

```
State: { history: string[], cursor: number }

addhistory():
  newhist = JSON.stringify({list, sort, terms, entry}).replace(/true/g,'false')
  if newhist != history[cursor]:
    cursor++
    history = history.slice(0, cursor)
    history.push(newhist)

undo():
  if cursor <= 0: return
  cursor--
  restore from history[cursor]
  m.redraw()

redo():
  if cursor+1 >= history.length: return
  cursor++
  restore from history[cursor]
  m.redraw()
```

**Note:** History stores `selected` as `false` (the `.replace(/true/g,'false')` hack). Restoring from history always restores with all symbols unselected, which is correct behavior but is achieved via a string replacement instead of proper serialization.

---

## 9. State Management

### Source of Truth

`signmaker.vm` is the single source of truth for the editor. There is no external state store.

### Mutable State

| State | Owner | Mutated by |
|---|---|---|
| `list` (symbols) | `signmaker.vm` | add, delete, clear, over, undo, redo, fsw setter |
| `sort` (sequence) | `signmaker.vm` | addSeq, seqDragEnd, undo, redo, fsw setter |
| `terms` | `signmaker.vm` | term input fields, load |
| `entry` | `signmaker.vm` | load |
| `history`, `cursor` | `signmaker.vm` | addhistory, undo, redo |
| `current` (tab) | `signmaker.vm` | tab() |
| `midWidth`, `midHeight` | `signmaker.vm` | signmaker.view() — MUTATED DURING RENDER |
| `fswraw`, `swuraw` | `signmaker.vm` | fswview(), swuview() |
| `chars` | global | setChars() → localStorage |
| `langAlphabet`, `langDictionary` | global | setAlphabet(), setDictionary() |
| `window.alphabet` | global | script injection |
| `window.dict` | global | script injection |
| `localStorage.*` | browser | multiple write sites |

### Derived State

| State | Derived from | Where |
|---|---|---|
| `fswlive()` | list + sort | computed on every call |
| `fswnorm()` | fswlive() via ssw.norm() | computed on every call |
| `swulive()` | fswlive() via ssw.fsw2swu() | computed on every call |
| bbox | fswlive() via ssw.bbox() | computed on every render |
| palette grid | window.alphabet + selection state | computed in palette.vm.select() |
| dictionary matches | window.dict + search query | computed in dictionary.vm.search() |

### Critical Design Issue: Render-time Side Effects

`signmaker.view()` **mutates** `signmaker.vm.midWidth` and `signmaker.vm.midHeight`. This is a significant architectural violation: the view function is not pure. Re-rendering the component changes the state, which could trigger another re-render. Mithril's diffing prevents infinite loops, but the pattern makes the system harder to reason about.

### State Synchronization

Mithril's `m.prop()` is used for reactive properties, but there is no automatic change detection. Every mutation must manually call `m.redraw()`. There are no computed properties, no derived reactive values, and no subscription system.

### LocalStorage Persistence

```javascript
localStorage['chars']     — 'fsw' or 'swu' (encoding preference)
localStorage['colorPref'] — '' | 'inverse' | 'colorful' (theme)
localStorage['langUI']    — language code (e.g., 'en')
localStorage['gridPref']  — 0 | 1 | 2 (grid mode)
localStorage['dictView']  — 'text' | 'js' (dictionary source view)
localStorage['dict']      — TAB-separated FSW + terms, newline-separated entries
```

The dictionary is stored as a multi-line string, not as a JSON array. Searching is done via regex on the raw string.

---

## 10. Dependency Analysis

### Module Classification

| File/Module | Layer | Classification |
|---|---|---|
| `lib/SuttonSignWriting.min.js` | Infrastructure | Core Domain + Rendering + FSW Engine |
| `lib/mithril.min.js` | Infrastructure | UI Framework |
| `lib/draggabilly.min.js` | Infrastructure | Interaction |
| `lib/translate.min.js` | Infrastructure | i18n Utility |
| `index.js:spatials.*` | Domain | Core Domain (symbol data model) |
| `index.js:signmaker.vm` | Mixed | Domain + UI + Rendering (entangled) |
| `index.js:signmaker.view` | Mixed | UI + Layout + Rendering (entangled) |
| `index.js:sbDragEnd/palDragEnd/seqDragEnd` | Mixed | Interaction + Domain |
| `index.js:keyboard handler` | Interaction | Interaction |
| `index.js:dictionary.*` | UI/Storage | UI + Storage |
| `index.js:palette.*` | UI | UI |
| `index.js:header.*` | UI | UI |
| `config/alphabet.js` | Domain | Symbol metadata / lookup table |
| `config/keyboard.js` | Interaction | Configuration |
| `config/messages.js` | i18n | Infrastructure |
| `config/dictionary.js` | Storage | Data |

### Dependency Flow

```
index.js
  ├── Hard dep: window.ssw (all FSW operations)
  ├── Hard dep: window.m   (all rendering)
  ├── Hard dep: window.Draggabilly (all drag)
  ├── Hard dep: window.libTranslate (i18n)
  ├── Hard dep: window.keyboard (key bindings)
  ├── Hard dep: window.defmessages (translations)
  ├── Soft dep: window.alphabet (loaded dynamically)
  ├── Soft dep: window.dict (loaded dynamically)
  └── DOM dep: getElementById, addEventListener, localStorage

ssw (SuttonSignWriting.min.js)
  ├── Hard dep: TrueType fonts (CDN)
  └── DOM dep: document.createElement (canvas, style, measuring)
```

### Circular Dependencies

None — the architecture is strictly layered by load order. However, `signmaker.vm.load()` calls `dictionary.vm.search()`, creating a semantic cross-dependency between two Mithril components.

---

## 11. Refactoring Opportunities

### Technical Debt

**1. Monolithic view model** (`signmaker.vm`, ~380 lines)  
Domain logic (FSW generation, coordinate math), UI logic (tab state, display preferences), and I/O (localStorage, download) are all merged into one object.

**2. Impure render function**  
`signmaker.view()` mutates `midWidth` and `midHeight` as a side effect. This violates the principle that view functions should be pure.

**3. Mutable global state**  
`window.alphabet`, `window.dict`, `window.keyboard`, `window.messages`, `window.ssw` — all mutable globals accessible from any scope.

**4. Font-dependent startup**  
Application is blocked behind a polling loop (`setInterval`) waiting for TTF fonts to load. No fallback rendering without fonts.

**5. Deletion bug**  
`signmaker.vm.delete()` iterates forward while splicing, causing skips when consecutive symbols are both selected.

**6. History serialization hack**  
`.replace(/true/g,'false')` is used to normalize selection state in JSON. This would corrupt any value that includes the literal string `"true"`.

**7. Coordinate space without bounds enforcement**  
Drag deltas are applied without clamping, allowing coordinates to go negative or above 999.

**8. No TypeScript / no tests**  
The entire codebase is untyped ES5 with zero test coverage.

**9. Library as black box**  
The critical `SuttonSignWriting.min.js` is minified and not auditable without deobfuscation. All FSW correctness depends on an opaque external library.

**10. Dictionary as string**  
The dictionary is stored and searched as a raw newline-separated string. No indexing, no validation of duplicates on insert.

### Modularization Opportunities

The following extraction boundaries are natural:

| Module | What to extract | Evidence |
|---|---|---|
| **FSW Engine** | Parsing, generation, normalization, validation | `fswlive()`, `fsw()` setter, `fswnorm()`, `newentry()` |
| **Symbol Model** | `spatials.Symbol`, key format, rotation/mirror/fill algebra | `spatials.*`, all ssw.rotate/mirror/fill calls |
| **Layout Engine** | Bounding box calculation, coordinate transforms, normalization | `midWidth/midHeight` math, `ssw.bbox()`, screen↔FSW conversion |
| **Interaction Engine** | Drag handlers, keyboard handler, selection | `sbDragEnd`, `palDragEnd`, `checkKeyboard`, `select`, `selnone` |
| **Command System** | History, undo/redo, all vm methods as commands | `addhistory`, `undo`, `redo`, all mutation methods |
| **Renderer** | SVG per symbol, full-sign SVG, canvas export | `ssw.svg()`, `ssw.canvas()`, grid SVG |
| **Storage** | localStorage read/write, dictionary format, import/export | `localStorage['dict']`, `dictionary.vm.import/export` |
| **i18n** | Translation function, language loading | `setUI`, `t`, `tt`, `messages.js` |

---

## 12. Rewrite Risk Assessment

### Critical Risks

**C1. Font dependency for symbol rendering**  
All symbol rendering depends on Sutton SignWriting TTF fonts. Without these fonts, nothing renders. A rewrite must either: (a) ship the fonts, (b) pre-render to SVG paths, or (c) use a pure SVG/canvas symbol database. The font-based approach makes offline use and server-side rendering difficult.

**C2. SuttonSignWriting.min.js is a black box**  
All FSW correctness (bbox, norm, rotate, mirror, fill, scroll, parse, sign, fsw2swu, swu2fsw, query, lines) is implemented in a minified library. Rewriting requires either deobfuscating this library or using the upstream `@sutton-signwriting/core` npm package (which provides the same API in modern, auditable form).

**C3. FSW box type semantics**  
The current code always outputs `M` box type and loses `B/L/R`. If these types are semantically meaningful in some sign languages, this is a correctness bug to be preserved or fixed.

### High Risks

**H1. ssw.norm() behavior**  
The normalization algorithm in `ssw.norm()` is opaque. Rewriting must exactly replicate its coordinate-centering behavior to maintain dictionary compatibility. Any divergence would corrupt existing saved signs.

**H2. Coordinate space assumptions**  
The 1000×1000 coordinate space with center at 500,500 is baked into both index.js and the SSW library. A rewrite must choose to preserve this or define an explicit conversion layer.

**H3. 1:1 pixel-to-coordinate mapping**  
The current editor assumes 1 pixel = 1 FSW coordinate unit. This makes drag behavior predictable but means symbol sizing is font-metric-driven, not user-controlled. A rewrite using a canvas-based renderer may need a zoom/scale transform.

**H4. History serialization format**  
Existing history snapshots (in-session only; not persisted) use the `replace(/true/g,'false')` hack. A rewrite changing the serialization format must ensure backward compatibility within a session (not needed across sessions since history is session-only).

### Medium Risks

**M1. Dictionary format**  
The local dictionary is stored as a raw string in localStorage. Changing the format requires migration. The format is simple (FSW + tabs + terms per line) but there is no schema version or upgrade path.

**M2. Language-specific alphabets**  
Language alphabets are loaded by script injection (`<script src="config/alphabet/...js">` injected into `<head>`). A modern rewrite using fetch() would be more robust but changes the loading contract.

**M3. Drag behavior during Mithril v1 lifecycle**  
Draggabilly instances are created in Mithril v1's `config` callback and stored on DOM elements by index (`element.index = index`). The index-based approach is fragile: if the list order changes between renders, indices can become stale. A rewrite must use stable symbol IDs.

**M4. No test suite**  
There is zero test coverage. Rewriting requires writing tests first to capture behavior before changing it.

### Low Risks

**L1. Mithril v1 API**  
Mithril v1 is EOL. Any framework migration (Vue, React, etc.) requires replacing all `m()` calls, `m.prop()` usage, and `config` callbacks.

**L2. CSS class-based coloring**  
Color theme is set by `document.body.className`. This is a simple pattern to migrate.

---

## 13. Rewrite Map

| Current File/Module | Responsibility | Dependencies | Layer | Keep | Rewrite | Remove | Proposed Package | Notes |
|---|---|---|---|---|---|---|---|---|
| `index.html` | Shell, script loading, DOM mounts | All libs | Infrastructure | No | Yes | No | `app` | Replace with modern bundler entry |
| `index.css` | Layout, component styles | DOM | UI | No | Yes | No | `editor/styles` | Convert to scoped component styles |
| `index.js:spatials.Symbol` | Symbol data model (key, x, y, selected) | m.prop | Core Domain | No | Yes | No | `core` | Remove m.prop; use plain class with typed fields |
| `index.js:signmaker.vm.list/sort/terms` | Editor document state | spatials | Core Domain | No | Yes | No | `core` | Extract as immutable document model |
| `index.js:signmaker.vm.fswlive()` | FSW string generation | ssw.bbox, ssw.max | FSW Engine | No | Yes | No | `fsw` | Pure function: document → FSW string |
| `index.js:signmaker.vm.fsw()` (setter) | FSW parsing into internal model | ssw.sign, regex | FSW Engine | No | Yes | No | `fsw` | Pure function: FSW string → document |
| `index.js:signmaker.vm.fswnorm()` | FSW normalization | ssw.norm | FSW Engine | No | Yes | No | `fsw` | Pure function: FSW → normalized FSW |
| `index.js:signmaker.vm.fswview/swuview` | Two-way text field binding | ssw.parse | UI Binding | No | Yes | No | `editor` | Framework-specific binding |
| `index.js:midWidth/midHeight math` | Screen ↔ FSW coord transform | DOM clientWidth | Layout Engine | No | Yes | No | `layout` | Extract as pure coordinate transform functions |
| `index.js:bbox auto-centering in view()` | Viewport auto-scroll | ssw.bbox, DOM | Layout Engine | No | Yes | No | `layout` | Remove from render function; move to command |
| `index.js:sbDragEnd` | Symbol drag-in-editor handler | Draggabilly, DOM | Interaction | No | Yes | No | `editor` | Decouple from library; use pointer events |
| `index.js:palDragEnd` | Palette→editor drag handler | Draggabilly, DOM, getOffset | Interaction | No | Yes | No | `editor` | Decouple from library |
| `index.js:seqDragEnd` | Sort sequence reorder drag | Draggabilly, DOM | Interaction | No | Yes | No | `editor` | Decouple from library |
| `index.js:checkKeyboard` | Keyboard event dispatch | keyboard config, DOM | Interaction | No | Yes | No | `editor` | Replace with declarative keybinding system |
| `index.js:signmaker.vm.add/delete/move/...` | Symbol manipulation commands | signmaker state | Core Domain | No | Yes | No | `core` | Extract as pure Command objects |
| `index.js:addhistory/undo/redo` | Undo/redo history | JSON.stringify | Command System | No | Yes | No | `editor` | Extract as generic command history |
| `index.js:signmaker.vm.dlpng/dlsvg` | Export to PNG/SVG | ssw.canvas, ssw.svg, DOM | Infrastructure | No | Yes | No | `storage` | Decouple from vm; use storage service |
| `index.js:signmaker.vm.insert/update/delentry` | Dictionary CRUD | localStorage | Storage | No | Yes | No | `storage` | Extract as storage service |
| `index.js:signmaker.view()` | Full editor UI render | Mithril, ssw.svg, DOM | UI | No | Yes | No | `vue/` or `react/` | Framework component |
| `index.js:dictionary.*` | Dictionary browse/search/import/export | Mithril, ssw, localStorage | Mixed UI/Storage | No | Yes | No | `storage` + `vue/` | Split search logic from UI |
| `index.js:palette.*` | Symbol picker UI | Mithril, ssw, window.alphabet | UI | No | Yes | No | `vue/` or `react/` | Framework component |
| `index.js:header.*` | Title bar | Mithril | UI | No | Yes | No | `vue/` or `react/` | Trivial, inline |
| `lib/SuttonSignWriting.min.js` | FSW engine, SVG rendering, bbox, norm | TTF fonts, DOM | Core + Rendering | No | Yes | No | `fsw` + `renderer` | Replace with `@sutton-signwriting/core` |
| `lib/mithril.min.js` | UI framework | DOM | UI Framework | No | Yes | No | (chosen framework) | Replace with Vue/React/etc. |
| `lib/draggabilly.min.js` | Drag-and-drop | DOM | Interaction | No | Yes | No | (pointer events) | Replace with native pointer events |
| `lib/translate.min.js` | i18n | — | i18n | No | Yes | No | `vue-i18n` or similar | Replace with framework-native i18n |
| `config/alphabet.js` | Symbol group definitions (ISWA 2010) | — | Core Domain | Yes | No | No | `core` | Valid domain data; convert to JSON/TypeScript |
| `config/keyboard.js` | Key bindings | — | Configuration | Yes | No | No | `editor` | Valid config; convert to TypeScript |
| `config/messages.js` | UI translations (100+ languages) | — | i18n | Yes | No | No | `i18n` | Valid data; convert to standard i18n format |
| `config/dictionary.js` | Empty dictionary template | — | Storage | No | No | Yes | — | Remove; initialize empty dict in code |

---

## 14. Target Architecture Proposal

### Proposed Package Structure

```
packages/
├── core/               # Framework-agnostic domain model
│   ├── models/
│   │   ├── Symbol.ts           # key, x, y + validation
│   │   ├── Sign.ts             # list of Symbol + sort sequence
│   │   └── Dictionary.ts       # collection of Sign + term sets
│   ├── commands/
│   │   ├── AddSymbol.ts
│   │   ├── DeleteSymbol.ts
│   │   ├── MoveSymbol.ts
│   │   ├── RotateSymbol.ts
│   │   ├── MirrorSymbol.ts
│   │   ├── FillSymbol.ts
│   │   ├── VariationSymbol.ts
│   │   └── ReorderSequence.ts
│   └── events/
│       └── EditorEvent.ts
│
├── fsw/                # FSW/SWU engine (pure functions)
│   ├── parse.ts        # FSW string → Sign model
│   ├── generate.ts     # Sign model → FSW string
│   ├── normalize.ts    # FSW → normalized FSW
│   ├── validate.ts     # FSW validation
│   ├── convert.ts      # FSW ↔ SWU
│   └── query.ts        # FSW search queries
│
├── layout/             # Coordinate math and layout algorithms
│   ├── BoundingBox.ts  # bbox calculation
│   ├── Coordinates.ts  # FSW ↔ screen coordinate transforms
│   └── Layout.ts       # Sign layout algorithms, auto-centering
│
├── renderer/           # Rendering abstractions
│   ├── SymbolRenderer.ts       # Abstract interface
│   ├── SvgRenderer.ts          # SVG-based renderer
│   ├── CanvasRenderer.ts       # Canvas-based renderer
│   └── FontMetrics.ts          # Font-based symbol sizing
│
├── editor/             # Interaction + command + undo
│   ├── EditorState.ts          # Immutable state type
│   ├── CommandHistory.ts       # Undo/redo stack
│   ├── SelectionEngine.ts      # Selection model
│   ├── DragEngine.ts           # Drag interaction (framework-independent)
│   └── KeyboardBindings.ts     # Keyboard → command mapping
│
├── storage/            # Persistence + import/export
│   ├── DictionaryStorage.ts    # Local dictionary CRUD
│   ├── FswExport.ts            # FSW/SWU text export
│   ├── SvgExport.ts            # SVG file export
│   └── PngExport.ts            # PNG file export via canvas
│
├── vue/                # Vue 3 bindings
│   ├── components/
│   │   ├── SignEditor.vue
│   │   ├── SymbolPalette.vue
│   │   └── Dictionary.vue
│   └── composables/
│       ├── useEditorState.ts
│       └── useSymbolDrag.ts
│
├── react/              # React bindings
│   └── components/
│       ├── SignEditor.tsx
│       ├── SymbolPalette.tsx
│       └── Dictionary.tsx
│
└── web-components/     # Framework-independent UI wrapper
    └── SignEditorElement.ts
```

### Key Architectural Principles for the Rewrite

1. **Pure functions for FSW operations** — `parse`, `generate`, `normalize` take data, return data, no side effects
2. **Immutable Sign model** — commands return new state; history is trivially an array of states
3. **Stable symbol IDs** — each symbol gets a UUID, not an array index
4. **Separate coordinate transforms** — screen pixels and FSW coordinates are clearly separated types
5. **No font-blocking startup** — use SVG path-based rendering or pre-rasterized glyphs
6. **Framework bindings are thin** — all logic lives in `core`, `fsw`, `layout`, `editor`; framework packages only wire up reactivity

---

## 15. Modernization Strategy

### Phase 1: Documentation & Test Extraction

**Objective:** Capture all current behavior as executable tests before touching any code.

- Document every `signmaker.vm.*` method with input/output examples
- Write integration tests for FSW round-trips using `ssw.norm()` outputs as golden values
- Write property-based tests for coordinate transformations
- Document all edge cases found (deletion bug, negative coordinates, box type loss)

**Risks:** Discovering undocumented behaviors that tests fail to capture  
**Dependencies:** None  
**Deliverables:** Test suite covering current behavior

---

### Phase 2: Extract FSW Engine

**Objective:** Create `packages/fsw` as a pure TypeScript library.

- Deobfuscate or adopt `@sutton-signwriting/core` as a basis
- Implement `parse`, `generate`, `normalize`, `validate`, `convert`, `query` as pure functions
- Verify round-trip FSW → parse → generate → normalize produces identical output to `ssw.norm()`
- Publish as standalone npm package

**Risks:** `ssw.norm()` behavior may have undocumented edge cases  
**Dependencies:** Phase 1 tests as specification  
**Deliverables:** `@signwriter/fsw` npm package with 100% test coverage

---

### Phase 3: Extract Layout/Bounding-Box Engine

**Objective:** Create `packages/layout` as a pure TypeScript library.

- Implement `BoundingBox` (compute from Sign + font metrics)
- Implement `Coordinates` (FSW ↔ screen transforms as typed functions)
- Implement `Layout` (auto-centering, sign extent, normalization)
- Decouple from TTF font loading; accept symbol size provider as dependency injection

**Risks:** Symbol dimensions depend on font metrics; headless testing requires a mock size provider  
**Dependencies:** Phase 2 FSW engine  
**Deliverables:** `@signwriter/layout` npm package

---

### Phase 4: Extract Interaction Engine

**Objective:** Create `packages/editor` with command system and interaction model.

- Define immutable `EditorState` type: `{ symbols: Symbol[], sort: string[], selection: Set<string>, terms: string[] }`
- Implement `Command` interface + all command classes
- Implement `CommandHistory` (pure undo/redo)
- Implement `SelectionEngine`
- Implement `DragEngine` (framework-independent, pointer-events based)
- Implement `KeyboardBindings`

**Risks:** Drag behavior depends on layout calculations (coordinate transforms)  
**Dependencies:** Phases 2+3  
**Deliverables:** `@signwriter/editor` npm package

---

### Phase 5: Extract Renderer

**Objective:** Create `packages/renderer` with pluggable rendering backends.

- Define `SymbolRenderer` interface: `render(key: string, options) → SVGElement | void`
- Implement `SvgRenderer` using font-based SVG (current approach)
- Implement `CanvasRenderer` for PNG export
- Add caching layer (symbol key → SVG/canvas output)
- Handle font loading asynchronously with fallback

**Risks:** Font-based rendering requires browser environment; server-side rendering needs path-based approach  
**Dependencies:** Phase 3 (symbol sizing)  
**Deliverables:** `@signwriter/renderer` npm package

---

### Phase 6: Create TypeScript APIs

**Objective:** TypeScript type definitions and public API stabilization.

- Define all public types: `Symbol`, `Sign`, `FSWString`, `Coordinate`, `BoundingBox`, etc.
- Ensure all packages have stable, documented public APIs
- Generate TypeScript declaration files

**Risks:** API design decisions that constrain future evolution  
**Dependencies:** Phases 2–5  
**Deliverables:** Typed public APIs for all packages

---

### Phase 7: Create Framework Wrappers

**Objective:** Create `packages/vue`, `packages/react`, `packages/web-components`.

- Vue 3 composables wrapping `@signwriter/editor` state
- React hooks wrapping `@signwriter/editor` state
- Web Component wrapping the full editor without framework dependency
- All wrappers are thin; all business logic in core packages

**Risks:** Framework update compatibility  
**Dependencies:** Phases 2–6  
**Deliverables:** Framework-specific npm packages

---

### Phase 8: Replace Legacy Implementation

**Objective:** Replace `index.js` with the new packages.

- Wire `signmaker.view` → Vue/React component
- Wire `dictionary` → `@signwriter/storage` + framework component
- Wire `palette` → framework component using `@signwriter/core` symbol data
- Remove `lib/SuttonSignWriting.min.js`, `lib/mithril.min.js`, `lib/draggabilly.min.js`
- Add build system (Vite or similar)
- Add proper i18n (vue-i18n or i18next)

**Risks:** Behavior divergence from Phase 1 tests; font migration  
**Dependencies:** All previous phases  
**Deliverables:** Modern application with identical user-visible behavior

---

## Appendix: Key Code Locations Reference

| Topic | File | Lines |
|---|---|---|
| App initialization | index.js | 1486–1533 |
| Symbol data model | index.js | 321–330 |
| Editor view model (full) | index.js | 336–712 |
| FSW generation | index.js | 405–416 |
| FSW parsing (setter) | index.js | 426–444 |
| FSW normalization | index.js | 423–424 |
| History (addhistory) | index.js | 546–557 |
| Undo | index.js | 559–572 |
| Redo | index.js | 574–587 |
| Symbol add | index.js | 594–601 |
| Symbol delete | index.js | 623–630 |
| Symbol move | index.js | 702–711 |
| Symbol rotate | index.js | 678–685 |
| Symbol mirror | index.js | 647–654 |
| Symbol fill | index.js | 656–663 |
| Symbol variation (scroll) | index.js | 638–645 |
| Selection (cycle) | index.js | 687–701 |
| Deselect all | index.js | 607–611 |
| Over (z-order) | index.js | 665–677 |
| Signbox drag end | index.js | 717–735 |
| Signbox drag start | index.js | 737–740 |
| Sequence drag end | index.js | 742–756 |
| Editor view function | index.js | 758–1145 |
| BBox auto-centering | index.js | 763–771 |
| Grid SVG generation | index.js | 773–803 |
| Symbol div rendering | index.js | 804–823 |
| Palette drag end | index.js | 1376–1401 |
| Palette view | index.js | 1410–1443 |
| Palette select drill-down | index.js | 1170–1242 |
| Keyboard handler | index.js | 1535–1558 |
| Keyboard keydown prevent | index.js | 1446–1456 |
| Dictionary search | index.js | 214–248 |
| Dictionary import | index.js | 170–190 |
| PNG download | index.js | 496–503 |
| SVG download | index.js | 504–524 |
| newentry (save format) | index.js | 493–494 |
| Symbol groups | config/alphabet.js | 1–32 |
| Key bindings config | config/keyboard.js | 1–26 |
