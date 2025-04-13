"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DFStatefulAnimation = exports.DFAnimation = exports.PlanetTypeNames = exports.PlanetType = exports.PlanetLevelNames = exports.PlanetLevel = void 0;
/**
 * Enumeration of the possible planet levels.
 */
exports.PlanetLevel = {
    ZERO: 0,
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
    SIX: 6,
    SEVEN: 7,
    EIGHT: 8,
    NINE: 9,
    // Don't forget to update MIN_PLANET_LEVEL and/or MAX_PLANET_LEVEL in the `constants` package
};
/**
 * Mapping from PlanetLevel to pretty-printed names.
 */
exports.PlanetLevelNames = {
    [exports.PlanetLevel.ZERO]: 'Level 0',
    [exports.PlanetLevel.ONE]: 'Level 1',
    [exports.PlanetLevel.TWO]: 'Level 2',
    [exports.PlanetLevel.THREE]: 'Level 3',
    [exports.PlanetLevel.FOUR]: 'Level 4',
    [exports.PlanetLevel.FIVE]: 'Level 5',
    [exports.PlanetLevel.SIX]: 'Level 6',
    [exports.PlanetLevel.SEVEN]: 'Level 7',
    [exports.PlanetLevel.EIGHT]: 'Level 8',
    [exports.PlanetLevel.NINE]: 'Level 9',
};
/**
 * Enumeration of the planet types. (PLANET = 0, SILVER_BANK = 4)
 */
exports.PlanetType = {
    PLANET: 0,
    SILVER_MINE: 1,
    RUINS: 2,
    TRADING_POST: 3,
    SILVER_BANK: 4,
};
/**
 * Mapping from PlanetType to pretty-printed names.
 */
exports.PlanetTypeNames = {
    [exports.PlanetType.PLANET]: 'Planet',
    [exports.PlanetType.SILVER_MINE]: 'Asteroid Field',
    [exports.PlanetType.RUINS]: 'Foundry',
    [exports.PlanetType.TRADING_POST]: 'Spacetime Rip',
    [exports.PlanetType.SILVER_BANK]: 'Quasar',
};
class DFAnimation {
    constructor(update) {
        this._update = update;
        this._value = 0;
    }
    update() {
        this._value = this._update();
    }
    value() {
        return this._value;
    }
}
exports.DFAnimation = DFAnimation;
class DFStatefulAnimation extends DFAnimation {
    constructor(state, update) {
        super(update);
        this._state = state;
    }
    state() {
        return this._state;
    }
}
exports.DFStatefulAnimation = DFStatefulAnimation;
//# sourceMappingURL=planet.js.map