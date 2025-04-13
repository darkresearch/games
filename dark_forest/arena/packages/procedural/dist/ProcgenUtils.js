"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHatSizeName = exports.getPlanetBlurb2 = exports.getPlanetBlurb = exports.getPlanetTagline = exports.getPlanetNameHash = exports.getConfigName = exports.getPlanetName = exports.getPlanetTitle = exports.getPlanetCosmetic = exports.getRuinsInfo = exports.artifactRandomInt = exports.artifactRandom = exports.planetRandomInt = exports.configRandom = exports.planetRandom = exports.planetPerlin = exports.getPlanetClass = exports.getPlayerColorVec = exports.getPlayerColor = exports.hashToHue = exports.hslToRgb = exports.rgbStr = exports.hslStr = exports.hatTypeFromHash = exports.grayColors = exports.getBiomeRgbStr = exports.titleCase = void 0;
const constants_1 = require("@darkforest_eth/constants");
const gamelogic_1 = require("@darkforest_eth/gamelogic");
const hashing_1 = require("@darkforest_eth/hashing");
const serde_1 = require("@darkforest_eth/serde");
const types_1 = require("@darkforest_eth/types");
const Noise_1 = __importDefault(require("./Noise"));
const ProcgenConsts_1 = require("./ProcgenConsts");
const tracery_1 = __importDefault(require("./tracery"));
const tracery_modifiers_1 = require("./tracery-modifiers");
const titleCase = (title) => title
    .split(/ /g)
    .map((word, i) => {
    // don't capitalize articles unless it's the first word
    if (i !== 0 && ['of', 'the'].includes(word))
        return word;
    return `${word.substring(0, 1).toUpperCase()}${word.substring(1)}`;
})
    .join(' ');
