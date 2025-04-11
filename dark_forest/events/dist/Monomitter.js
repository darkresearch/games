"use strict";
// Typed single pub / sub pattern, inspired by:
// https://github.com/loilo/monomitter/blob/master/monomitter.mjs
Object.defineProperty(exports, "__esModule", { value: true });
exports.monomitter = void 0;
/**
 * Constructs a new event emitter, whose purpose is to emit values of the given type.
 *
 * @param emitLatestOnSubscribe - if this is true, upon subscription immediately emit
 *                                the most recently set value, if there is one
 */
function monomitter(emitLatestOnSubscribe = false) {
    const callbacks = new Set();
    let valueBeenSet = false;
    let latestValue = undefined;
    function publish(value) {
        valueBeenSet = true;
        latestValue = value;
        callbacks.forEach((callback) => callback(value));
    }
    function subscribe(callback) {
        callbacks.add(callback);
        if (emitLatestOnSubscribe && valueBeenSet) {
            callback(latestValue);
        }
        return {
            unsubscribe() {
                callbacks.delete(callback);
            },
        };
    }
    function clear() {
        callbacks.clear();
    }
    return {
        publish,
        subscribe,
        clear,
    };
}
exports.monomitter = monomitter;
//# sourceMappingURL=Monomitter.js.map