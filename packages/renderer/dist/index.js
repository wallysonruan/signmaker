"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForFonts = exports.loadFonts = exports.getSymbolSize = exports.renderSymbolBody = exports.renderSymbol = exports.renderSignBody = exports.renderSign = exports.buildSymbolStyleSuffix = exports.buildSignStyleSuffix = void 0;
var style_1 = require("./style");
Object.defineProperty(exports, "buildSignStyleSuffix", { enumerable: true, get: function () { return style_1.buildSignStyleSuffix; } });
Object.defineProperty(exports, "buildSymbolStyleSuffix", { enumerable: true, get: function () { return style_1.buildSymbolStyleSuffix; } });
var SignRenderer_1 = require("./SignRenderer");
Object.defineProperty(exports, "renderSign", { enumerable: true, get: function () { return SignRenderer_1.renderSign; } });
Object.defineProperty(exports, "renderSignBody", { enumerable: true, get: function () { return SignRenderer_1.renderSignBody; } });
var SymbolRenderer_1 = require("./SymbolRenderer");
Object.defineProperty(exports, "renderSymbol", { enumerable: true, get: function () { return SymbolRenderer_1.renderSymbol; } });
Object.defineProperty(exports, "renderSymbolBody", { enumerable: true, get: function () { return SymbolRenderer_1.renderSymbolBody; } });
Object.defineProperty(exports, "getSymbolSize", { enumerable: true, get: function () { return SymbolRenderer_1.getSymbolSize; } });
var fonts_1 = require("./fonts");
Object.defineProperty(exports, "loadFonts", { enumerable: true, get: function () { return fonts_1.loadFonts; } });
Object.defineProperty(exports, "waitForFonts", { enumerable: true, get: function () { return fonts_1.waitForFonts; } });
//# sourceMappingURL=index.js.map