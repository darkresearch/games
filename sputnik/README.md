# Sputnik: Full-Screen 3D Space Game

An immersive, high-fidelity 3D space game where you pilot a ship through an infinite universe, navigating between themed planets while managing your fuel resources.

## Features

- **Full-screen immersive experience** with high-fidelity 3D graphics
- **Procedurally themed planets** (Fire, Water, Air, Earth)
- **Physics-based ship controls** with intuitive keyboard/touch inputs
- **Fuel management** system with refueling in planet atmospheres
- **60 FPS performance** with optimized rendering
- **Responsive design** that works on mobile and desktop
- **Post-processing effects** (bloom, depth-of-field) for cinematic polish

## Getting Started

### Prerequisites

- Node.js 21+ recommended

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd sputnik

# Install dependencies
npm install

# Start the development server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Controls

- **W / ↑**: Thrust forward
- **S / ↓**: Thrust backward
- **A / ←**: Rotate left
- **D / →**: Rotate right

Mobile controls use touch-based quadrants of the screen for the same actions.

## Gameplay

1. You start near the **Fire Planet** with a full fuel tank
2. Navigate to the **Water Planet** while managing your fuel
3. Enter planet atmospheres to refuel
4. Successfully reach the target planet to win

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   └── game/
│   │       ├── core/           # Core game components
│   │       │   ├── Game.tsx    # Main game logic
│   │       │   └── Ship.tsx    # Player ship controls
│   │       ├── planets/        # Planet components
│   │       │   ├── Planet.tsx  # Planet rendering
│   │       │   └── AtmosphereZone.tsx # Refueling zones
│   │       ├── ui/             # User interface
│   │       │   └── HUD.tsx     # Heads-up display
│   │       └── utils/          # Utility functions
│   │           ├── GameManager.ts     # Game state management
│   │           └── useKeyControls.ts  # Input handling
│   ├── page.tsx         # Main entry page
│   └── layout.tsx       # Root layout
└── ...
```

## Technologies Used

- **Next.js** with React 18+
- **Three.js** for 3D rendering
- **React Three Fiber** for React/Three.js integration
- **TypeScript** for type safety
- **Tailwind CSS** for UI styling

## License

MIT
