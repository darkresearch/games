// Spaceship related types and constants
import { Vector3 } from './PhysicsSystem';

// Spaceship status type
export type SpaceshipStatus = {
  position: Vector3;
  velocity: Vector3;
  rotation: Vector3;
  fuel: number;
};

// Target planet ID for HUD
export const TARGET_PLANET_ID = 'JUPITER'; 