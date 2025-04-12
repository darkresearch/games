export * from './miner';
export * from './planet';
export * from './artifact';
export * from './player';
export * from './gameState';
export * from './captureZone';
export * from './social';

// Re-export all schemas combined
import { minerSchemas } from './miner';
import { planetSchemas } from './planet';
import { artifactSchemas } from './artifact';
import { playerSchemas } from './player';
import { gameStateSchemas } from './gameState';
import { captureZoneSchemas } from './captureZone';
import { socialSchemas } from './social';

/**
 * All tool schemas for the MCP
 */
export const toolSchemas = [
  ...minerSchemas,
  ...playerSchemas,
  ...planetSchemas,
  // ...artifactSchemas,
  // ...gameStateSchemas,
  // ...captureZoneSchemas,
  // ...socialSchemas
]; 
