"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.perlin = exports.MAX_PERLIN_VALUE = exports.getRandomGradientAt = exports.rand = void 0;
const big_integer_1 = __importDefault(require("big-integer"));
const bigFraction_1 = require("./fractions/bigFraction");
const mimc_1 = require("./mimc");
const TRACK_LCM = false;
const rand = (key) => (...args) => {
    return (0, mimc_1.perlinRandHash)(key)(...args)
        .remainder(16)
        .toJSNumber();
};
exports.rand = rand;
/*
const generateVecs = () => {
  const vecs = 16;
  const precision = 3;
  let range: number[] = [];
  for (let i = 0; i < vecs; i++) range.push(i);
  const out = range
    .map((x) => (x * Math.PI * 2) / vecs)
    .map((x) => [
      Math.floor(Math.cos(x) * 10 ** precision),
      Math.floor(Math.sin(x) * 10 ** precision),
    ]);

  return out.map(([x, y]) => ({
    x: new Fraction(x, 10 ** precision),
    y: new Fraction(y, 10 ** precision),
  }));
};

const vecs = generateVecs();
*/
let vecs;
try {
    vecs = [
        [1000, 0],
        [923, 382],
        [707, 707],
        [382, 923],
        [0, 1000],
        [-383, 923],
        [-708, 707],
        [-924, 382],
        [-1000, 0],
        [-924, -383],
        [-708, -708],
        [-383, -924],
        [-1, -1000],
        [382, -924],
        [707, -708],
        [923, -383],
    ].map(([x, y]) => ({ x: new bigFraction_1.Fraction(x, 1000), y: new bigFraction_1.Fraction(y, 1000) }));
}
catch (err) {
    console.error('Browser does not support BigInt.', err);
}
const getRandomGradientAt = (point, scale, randFn) => {
    const val = vecs[randFn(point.x.valueOf(), point.y.valueOf(), scale.valueOf())];
    return val;
};
exports.getRandomGradientAt = getRandomGradientAt;
const minus = (a, b) => {
    return {
        x: a.x.sub(b.x),
        y: a.y.sub(b.y),
    };
};
const dot = (a, b) => {
    return a.x.mul(b.x).add(a.y.mul(b.y));
};
const smoothStep = (x) => {
    // return 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
    return x;
};
const scalarMultiply = (s, v) => ({
    x: v.x.mul(s),
    y: v.y.mul(s),
});
const getWeight = (corner, p) => {
    return smoothStep(new bigFraction_1.Fraction(1).sub(p.x.sub(corner.x).abs())).mul(smoothStep(new bigFraction_1.Fraction(1).sub(p.y.sub(corner.y).abs())));
};
// p is in a scale x scale square. we scale down to a 1x1 square
const perlinValue = (corners, scale, p) => {
    let ret = new bigFraction_1.Fraction(0);
    for (const corner of corners) {
        const distVec = minus(p, corner.coords);
        ret = ret.add(getWeight(scalarMultiply(scale.inverse(), corner.coords), scalarMultiply(scale.inverse(), p)).mul(dot(scalarMultiply(scale.inverse(), distVec), corner.gradient)));
    }
    return ret;
};
let runningLCM = (0, big_integer_1.default)(1);
const updateLCM = (oldLCM, newValue) => {
    if (!TRACK_LCM) {
        return oldLCM;
    }
    const newLCM = big_integer_1.default.lcm(oldLCM, newValue);
    if (newLCM !== oldLCM) {
        console.log('LCM updated to ', newLCM);
    }
    return newLCM;
};
// fractional mod
const realMod = (dividend, divisor) => {
    const temp = dividend.mod(divisor);
    // temp.s is sign
    if (temp.s.toString() === '-1') {
        return temp.add(divisor);
    }
    return temp;
};
const valueAt = (p, scale, randFn) => {
    const bottomLeftCoords = {
        x: p.x.sub(realMod(p.x, scale)),
        y: p.y.sub(realMod(p.y, scale)),
    };
    const bottomRightCoords = {
        x: bottomLeftCoords.x.add(scale),
        y: bottomLeftCoords.y,
    };
    const topLeftCoords = {
        x: bottomLeftCoords.x,
        y: bottomLeftCoords.y.add(scale),
    };
    const topRightCoords = {
        x: bottomLeftCoords.x.add(scale),
        y: bottomLeftCoords.y.add(scale),
    };
    const bottomLeftGrad = {
        coords: bottomLeftCoords,
        gradient: (0, exports.getRandomGradientAt)(bottomLeftCoords, scale, randFn),
    };
    const bottomRightGrad = {
        coords: bottomRightCoords,
        gradient: (0, exports.getRandomGradientAt)(bottomRightCoords, scale, randFn),
    };
    const topLeftGrad = {
        coords: topLeftCoords,
        gradient: (0, exports.getRandomGradientAt)(topLeftCoords, scale, randFn),
    };
    const topRightGrad = {
        coords: topRightCoords,
        gradient: (0, exports.getRandomGradientAt)(topRightCoords, scale, randFn),
    };
    const out = perlinValue([bottomLeftGrad, bottomRightGrad, topLeftGrad, topRightGrad], scale, p);
    return out;
};
exports.MAX_PERLIN_VALUE = 32;
/**
 * Calculates the perlin for a location, given the x,y pair and the PerlinConfig for the game.
 *
 * @param coords An object of the x,y coordinates for which perlin is being calculated.
 * @param options An object containing the configuration for the perlin algorithm.
 */
function perlin(coords, options) {
    let { x, y } = coords;
    if (options.mirrorY)
        x = Math.abs(x); // mirror across the vertical y-axis
    if (options.mirrorX)
        y = Math.abs(y); // mirror across the horizontal x-axis
    const fractionalP = { x: new bigFraction_1.Fraction(x), y: new bigFraction_1.Fraction(y) };
    let ret = new bigFraction_1.Fraction(0);
    const pValues = [];
    for (let i = 0; i < 3; i += 1) {
        // scale must be a power of two, up to 8192
        pValues.push(valueAt(fractionalP, new bigFraction_1.Fraction(options.scale * 2 ** i), (0, exports.rand)(options.key)));
    }
    ret = ret.add(pValues[0]);
    ret = ret.add(pValues[0]);
    ret = ret.add(pValues[1]);
    ret = ret.add(pValues[2]);
    ret = ret.div(4);
    runningLCM = updateLCM(runningLCM, (0, big_integer_1.default)(ret.d));
    ret = ret.mul(exports.MAX_PERLIN_VALUE / 2);
    if (options.floor)
        ret = ret.floor();
    ret = ret.add(exports.MAX_PERLIN_VALUE / 2);
    const out = ret.valueOf();
    return Math.floor(out * 100) / 100;
}
exports.perlin = perlin;
//# sourceMappingURL=perlin.js.map