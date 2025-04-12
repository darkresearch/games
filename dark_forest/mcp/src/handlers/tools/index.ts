import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { PlayerRegistry } from "../../registry/PlayerRegistry";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { toolSchemas } from "../../types/index";

// Import all handlers
import { setupMinerHandlers } from './miner';
import { setupPlayerHandlers } from './player';
// import { setupPlanetHandlers } from './planet';
// import { setupArtifactHandlers } from './artifact';
// import { setupGameStateHandlers } from './gameState';
// import { setupCaptureZoneHandlers } from './captureZone';
// import { setupSocialHandlers } from './social';

/**
 * Sets up all tool handlers on the server
 */
export function setupToolHandlers(server: Server, playerRegistry: PlayerRegistry) {
  // Set up the ListTools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {    
    return { tools: toolSchemas };
  });

  // Set up the CallTool handler that routes to specific handlers
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    
    // Route to appropriate handler based on tool name
    switch (toolName) {
      // Mining tools
      case "mine_chunk":
        return setupMinerHandlers(playerRegistry, request);

      // Player tools
      // case "get_player":
      // case "get_all_players":
      // case "get_energy_of_player":
      // case "get_silver_of_player":
      // case "get_player_space_junk":
      // case "get_player_space_junk_limit":
      // case "get_player_blocked_planets":
      // case "get_player_defense_planets":
      // case "get_targets_held":
      // case "set_ready":
      // case "is_admin":
      case "generate_pubkey":
      case "init_player":
          return setupPlayerHandlers(server, playerRegistry, request);

      // Planet tools  
      // case "get_planet":
      // case "move":
      // case "upgrade_planet":
      // case "buy_hat":
      // case "get_planets_in_range":
      // case "get_max_move_dist":
      // case "get_energy_needed_for_move":
      // case "get_time_for_move":
      // case "get_dist":
      // case "get_planet_range":
      // case "is_planet_locatable":
      // case "is_space_ship":
      // case "get_planet_name":
      // case "is_planet_mineable":
      // case "get_temperature":
      // case "transfer_ownership":
      // case "bulk_get_planets":
      //   return setupPlanetHandlers(server, playerRegistry, request);

      // // Artifact tools
      // case "get_artifact":
      // case "deposit_artifact":
      // case "withdraw_artifact":
      // case "activate_artifact":
      // case "deactivate_artifact":
      // case "get_active_artifact":
      // case "prospect_planet":
      // case "find_artifact":
      //   return setupArtifactHandlers(server, playerRegistry, request);

      // // Game state tools
      // case "get_world_radius":
      // case "get_hash_config":
      // case "get_end_time_seconds":
      // case "get_token_mint_end_time_seconds":
      // case "is_game_over":
      // case "get_winners":
      // case "is_competitive":
      // case "get_teams_enabled":
      // case "get_game_duration":
      // case "get_start_time":
      // case "time_until_next_broadcast":
      // case "claim_victory":
      //   return setupGameStateHandlers(server, playerRegistry, request);

      // // Capture zone tools
      // case "get_capture_zones":
      // case "is_planet_in_capture_zone":
      // case "get_next_capture_zone_change":
      // case "invade_planet":
      // case "capture_planet":
      // case "is_move_blocked":
      // case "is_capture_blocked":
      //   return setupCaptureZoneHandlers(server, playerRegistry, request);

      // // Social tools
      // case "submit_verify_twitter":
      // case "disconnect_twitter":
      // case "get_twitter":
      // case "set_planet_emoji":
      // case "clear_emoji":
      //   return setupSocialHandlers(server, playerRegistry, request);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  });
} 