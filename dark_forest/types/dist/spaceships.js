"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpaceshipTypeDesc = exports.SpaceshipTypeNames = exports.SpaceshipType = void 0;
/**
 * Enumeration of spaceships
 */
exports.SpaceshipType = {
    Mothership: 0,
    Whale: 1,
    Crescent: 2,
    Gear: 3,
    Titan: 4,
};
/**
 * Mapping from Spaceships to pretty-printed names.
 */
exports.SpaceshipTypeNames = {
    [exports.SpaceshipType.Mothership]: 'Mothership',
    [exports.SpaceshipType.Whale]: 'Whale',
    [exports.SpaceshipType.Crescent]: 'Crescent',
    [exports.SpaceshipType.Gear]: 'Gear',
    [exports.SpaceshipType.Titan]: 'Titan',
};
/**
 * Mapping from Spaceships to pretty-printed descriptions.
 */
exports.SpaceshipTypeDesc = {
    [exports.SpaceshipType.Mothership]: '2x Energy Growth',
    [exports.SpaceshipType.Whale]: '2x Silver Growth',
    [exports.SpaceshipType.Crescent]: 'Convert to Asteroid',
    [exports.SpaceshipType.Gear]: 'Prospect Artifacts',
    [exports.SpaceshipType.Titan]: 'Halt Energy & Silver Growth',
};
//# sourceMappingURL=spaceships.js.map