/**
 * Player-related resource schemas for Dark Forest MCP
 */
export const playerResources = [
  {
    uri: "/players",
    mimeType: "application/json",
    name: "Players",
    description: "List of all players in the game"
  },
  {
    uri: "/player/location",
    mimeType: "application/json",
    name: "Player Location",
    description: "Get the current location of a player"
  }
]; 