export * from './ping';
export * from './player';
export * from './planet';

// Re-export all schemas combined
import { pingResources } from './ping';
import { playerResources } from './player';
import { planetResources } from './planet';

/**
 * All resource schemas for the MCP
 */
export const resourceSchemas = []; 