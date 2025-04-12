export * from './ping';
export * from './player';

// Re-export all schemas combined
import { pingResources } from './ping';
import { playerResources } from './player';

/**
 * All resource schemas for the MCP
 */
export const resourceSchemas = [
  ...pingResources,
  ...playerResources,
]; 