/**
 * Planet-related resource schemas for Dark Forest MCP
 */
export const planetResources = [
  {
    uri: "df:/planet/{planetId}",
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
  },
  {
    uri: "df:/planet/movetime",
    mimeType: "application/json",
    name: "PlanetMoveTime",
    description: "Calculate the time it will take to move from one planet to another",
    parameters: {
      fromX: {
        type: "number",
        description: "X coordinate of the source planet",
        required: true
      },
      fromY: {
        type: "number",
        description: "Y coordinate of the source planet",
        required: true
      },
      toX: {
        type: "number",
        description: "X coordinate of the destination planet",
        required: true
      },
      toY: {
        type: "number",
        description: "Y coordinate of the destination planet",
        required: true
      },
      fromId: {
        type: "string",
        description: "LocationId of the source planet",
        required: true
      },
      toId: {
        type: "string",
        description: "LocationId of the destination planet",
        required: true
      },
      player: {
        type: "string",
        description: "Ethereum address of the player to use for querying the planets",
        required: false
      }
    }
  },
  {
    uri: "df:/planet/maxmovedist",
    mimeType: "application/json",
    name: "PlanetMaxMoveDistance",
    description: "Calculate the maximum distance a player can move from a planet using a percentage of silver",
    parameters: {
      planetId: {
        type: "string",
        description: "The locationId of the planet in hex format",
        required: true
      },
      sendingPercent: {
        type: "number", 
        description: "Percentage of the planet's current silver to use for the move",
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