"use strict";
/**
 * This package contains serializers and deserializers for converting between
 * various representations of Dark Forest data, for example between raw data
 * received from blockchain calls to Dark Forest contracts and the typescript
 * types used across the client.
 *
 * ## Installation
 *
 * You can install this package using [`npm`](https://www.npmjs.com) or
 * [`yarn`](https://classic.yarnpkg.com/lang/en/) by running:
 *
 * ```bash
 * npm install --save @darkforest_eth/serde
 * ```
 * ```bash
 * yarn add @darkforest_eth/serde
 * ```
 *
 * When using this in a plugin, you might want to load it with [skypack](https://www.skypack.dev)
 *
 * ```js
 * import * as serde from 'http://cdn.skypack.dev/@darkforest_eth/serde'
 * ```
 *
 * @packageDocumentation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./address"), exports);
__exportStar(require("./arrival"), exports);
__exportStar(require("./artifact"), exports);
__exportStar(require("./event"), exports);
__exportStar(require("./location"), exports);
__exportStar(require("./planet"), exports);
__exportStar(require("./player"), exports);
__exportStar(require("./reveal"), exports);
__exportStar(require("./transactions"), exports);
__exportStar(require("./upgrade"), exports);
//# sourceMappingURL=index.js.map