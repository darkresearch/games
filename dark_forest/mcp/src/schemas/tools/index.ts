export * from './miner';
export * from './planet';
export * from './player';

// Re-export all schemas combined
import { minerSchemas } from './miner';
import { planetSchemas } from './planet';
import { playerSchemas } from './player';

/**
 * All tool schemas for the MCP
 */
export const toolSchemas = [
  ...minerSchemas,
  ...playerSchemas,
  ...planetSchemas,
]; 
