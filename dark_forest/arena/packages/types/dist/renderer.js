"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RendererType = exports.RenderZIndex = exports.TextAnchor = exports.TextAlign = exports.UniformType = exports.DrawMode = exports.AttribType = void 0;
exports.AttribType = {
    Float: 5126,
    UByte: 5121, // window.WebGL2RenderingContext && WebGL2RenderingContext['UNSIGNED_BYTE'],
};
exports.DrawMode = {
    Triangles: 4,
    Lines: 1,
    Points: 0, // window.WebGL2RenderingContext && WebGL2RenderingContext['POINTS'],
};
exports.UniformType = {
    Mat4: 0,
    Mat3: 1,
    UByte: 2,
    Float: 3,
    Texture: 4,
    Vec3: 5,
};
exports.TextAlign = {
    Left: 0,
    Center: 0.5,
    Right: 1,
};
exports.TextAnchor = {
    Top: 0,
    Middle: 0.5,
    Bottom: 1,
};
exports.RenderZIndex = {
    Background: 0,
    Voyages: -1,
    Planets: -10,
    Text: -11,
    UI: -12,
    DEFAULT: -98,
    MAX: -99,
};
exports.RendererType = {
    Planet: 0,
    Mine: 1,
    SpacetimeRip: 2,
    Quasar: 3,
    Ruins: 4,
    Asteroid: 5,
    Ring: 6,
    Sprite: 7,
    BlackDomain: 8,
    Text: 9,
    Voyager: 10,
    Wormhole: 11,
    MineBody: 12,
    Belt: 13,
    Background: 14,
    Space: 15,
    Unmined: 16,
    Perlin: 17,
    Line: 18,
    Rect: 19,
    Circle: 20,
    UI: 21,
    PlanetManager: 22,
    QuasarBody: 23,
    QuasarRay: 24,
    CaptureZone: 25,
};
//# sourceMappingURL=renderer.js.map