exports.titleCase = titleCase;
const blurbsById = new Map();
const blurbs2ById = new Map();
const cosmeticByLocId = new Map();
const baseByBiome = {
    [types_1.Biome.UNKNOWN]: [0, 0, 0],
    [types_1.Biome.OCEAN]: [213, 100, 50],
    [types_1.Biome.FOREST]: [135, 96, 63],
    [types_1.Biome.GRASSLAND]: [82, 80, 76],
    [types_1.Biome.TUNDRA]: [339, 95, 70],
    [types_1.Biome.SWAMP]: [44, 81, 33],
    [types_1.Biome.DESERT]: [51, 78, 60],
    [types_1.Biome.ICE]: [198, 78, 77],
    [types_1.Biome.WASTELAND]: [0, 0, 18],
    [types_1.Biome.LAVA]: [19, 100, 50],
    [types_1.Biome.CORRUPTED]: [100, 80, 54],
};
const oceanByBiome = {
    [types_1.Biome.UNKNOWN]: [0, 0, 0],
    [types_1.Biome.OCEAN]: [213, 89, 35],
    [types_1.Biome.FOREST]: [193, 96, 43],
    [types_1.Biome.GRASSLAND]: [185, 78, 70],
    [types_1.Biome.TUNDRA]: [201, 95, 70],
    [types_1.Biome.SWAMP]: [285, 81, 33],
    [types_1.Biome.DESERT]: [27, 78, 60],
    [types_1.Biome.ICE]: [198, 90, 85],
    [types_1.Biome.WASTELAND]: [0, 98, 42],
    [types_1.Biome.LAVA]: [12, 92, 39],
    [types_1.Biome.CORRUPTED]: [128, 90, 63],
};
const strByBiome = new Map();
function getBiomeRgbStr(biome) {
    if (biome === types_1.Biome.WASTELAND)
        return '#888';
    const s = strByBiome.get(biome);
    if (s)
        return s;
    const str = rgbStr(hslToRgb(baseByBiome[biome]));
    strByBiome.set(biome, str);
    return str;
}
exports.getBiomeRgbStr = getBiomeRgbStr;
exports.grayColors = {
    baseHue: 0,
    baseStr: '#888',
    bgStr: '#888',
    baseColor: [120, 120, 120],
    baseColor2: [120, 120, 120],
    baseColor3: [120, 120, 120],
    mtnColor: [120, 120, 120],
    mtnColor2: [120, 120, 120],
    mtnColor3: [120, 120, 120],
    backgroundColor: [120, 120, 120],
    previewColor: [120, 120, 120],
    landRgb: [0, 0, 0],
    oceanRgb: [0, 0, 0],
    beachRgb: [0, 0, 0],
    asteroidHsl: [0, 0, 0],
    seed: 0,
    spacetime1: [0, 0, 0],
    spacetime2: [0, 0, 0],
    spacetime3: [0, 0, 0],
    ruins: undefined,
    // ultra ultra hacky, but we're doing this since it's cached in the renderer
    hatType: types_1.HatType.GraduationCap,
};
const namesById = new Map();
const configsById = new Map();
const taglinesById = new Map();
const huesByHash = new Map();
const rgbsByHash = new Map();
function hatTypeFromHash(hash) {
    const rand = planetRandomInt(hash);
    if (rand() % 69 === 0)
        return types_1.HatType.Fish;
    if (rand() % 16 === 0)
        return types_1.HatType.SantaHat;
    const mod = rand() % 8;
    switch (mod) {
        case 0:
            return types_1.HatType.GraduationCap;
        case 1:
            return types_1.HatType.PartyHat;
        case 2:
            return types_1.HatType.Squid;
        case 3:
            return types_1.HatType.TopHat;
        case 4:
            return types_1.HatType.Fez;
        case 5:
            return types_1.HatType.ChefHat;
        case 6:
            return types_1.HatType.CowboyHat;
        case 7:
            return types_1.HatType.PopeHat;
        default:
            return types_1.HatType.GraduationCap;
    }
}
exports.hatTypeFromHash = hatTypeFromHash;
function hslStr(h, s, l) {
    return `hsl(${h % 360},${s}%,${l}%)`;
}
exports.hslStr = hslStr;
function rgbStr(rgb) {
    const [r, g, b] = rgb;
    return `rgb(${r}, ${g}, ${b})`;
}
exports.rgbStr = rgbStr;
function hslToRgb([h, s, l]) {
    s = Math.max(Math.min(s, 100), 0);
    l = Math.max(Math.min(l, 100), 0);
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) {
        r = c;
        g = x;
        b = 0;
    }
    else if (60 <= h && h < 120) {
        r = x;
        g = c;
        b = 0;
    }
    else if (120 <= h && h < 180) {
        r = 0;
        g = c;
        b = x;
    }
    else if (180 <= h && h < 240) {
        r = 0;
        g = x;
        b = c;
    }
    else if (240 <= h && h < 300) {
        r = x;
        g = 0;
        b = c;
    }
    else if (300 <= h && h < 360) {
        r = c;
        g = 0;
        b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return [r, g, b];
}
exports.hslToRgb = hslToRgb;
function hashToHue(hash) {
    if (huesByHash.has(hash)) {
        return huesByHash.get(hash) || 0;
    }
    const baseHue = (0, serde_1.hashToInt)(hash) % 360;
    huesByHash.set(hash, baseHue);
    return baseHue;
}
exports.hashToHue = hashToHue;
function getPlayerColor(player, teamsEnabled) {
    if (!player || player.address == constants_1.EMPTY_ADDRESS)
        return '#996666';
    const input = teamsEnabled ? (player.team * 9941).toString() : player.address.slice(2);
    return hslStr(hashToHue(input), 100, 70); // remove 0x
}
exports.getPlayerColor = getPlayerColor;
function getPlayerColorVec(player, teamsEnabled) {
    if (!player || player.address == constants_1.EMPTY_ADDRESS)
        return [153, 153, 102, 255];
    const value = teamsEnabled ? (player.team * 9941).toString() : player.address.slice(2);
    if (!rgbsByHash.has(value)) {
        const noAlpha = hslToRgb([hashToHue(value), 100, 70]);
        const withAlpha = [...noAlpha, 1];
        rgbsByHash.set(value, withAlpha);
    }
    return rgbsByHash.get(value);
}
exports.getPlayerColorVec = getPlayerColorVec;
function getPlanetClass(planet) {
    const upgrade = planet.upgradeState;
    let maxIdx = 0;
    let maxVal = -1;
    for (let i = 0; i < upgrade.length; i++) {
        if (upgrade[i] > maxVal) {
            maxIdx = i;
            maxVal = upgrade[i];
        }
    }
    return maxIdx;
}
exports.getPlanetClass = getPlanetClass;
// returns a deterministic seeded perlin (-1, 1) for a given planet loc
function planetPerlin(loc) {
    const realHash = loc.substring(4, loc.length);
    const noise = Noise_1.default.getInstance();
    const offset = parseInt('0x' + realHash.substring(0, 10));
    const t = (num) => num / 100 + offset;
    return (coords) => {
        const ret = noise.simplex2(t(coords.x), t(coords.y));
        return ret;
    };
}
exports.planetPerlin = planetPerlin;
// returns a deterministic seeded random fn for a given planet loc
// TODO memoize this guy
function planetRandom(loc) {
    // shouldn't need to clone since loc is primitive but just to be safe
    const realHash = loc.substring(4, loc.length);
    let count = 0;
    const countOffset = parseInt('0x' + realHash.substring(0, 10));
    return () => {
        count++;
        const ret = (0, hashing_1.seededRandom)(count + countOffset);
        return ret;
    };
}
exports.planetRandom = planetRandom;
function configRandom(config) {
    // shouldn't need to clone since loc is primitive but just to be safe
    const realHash = config.substring(4, config.length);
    let count = 0;
    const countOffset = parseInt('0x' + realHash.substring(0, 10));
    return () => {
        count++;
        const ret = (0, hashing_1.seededRandom)(count + countOffset);
        return ret;
    };
}
exports.configRandom = configRandom;
function planetRandomInt(loc) {
    const rand = planetRandom(loc);
    return () => Math.floor(rand() * 2 ** 24);
}
exports.planetRandomInt = planetRandomInt;
function artifactRandom(loc) {
    // shouldn't need to clone since loc is primitive but just to be safe
    const realHash = loc.substring(4, loc.length);
    let count = 0;
    const countOffset = parseInt('0x' + realHash.substring(0, 10));
    return () => {
        count++;
        const ret = (0, hashing_1.seededRandom)(count + countOffset);
        return ret;
    };
}
exports.artifactRandom = artifactRandom;
function artifactRandomInt(loc) {
    const rand = artifactRandom(loc);
    return () => Math.floor(rand() * 2 ** 24);
}
exports.artifactRandomInt = artifactRandomInt;
function getRuinsInfo(loc) {
    const myInfo = {};
    const rand = planetRandom(loc);
    const randInt = planetRandomInt(loc);
    for (let i = constants_1.MIN_PLANET_LEVEL; i <= constants_1.MAX_PLANET_LEVEL; i++) {
        const blooms = (randInt() % 4) + 1;
        const reflect = randInt() % 2;
        const vel = -1 + rand() * 2;
        const w1 = rand();
        const w2 = rand();
        const w3 = rand();
        const w4 = rand();
        const sum = w1 + w2 + w3 + w4;
        myInfo[i] = {
            weights: [w1 / sum, w2 / sum, w3 / sum, w4 / sum],
            props: [blooms, reflect, vel, 0],
        };
    }
    return myInfo;
}
exports.getRuinsInfo = getRuinsInfo;
function getPlanetCosmetic(planet) {
    if (!planet)
        return exports.grayColors;
    if (cosmeticByLocId.has(planet.locationId)) {
        return cosmeticByLocId.get(planet.locationId) || exports.grayColors;
    }
    // biome-defined
    const baseColor = (0, gamelogic_1.isLocatable)(planet) ? baseByBiome[planet.biome] : [0, 0, 50];
    const oceanColor = (0, gamelogic_1.isLocatable)(planet) ? oceanByBiome[planet.biome] : [0, 0, 20];
    const baseHue = hashToHue(planet.locationId);
    const seed = parseInt('0x' + planet.locationId.substring(0, 9));
    const bL = Math.min(baseColor[2] + 20, 92);
    const baseColor2 = [baseColor[0], baseColor[1], bL - 10];
    const baseColor3 = [baseColor[0], baseColor[1], bL];
    const sL = Math.max(0, baseColor[2] - 30);
    const sS = baseColor[1] - 10;
    const secondaryColor = [baseColor[0], sS, sL];
    const secondaryColor2 = [baseColor[0], sS, sL + 10];
    const secondaryColor3 = [baseColor[0], sS, sL + 20];
    const beachColor = [
        baseColor[0] + 10,
        baseColor[1] - 30,
        Math.min(baseColor[2] + 23, 100),
    ];
    const asteroidHsl = ((0, gamelogic_1.isLocatable)(planet) && planet.biome === types_1.Biome.WASTELAND ? [0, 0, 40] : baseColor);
    /* calculate spacetime rip colors */
    const spacetime1 = [baseHue, 75, 70];
    const spacetime2 = [baseHue + 15, 70, 55];
    const spacetime3 = [baseHue - 15, 65, 60];
    const colors = {
        baseStr: hslStr(...baseColor),
        bgStr: hslStr(oceanColor[0], Math.min(oceanColor[1] + 30, 100), 80),
        baseHue,
        baseColor: hslToRgb(baseColor),
        baseColor2: hslToRgb(baseColor2),
        baseColor3: hslToRgb(baseColor3),
        mtnColor: hslToRgb(secondaryColor),
        mtnColor2: hslToRgb(secondaryColor2),
        mtnColor3: hslToRgb(secondaryColor3),
        backgroundColor: hslToRgb(oceanColor),
        previewColor: hslToRgb(baseColor),
        landRgb: hslToRgb(baseColor),
        oceanRgb: hslToRgb(oceanColor),
        beachRgb: hslToRgb(beachColor),
        spacetime1: hslToRgb(spacetime1),
        spacetime2: hslToRgb(spacetime2),
        spacetime3: hslToRgb(spacetime3),
        asteroidHsl,
        seed,
        hatType: hatTypeFromHash(planet.locationId),
        ruins: getRuinsInfo(planet.locationId),
    };
    cosmeticByLocId.set(planet.locationId, colors);
    return colors;
}
exports.getPlanetCosmetic = getPlanetCosmetic;
function getPlanetTitle(planet) {
    if (!planet)
        return 'Unknown';
    const myRank = (0, gamelogic_1.getPlanetRank)(planet);
    let ret = 'Planet';
    if (myRank === 1) {
        ret = 'Settlement';
    }
    else if (myRank === 2) {
        ret = 'Colony';
    }
    else if (myRank === 3) {
        ret = 'Spaceport';
    }
    else if (myRank === 4) {
        ret = 'Stronghold';
    }
    else if (myRank === 5) {
        ret = 'Galactic Stronghold';
    }
    return ret;
}
exports.getPlanetTitle = getPlanetTitle;
function getPlanetName(planet) {
    if (!planet)
        return 'Unknown';
    return getPlanetNameHash(planet.locationId);
}
exports.getPlanetName = getPlanetName;
function getConfigName(config) {
    const name = configsById.get(config);
    if (name)
        return name;
    let planetName = '';
    const rand = configRandom(config);
    const randInt = () => Math.floor(rand() * 2 ** 24);
    if (randInt() % 1024 === 0) {
        planetName = 'Clown Town';
    }
    else {
        const word1 = ProcgenConsts_1.planetNameWords[randInt() % ProcgenConsts_1.planetNameWords.length];
        const word2 = ProcgenConsts_1.planetNameWords[randInt() % ProcgenConsts_1.planetNameWords.length];
        planetName = (0, exports.titleCase)(`${word1} ${word2}`);
    }
    configsById.set(config, planetName);
    return planetName;
}
exports.getConfigName = getConfigName;
function getPlanetNameHash(locId) {
    const name = namesById.get(locId);
    if (name)
        return name;
    let planetName = '';
    const randInt = planetRandomInt(locId);
    if (randInt() % 1024 === 0) {
        planetName = 'Clown Town';
    }
    else {
        const word1 = ProcgenConsts_1.planetNameWords[randInt() % ProcgenConsts_1.planetNameWords.length];
        const word2 = ProcgenConsts_1.planetNameWords[randInt() % ProcgenConsts_1.planetNameWords.length];
        planetName = (0, exports.titleCase)(`${word1} ${word2}`);
    }
    namesById.set(locId, planetName);
    return planetName;
}
exports.getPlanetNameHash = getPlanetNameHash;
function getPlanetTagline(planet) {
    if (!planet)
        return 'The empty unknown';
    const tagline = taglinesById.get(planet.locationId);
    if (tagline)
        return tagline;
    let myTagline = '';
    if (getPlanetName(planet) === 'Clown Town') {
        myTagline = `A town of clowns`;
    }
    else {
        const randInt = planetRandomInt(planet.locationId);
        const adj1 = ProcgenConsts_1.planetTagAdj[randInt() % ProcgenConsts_1.planetTagAdj.length];
        const adj2 = ProcgenConsts_1.planetTagAdj[randInt() % ProcgenConsts_1.planetTagAdj.length];
        const noun = ProcgenConsts_1.planetTagNoun[randInt() % ProcgenConsts_1.planetTagNoun.length];
        myTagline = `A ${adj1}, ${adj2} ${noun}`;
    }
    taglinesById.set(planet.locationId, myTagline);
    return myTagline;
}
exports.getPlanetTagline = getPlanetTagline;
// this one doesn't mention the name
function getPlanetBlurb(planet) {
    if (!planet)
        return 'The vast, empty unknown of space contains worlds of infinite possibilities. Select a planet to learn more...';
    const myBlurb = blurbsById.get(planet.locationId);
    if (myBlurb)
        return myBlurb;
    let append = '';
    if (getPlanetName(planet) === 'Clown Town') {
        append = `Founded in 1998 by Brian Gu, who remains the CEO of Clown Town to this day. `;
    }
    tracery_1.default.setRng(planetRandom(planet.locationId));
    const myGrammar = {
        // geography, atmosphere, fauna, flora, fun fact
        story: [
            `#geography.capitalize# #populates#. ` +
                `The #air# is #descair#. ` +
                `#myflora.capitalize# #bloom# #colors#. ` +
                `#many.capitalize# species of #species# #populate# the #habitat#. ` +
                `#funfact.capitalize#\.`,
        ],
        origin: ['#[myflora:#flora#]story#'],
    };
    const grammar = tracery_1.default.createGrammar({ ...ProcgenConsts_1.blurbGrammar, ...myGrammar });
    grammar.addModifiers(tracery_modifiers_1.baseEngModifiers);
    const blurb = append + grammar.flatten('#origin#');
    blurbsById.set(planet.locationId, blurb);
    return blurb;
}
exports.getPlanetBlurb = getPlanetBlurb;
// this one mentions the name
function getPlanetBlurb2(planet) {
    if (!planet)
        return '';
    const myBlurb = blurbs2ById.get(planet.locationId);
    if (myBlurb)
        return myBlurb;
    const name = getPlanetName(planet);
    const tagline = getPlanetTagline(planet);
    const myGrammar = {
        story: [
            `The people of ${name} have #learned# to #live# in a ${tagline}. ${name}'s #mysun# #sends# an #flock# of #bads# #sometimes#. Over the #years#, they've #removed# the #mysun# by #throwing# #warbears#. In doing so, they've learned that #lesson#\.`,
        ],
        origin: [`#[mysun:#sun#]story#`],
    };
    tracery_1.default.setRng(planetRandom(planet.locationId));
    const grammar = tracery_1.default.createGrammar({ ...ProcgenConsts_1.blurb2grammar, ...myGrammar });
    grammar.addModifiers(tracery_modifiers_1.baseEngModifiers);
    const blurb = grammar.flatten('#origin#');
    blurbs2ById.set(planet.locationId, blurb);
    return blurb;
}
exports.getPlanetBlurb2 = getPlanetBlurb2;
function getHatSizeName(planet) {
    const maxHat = constants_1.HAT_SIZES.length;
    const lv = planet.hatLevel;
    if (lv < maxHat)
        return constants_1.HAT_SIZES[lv];
    else
        return 'H' + 'A'.repeat(4 * 2 ** (lv - maxHat + 1)) + 'T';
}
exports.getHatSizeName = getHatSizeName;
//# sourceMappingURL=ProcgenUtils.js.map