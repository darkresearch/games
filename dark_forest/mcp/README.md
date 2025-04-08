# Dark Forest MCP Server

MCP server for Dark Forest game interactions

This is a TypeScript-based MCP server that implements Dark Forest game functionality through the Model Context Protocol.

## Environment Variables

- `DARK_FOREST_CONTRACT_ADDRESS` - The address of the Dark Forest game contract
- `DARK_FOREST_JSON_RPC_URL` - JSON RPC URL for Ethereum node connection (defaults to "http://localhost:8545")
- `DARK_FOREST_NETWORK_ID` - Ethereum network ID (defaults to "1" for mainnet)

## Features

### Resources
- `darkforest://players` - List of all players in the game
- `darkforest://planets` - List of planets discovered by a specific player

### Tools
- `init_player` - Initialize a new player
- `move` - Move forces between planets
- `get_planet` - Get planet details
- `get_player` - Get player details
- `reveal_location` - Reveal a planet's location
- `upgrade_planet` - Upgrade a planet
- `buy_hat` - Buy a hat for a planet
- `deposit_artifact` - Deposit an artifact on a planet
- `withdraw_artifact` - Withdraw an artifact from a planet
- `activate_artifact` - Activate an artifact
- `withdraw_silver` - Withdraw silver from a planet

## Development

Install dependencies:
```bash
npm install
```

Build the server:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run watch
```

## Installation

To use with Claude Desktop, add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "Dark Forest MCP": {
      "command": "/path/to/Dark Forest MCP/build/index.js"
    }
  }
}
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.
