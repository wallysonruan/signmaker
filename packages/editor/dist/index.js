"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelDrag = exports.endDrag = exports.updateDrag = exports.startDrag = exports.actionToCommand = exports.lookupAction = exports.DEFAULT_BINDINGS = exports.stateToNormalizedFsw = exports.stateToFsw = exports.stateFromFsw = exports.redo = exports.undo = exports.canRedo = exports.canUndo = exports.apply = exports.createHistory = exports.cycleSelection = exports.selectById = exports.selectNone = exports.getSelected = exports.EMPTY_STATE = void 0;
var types_1 = require("./types");
Object.defineProperty(exports, "EMPTY_STATE", { enumerable: true, get: function () { return types_1.EMPTY_STATE; } });
__exportStar(require("./commands"), exports);
var SelectionEngine_1 = require("./SelectionEngine");
Object.defineProperty(exports, "getSelected", { enumerable: true, get: function () { return SelectionEngine_1.getSelected; } });
Object.defineProperty(exports, "selectNone", { enumerable: true, get: function () { return SelectionEngine_1.selectNone; } });
Object.defineProperty(exports, "selectById", { enumerable: true, get: function () { return SelectionEngine_1.selectById; } });
Object.defineProperty(exports, "cycleSelection", { enumerable: true, get: function () { return SelectionEngine_1.cycleSelection; } });
var CommandHistory_1 = require("./CommandHistory");
Object.defineProperty(exports, "createHistory", { enumerable: true, get: function () { return CommandHistory_1.createHistory; } });
Object.defineProperty(exports, "apply", { enumerable: true, get: function () { return CommandHistory_1.apply; } });
Object.defineProperty(exports, "canUndo", { enumerable: true, get: function () { return CommandHistory_1.canUndo; } });
Object.defineProperty(exports, "canRedo", { enumerable: true, get: function () { return CommandHistory_1.canRedo; } });
Object.defineProperty(exports, "undo", { enumerable: true, get: function () { return CommandHistory_1.undo; } });
Object.defineProperty(exports, "redo", { enumerable: true, get: function () { return CommandHistory_1.redo; } });
var FSWBridge_1 = require("./FSWBridge");
Object.defineProperty(exports, "stateFromFsw", { enumerable: true, get: function () { return FSWBridge_1.stateFromFsw; } });
Object.defineProperty(exports, "stateToFsw", { enumerable: true, get: function () { return FSWBridge_1.stateToFsw; } });
Object.defineProperty(exports, "stateToNormalizedFsw", { enumerable: true, get: function () { return FSWBridge_1.stateToNormalizedFsw; } });
var KeyboardBindings_1 = require("./KeyboardBindings");
Object.defineProperty(exports, "DEFAULT_BINDINGS", { enumerable: true, get: function () { return KeyboardBindings_1.DEFAULT_BINDINGS; } });
Object.defineProperty(exports, "lookupAction", { enumerable: true, get: function () { return KeyboardBindings_1.lookupAction; } });
Object.defineProperty(exports, "actionToCommand", { enumerable: true, get: function () { return KeyboardBindings_1.actionToCommand; } });
var DragEngine_1 = require("./DragEngine");
Object.defineProperty(exports, "startDrag", { enumerable: true, get: function () { return DragEngine_1.startDrag; } });
Object.defineProperty(exports, "updateDrag", { enumerable: true, get: function () { return DragEngine_1.updateDrag; } });
Object.defineProperty(exports, "endDrag", { enumerable: true, get: function () { return DragEngine_1.endDrag; } });
Object.defineProperty(exports, "cancelDrag", { enumerable: true, get: function () { return DragEngine_1.cancelDrag; } });
//# sourceMappingURL=index.js.map