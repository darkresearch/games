import { Chunk, LocationId, WorldCoords } from '@darkforest_eth/types';

// Import the raw JSON data as a string
const mapJson = `[{"chunkFootprint":{"sideLength":2048,"bottomLeft":{"x":-2048,"y":-4096}},"planetLocations":[{"coords":{"x":-21,"y":-2087},"hash":"0001731e067412cc2db57b22323943e8778068cd67a31ef792a1807cb7edd5cd","perlin":16,"biomebase":16},{"coords":{"x":-104,"y":-2139},"hash":"00015ab100b1a0462fc2205aa0dcc1beb7ec5772dbbd92b2f3926b5503a01979","perlin":17,"biomebase":17},{"coords":{"x":-148,"y":-2290},"hash":"00011edf6e3068504c0bda71803895ac53a7bb123c1886d9e8270bd0c21ff5bf","perlin":18,"biomebase":18},{"coords":{"x":-298,"y":-2429},"hash":"00015f9e22f7e93cfb88f6d5b914b7cac69b3bdb9aec1a3621642d81ca50701b","perlin":18,"biomebase":18}]},{"chunkFootprint":{"sideLength":128,"bottomLeft":{"x":-128,"y":-128}},"planetLocations":[]},{"chunkFootprint":{"sideLength":512,"bottomLeft":{"x":-512,"y":-512}},"planetLocations":[{"coords":{"x":-148,"y":-290},"hash":"00011edf6e3068504c0bda71803895ac53a7bb123c1886d9e8270bd0c21ff5bf","perlin":18,"biomebase":18},{"coords":{"x":-298,"y":-429},"hash":"00015f9e22f7e93cfb88f6d5b914b7cac69b3bdb9aec1a3621642d81ca50701b","perlin":18,"biomebase":18},{"coords":{"x":-104,"y":-139},"hash":"00015ab100b1a0462fc2205aa0dcc1beb7ec5772dbbd92b2f3926b5503a01979","perlin":17,"biomebase":17}]},{"chunkFootprint":{"sideLength":256,"bottomLeft":{"x":-256,"y":-256}},"planetLocations":[{"coords":{"x":-148,"y":-290},"hash":"00011edf6e3068504c0bda71803895ac53a7bb123c1886d9e8270bd0c21ff5bf","perlin":18,"biomebase":18}]},{"chunkFootprint":{"sideLength":1024,"bottomLeft":{"x":-1024,"y":-1024}},"planetLocations":[{"coords":{"x":-148,"y":-290},"hash":"00011edf6e3068504c0bda71803895ac53a7bb123c1886d9e8270bd0c21ff5bf","perlin":18,"biomebase":18},{"coords":{"x":-298,"y":-429},"hash":"00015f9e22f7e93cfb88f6d5b914b7cac69b3bdb9aec1a3621642d81ca50701b","perlin":18,"biomebase":18},{"coords":{"x":-104,"y":-139},"hash":"00015ab100b1a0462fc2205aa0dcc1beb7ec5772dbbd92b2f3926b5503a01979","perlin":17,"biomebase":17}]},{"chunkFootprint":{"sideLength":4096,"bottomLeft":{"x":-4096,"y":-4096}},"planetLocations":[{"coords":{"x":-21,"y":-2087},"hash":"0001731e067412cc2db57b22323943e8778068cd67a31ef792a1807cb7edd5cd","perlin":16,"biomebase":16},{"coords":{"x":-104,"y":-2139},"hash":"00015ab100b1a0462fc2205aa0dcc1beb7ec5772dbbd92b2f3926b5503a01979","perlin":17,"biomebase":17},{"coords":{"x":-148,"y":-2290},"hash":"00011edf6e3068504c0bda71803895ac53a7bb123c1886d9e8270bd0c21ff5bf","perlin":18,"biomebase":18},{"coords":{"x":-298,"y":-2429},"hash":"00015f9e22f7e93cfb88f6d5b914b7cac69b3bdb9aec1a3621642d81ca50701b","perlin":18,"biomebase":18}]}]`;

// Parse and convert the JSON data to properly typed Chunk array
// Note: Array order is preserved from the input JSON, maintaining the exact chunk sequence:
// 1. 2048x2048 chunk at (-2048, -4096)
// 2. 128x128 chunk at (-128, -128)
// 3. 512x512 chunk at (-512, -512)
// 4. 256x256 chunk at (-256, -256)
// 5. 1024x1024 chunk at (-1024, -1024)
// 6. 4096x4096 chunk at (-4096, -4096)
const jsonData = JSON.parse(mapJson);
export const mapData: Chunk[] = jsonData.map((chunk: any) => ({
  ...chunk,
  planetLocations: chunk.planetLocations.map((planet: any) => ({
    ...planet,
    hash: planet.hash as LocationId
  }))
}));
