"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaletteScope = createPaletteScope;
const createScopeManager_1 = require("./createScopeManager");
const PaletteNavigationState_1 = require("./PaletteNavigationState");
/**
 * Build the palette interaction scope: it owns the hierarchical navigation state
 * machine and the keyboard semantics (arrows move, Enter adds, Ctrl/Cmd+Enter
 * drills in, Escape goes back). F6 and Escape-at-groups are intentionally left
 * unconsumed so they bubble to the scope-switch handler.
 *
 * Data-agnostic: callers inject the item/column/count providers so this core has
 * no knowledge of ALPHABET/GROUPS.
 */
function createPaletteScope(deps) {
    var _a;
    let nav = (_a = deps.initialNav) !== null && _a !== void 0 ? _a : PaletteNavigationState_1.INITIAL_PALETTE_NAV;
    const changed = [];
    function setNav(next) {
        if (next === nav)
            return;
        nav = next;
        changed.forEach(fn => fn(nav));
    }
    function focusedKey() {
        var _a;
        if (nav.level === 'variants')
            return (0, PaletteNavigationState_1.paletteLevel2FocusedKey)(nav);
        return (_a = deps.itemsAt(nav)[nav.focusedIndex]) !== null && _a !== void 0 ? _a : null;
    }
    function navigate(direction) {
        setNav((0, PaletteNavigationState_1.paletteNavigate)(nav, direction, deps.columnsAt(nav), deps.itemCountAt(nav)));
    }
    function expand() {
        const key = focusedKey();
        if (nav.level === 'groups') {
            if (key === null)
                return;
            setNav((0, PaletteNavigationState_1.paletteEnterGroup)(nav, key));
        }
        else if (nav.level === 'bases') {
            if (key === null)
                return;
            setNav((0, PaletteNavigationState_1.paletteEnterBase)(nav, key));
        }
        else {
            // variants: Ctrl/Cmd+Enter toggles the rotation-range tab
            setNav((0, PaletteNavigationState_1.paletteSetVariantTab)(nav, nav.variantTab === 'first' ? 'second' : 'first'));
        }
    }
    function back() {
        setNav((0, PaletteNavigationState_1.paletteBack)(nav));
    }
    const DIR = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    };
    function handleKey(e) {
        // F6 is the global scope-switch key — let it bubble.
        if (e.key === 'F6' || e.keyCode === 117)
            return false;
        if (e.key === 'Escape') {
            // Back out a level; at the groups level let Escape bubble to switch scope.
            if (nav.level !== 'groups') {
                back();
                return true;
            }
            return false;
        }
        const dir = DIR[e.key];
        if (dir) {
            navigate(dir);
            return true;
        }
        if (e.key === 'Enter') {
            if (e.ctrlKey || e.metaKey) {
                expand();
                return true;
            }
            const key = focusedKey();
            if (key !== null)
                deps.onAddSymbol(key);
            return true;
        }
        return false;
    }
    const scope = (0, createScopeManager_1.createScope)('palette', { handleKey });
    return {
        scope,
        getNav: () => nav,
        setNav,
        navigate,
        expand,
        back,
        focusedKey,
        onNavChanged: (fn) => {
            changed.push(fn);
            return () => { const i = changed.indexOf(fn); if (i >= 0)
                changed.splice(i, 1); };
        },
    };
}
//# sourceMappingURL=createPaletteScope.js.map