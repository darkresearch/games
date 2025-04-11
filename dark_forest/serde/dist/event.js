"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNetworkEvent = void 0;
const types_1 = require("@darkforest_eth/types");
/**
 * Returns whether or not the given event is an instance of {@link NetworkEvent}. Not super
 * stringent but works for now.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isNetworkEvent(event) {
    return (typeof event.tx_to === 'string' &&
        typeof event.tx_type === 'string' &&
        typeof event.time_exec_called === 'number' &&
        (event.autoGasPriceSetting === undefined ||
            Object.values(types_1.AutoGasSetting).includes(event.autoGasPriceSetting)));
}
exports.isNetworkEvent = isNetworkEvent;
//# sourceMappingURL=event.js.map