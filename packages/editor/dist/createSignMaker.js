"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSignMaker = createSignMaker;
const types_1 = require("./types");
const CommandBus_1 = require("./CommandBus");
const HistoryManager_1 = require("./HistoryManager");
const createScopeManager_1 = require("./interaction/createScopeManager");
const createFocusManager_1 = require("./interaction/createFocusManager");
/**
 * Composition root (inversion of control). Wires the default port adapters
 * together and lets a host application override any of them, so SignMaker
 * participates inside a larger app rather than owning its own services.
 *
 * Framework-agnostic: this constructs no DOM and no reactivity. The Vue adapter
 * `useSignMaker()` layers reactive state and keyboard/focus wiring on top.
 */
function createSignMaker(deps = {}) {
    var _a, _b, _c, _d, _e;
    const history = (_a = deps.history) !== null && _a !== void 0 ? _a : (0, HistoryManager_1.createDefaultHistory)((_b = deps.initialState) !== null && _b !== void 0 ? _b : types_1.EMPTY_STATE);
    const bus = (_c = deps.commandBus) !== null && _c !== void 0 ? _c : (0, CommandBus_1.createCommandBus)({
        apply(transform, name) {
            history.push((0, HistoryManager_1.createMementoCommand)(name, transform));
            return history.current();
        },
    });
    const scopeManager = (_d = deps.scopeManager) !== null && _d !== void 0 ? _d : (0, createScopeManager_1.createScopeManager)();
    const focusManager = (_e = deps.focusManager) !== null && _e !== void 0 ? _e : (0, createFocusManager_1.createFocusManager)();
    return {
        history,
        bus,
        scopeManager,
        focusManager,
        dispatch: (name, transform, payload) => { bus.dispatch(name, transform, payload); },
        getState: () => history.current(),
        replace: (state) => history.replace(state),
        undo: () => history.undo(),
        redo: () => history.redo(),
        canUndo: () => history.canUndo(),
        canRedo: () => history.canRedo(),
    };
}
//# sourceMappingURL=createSignMaker.js.map