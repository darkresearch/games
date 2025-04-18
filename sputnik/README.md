# SPUTNIK Space Exploration Game

SPUTNIK is a space exploration game where an AI agent pilots a spaceship through a procedurally generated universe. The objective is to navigate from a starting planet to a target planet. Human users can assist the AI agent by providing guidance through a chat interface.

## Game Features

- Procedurally generated universe with 69+ planets of different types
- AI-controlled spaceship that navigates through the universe
- Resource management (fuel, health)
- Planet interactions
- User assistance through chat

## Technical Architecture

The SPUTNIK game uses a multi-service architecture:

1. **Next.js Frontend**: Visualizes the universe and spaceship in 3D
2. **Supabase**: Stores and synchronizes spaceship state in real-time
3. **Python AI Service**: Controls the spaceship via API calls

The architecture flows like this:
- Python AI agent → calls API endpoints → Next.js backend
- Next.js backend → updates → Supabase database
- Supabase → real-time updates → Frontend components

## Technical Stack

- **Frontend**: Next.js 15.3.0 with React 19
- **3D Rendering**: Three.js with React Three Fiber
- **3D Helpers**: @react-three/drei
- **Post-processing**: @react-three/postprocessing
- **State Management**: Supabase real-time database
- **Styling**: TailwindCSS

## AI Agent Integration

The AI agent controls the spaceship through authenticated API endpoints:

- `GET /api/spaceship/status`: Get the current state of the spaceship
- `POST /api/spaceship/control`: Send commands to control the spaceship

API documentation is available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## Implementation Details

### Frontend Components

- **Physics System**: Handles interpolation between state updates
- **Spaceship Component**: Visualization with real-time state subscription
- **Supabase Integration**: Real-time state management
- **API Routes**: Authentication and command processing

### Directory Structure

```
/src/app/components/game/spaceship/
├── PhysicsSystem.ts    # Physics interpolation for smooth movement
├── Spaceship.tsx       # Visual representation of spaceship
├── api.ts              # API client for local API communication

/src/app/api/spaceship/
├── control/route.ts    # API endpoint for receiving commands from Python
├── status/route.ts     # API endpoint for status retrieval

/src/lib/
├── supabase.ts         # Supabase client and state management utilities

/src/app/components/game/panels/
├── spaceship.tsx       # UI panel showing spaceship status
```

## Running the Game

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials and API key

# Start the development server
npm run dev
```

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SPACESHIP_CONTROL_API_KEY`: API key for authenticating Python backend requests

## Future Enhancements

- Replace the placeholder cube with a detailed spaceship model
- Implement full physics-based movement with inertia and gravity
- Add a fuel recharge mechanism on planets
- Add a chat interface for communication with the AI agent
- Implement collision detection
- Add mission objectives and challenges

## License

MIT
