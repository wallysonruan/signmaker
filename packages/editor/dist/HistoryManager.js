"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMementoCommand = createMementoCommand;
exports.createDefaultHistory = createDefaultHistory;
/**
 * Wrap a pure transform into a reversible command using the memento pattern:
 * the pre-execute state is captured during execute() and restored by undo().
 *
 * This gives every existing command factory (addSymbol, moveSelected, …) a
 * correct inverse for free, without hand-writing reverse logic. Each instance
 * is single-use per history slot; redo re-executes and re-captures.
 */
function createMementoCommand(name, transform) {
    let before;
    return {
        name,
        execute(state) {
            before = state;
            return transform(state);
        },
        undo(_state) {
            // Returns the captured pre-execute state. _state is the post-execute
            // present; ignored because the memento restores by value.
            return before;
        },
    };
}
function createDefaultHistory(initial) {
    let present = initial;
    const past = [];
    const future = [];
    const hooks = {
        push: [],
        undo: [],
        redo: [],
        clear: [],
        beforePush: [],
        afterPush: [],
        beforeUndo: [],
        afterUndo: [],
        beforeRedo: [],
        afterRedo: [],
    };
    function sub(list, fn) {
        list.push(fn);
        return () => { const i = list.indexOf(fn); if (i >= 0)
            list.splice(i, 1); };
    }
    function push(command) {
        const next = command.execute(present);
        if (next === present)
            return; // no-op dedup (reference equality), matches prior behavior
        hooks.beforePush.forEach(fn => fn(command));
        past.push(command);
        present = next;
        future.length = 0;
        hooks.afterPush.forEach(fn => fn(command));
        hooks.push.forEach(fn => fn(command));
    }
    function undo() {
        const command = past[past.length - 1];
        if (!command)
            return;
        hooks.beforeUndo.forEach(fn => fn(command));
        present = command.undo(present);
        past.pop();
        future.unshift(command);
        hooks.afterUndo.forEach(fn => fn(command));
        hooks.undo.forEach(fn => fn(command));
    }
    function redo() {
        const command = future[0];
        if (!command)
            return;
        hooks.beforeRedo.forEach(fn => fn(command));
        present = command.execute(present);
        future.shift();
        past.push(command);
        hooks.afterRedo.forEach(fn => fn(command));
        hooks.redo.forEach(fn => fn(command));
    }
    function clear() {
        past.length = 0;
        future.length = 0;
        hooks.clear.forEach(fn => fn());
    }
    return {
        push,
        undo,
        redo,
        canUndo: () => past.length > 0,
        canRedo: () => future.length > 0,
        current: () => present,
        replace: (state) => { present = state; },
        clear,
        onPush: fn => sub(hooks.push, fn),
        onUndo: fn => sub(hooks.undo, fn),
        onRedo: fn => sub(hooks.redo, fn),
        onClear: fn => sub(hooks.clear, fn),
        beforePush: fn => sub(hooks.beforePush, fn),
        afterPush: fn => sub(hooks.afterPush, fn),
        beforeUndo: fn => sub(hooks.beforeUndo, fn),
        afterUndo: fn => sub(hooks.afterUndo, fn),
        beforeRedo: fn => sub(hooks.beforeRedo, fn),
        afterRedo: fn => sub(hooks.afterRedo, fn),
    };
}
//# sourceMappingURL=HistoryManager.js.map