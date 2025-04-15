export * from './miner';
export * from './planet';
export * from './player';

// Re-export all schemas combined
import { minerSchemas } from './miner';
import { planetSchemas } from './planet';
import { playerSchemas } from './player';
import { pingSchemas } from './ping';

/**
 * All tool schemas for the MCP
 */
export const toolSchemas = [
  ...pingSchemas,
  ...minerSchemas,
  ...playerSchemas,
  ...planetSchemas,
]; 
