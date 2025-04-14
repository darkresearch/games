"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exactArray10 = exports.exactArray8 = exports.array6 = exports.exactArray5 = exports.exactArray4 = exports.between = exports.withDefault = void 0;
const decoders = __importStar(require("decoders"));
// Decoder helpers that will probably be refactored into a package
function withDefault(decoder, def) {
    return decoders.map(decoders.optional(decoder), (val) => {
        if (val === undefined) {
            return def;
        }
        else {
            return val;
        }
    });
}
exports.withDefault = withDefault;
function between(decoder, min, max) {
    return decoders.compose(decoder, decoders.predicate((val) => val >= min && val <= max, `Must be between ${min} and ${max}`));
}
exports.between = between;
function exactArray4(decoder) {
    return decoders.map(decoders.compose(decoders.array(decoder), decoders.predicate((arr) => arr.length === 4, `Must be exactly 4-length`)), (value) => [value[0], value[1], value[2], value[3]]);
}
exports.exactArray4 = exactArray4;
function exactArray5(decoder) {
    return decoders.map(decoders.compose(decoders.array(decoder), decoders.predicate((arr) => arr.length === 5, `Must be exactly 5-length`)), (value) => [value[0], value[1], value[2], value[3], value[4]]);
}
exports.exactArray5 = exactArray5;
function array6(decoder) {
    return decoders.map(decoders.compose(decoders.array(decoder), decoders.predicate((arr) => arr.length === 6, `Must be exactly 6-length`)), (value) => [value[0], value[1], value[2], value[3], value[4], value[5]]);
}
exports.array6 = array6;
function exactArray8(decoder) {
    return decoders.map(decoders.compose(decoders.array(decoder), decoders.predicate((arr) => arr.length === 8, `Must be exactly 8-length`)), (value) => [
        value[0],
        value[1],
        value[2],
        value[3],
        value[4],
        value[5],
        value[6],
        value[7],
    ]);
}
exports.exactArray8 = exactArray8;
function exactArray10(decoder) {
    return decoders.map(decoders.compose(decoders.array(decoder), decoders.predicate((arr) => arr.length === 10, `Must be exactly 10-length`)), (value) => [
        value[0],
        value[1],
        value[2],
        value[3],
        value[4],
        value[5],
        value[6],
        value[7],
        value[8],
        value[9],
    ]);
}
exports.exactArray10 = exactArray10;
//# sourceMappingURL=decoder-helpers.js.map