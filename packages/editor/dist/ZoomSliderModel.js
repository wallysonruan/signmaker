"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createZoomSliderModel = createZoomSliderModel;
const Viewport_1 = require("./Viewport");
const LOG_MIN = Math.log(Viewport_1.VIEWPORT_MIN_ZOOM);
const LOG_MAX = Math.log(Viewport_1.VIEWPORT_MAX_ZOOM);
function createZoomSliderModel() {
    return {
        scaleToSlider(scale) {
            return ((Math.log(scale) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100;
        },
        sliderToScale(pos) {
            return Math.exp(LOG_MIN + (pos / 100) * (LOG_MAX - LOG_MIN));
        },
        formatScale(scale) {
            return `${Math.round(scale * 100)}%`;
        },
        atMin(scale) {
            return scale <= Viewport_1.VIEWPORT_MIN_ZOOM;
        },
        atMax(scale) {
            return scale >= Viewport_1.VIEWPORT_MAX_ZOOM;
        },
    };
}
//# sourceMappingURL=ZoomSliderModel.js.map