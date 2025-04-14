/**
 * Planet-related resource schemas for Dark Forest MCP
 */
export const planetResources = [
  {
    uri: "/planet/{planetId}",
    mimeType: "application/json",
    name: "Planet",
    description: "Information about a specific planet in the game",
    parameters: {
      planetId: {
        type: "string",
        description: "The locationId of the planet in hex format",
        required: true
      },
      player: {
        type: "string",
        description: "Ethereum address of the player to use for querying the planet",
        required: false
      }
    }
  }
]; 