export const toolSchemas = [
  {
    name: "init_player",
    description: "Initialize a new player",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "move",
    description: "Move from one planet to another",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        fromId: {
          type: "string",
          description: "Source planet ID"
        },
        toId: {
          type: "string", 
          description: "Destination planet ID"
        },
        forces: {
          type: "number",
          description: "Amount of forces to send"
        },
        silver: {
          type: "number",
          description: "Amount of silver to send"
        }
      },
      required: ["address", "fromId", "toId", "forces"]
    }
  },
  {
    name: "get_planet",
    description: "Get information about a planet",
    inputSchema: {
      type: "object",
      properties: {
        planetId: {
          type: "string",
          description: "Planet ID to get information about"
        }
      },
      required: ["planetId"]
    }
  },
  {
    name: "get_player",
    description: "Get information about a player",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        }
      },
      required: ["address"]
    }
  },
  {
    name: "reveal_location",
    description: "Reveal a planet's location",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        planetId: {
          type: "string",
          description: "Planet ID to reveal"
        }
      },
      required: ["address", "planetId"]
    }
  },
  {
    name: "upgrade_planet",
    description: "Upgrade a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        planetId: {
          type: "string",
          description: "Planet ID to upgrade"
        },
        branch: {
          type: "number",
          description: "Upgrade branch (0: Defense, 1: Range, 2: Speed)"
        }
      },
      required: ["address", "planetId", "branch"]
    }
  },
  {
    name: "buy_hat",
    description: "Buy a hat for a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        planetId: {
          type: "string",
          description: "Planet ID to buy hat for"
        }
      },
      required: ["address", "planetId"]
    }
  },
  {
    name: "deposit_artifact",
    description: "Deposit an artifact on a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        locationId: {
          type: "string",
          description: "Planet ID to deposit artifact on"
        },
        artifactId: {
          type: "string",
          description: "ID of the artifact to deposit"
        }
      },
      required: ["address", "locationId", "artifactId"]
    }
  },
  {
    name: "withdraw_artifact",
    description: "Withdraw an artifact from a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        locationId: {
          type: "string",
          description: "Planet ID to withdraw artifact from"
        },
        artifactId: {
          type: "string",
          description: "ID of the artifact to withdraw"
        }
      },
      required: ["address", "locationId", "artifactId"]
    }
  },
  {
    name: "activate_artifact",
    description: "Activate an artifact on a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        locationId: {
          type: "string",
          description: "Planet ID where artifact is located"
        },
        artifactId: {
          type: "string",
          description: "ID of the artifact to activate"
        },
        wormholeTo: {
          type: "string",
          description: "Optional: Planet ID to create wormhole to"
        }
      },
      required: ["address", "locationId", "artifactId"]
    }
  },
  {
    name: "withdraw_silver",
    description: "Withdraw silver from a planet",
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Player's Ethereum address"
        },
        locationId: {
          type: "string",
          description: "Planet ID to withdraw silver from"
        },
        amount: {
          type: "number",
          description: "Amount of silver to withdraw"
        }
      },
      required: ["address", "locationId", "amount"]
    }
  }
]; 