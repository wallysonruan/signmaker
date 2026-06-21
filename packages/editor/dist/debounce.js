"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = debounce;
function debounce(fn, delayMs) {
    let timerId = null;
    function debounced(...args) {
        if (timerId !== null)
            clearTimeout(timerId);
        timerId = setTimeout(() => {
            timerId = null;
            fn(...args);
        }, delayMs);
    }
    debounced.cancel = function () {
        if (timerId !== null) {
            clearTimeout(timerId);
            timerId = null;
        }
    };
    return debounced;
}
//# sourceMappingURL=debounce.js.map