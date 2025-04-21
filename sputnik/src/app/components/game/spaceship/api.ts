// Spaceship related API functionality
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

// Function to control the spaceship
export async function controlSpaceship(command: string, params: any): Promise<any> {
  try {
    // Send command to the API
    const response = await fetch('/api/spaceship/control', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 1234' // This should ideally come from environment variables
      },
      body: JSON.stringify({
        command: command,
        ...params
      })
    });
    
    // Parse the response
    const result = await response.json();
    
    // Check for errors
    if (!response.ok) {
      throw new Error(result.error || 'Failed to control spaceship');
    }
    
    return result;
  } catch (error) {
    console.error('Error controlling spaceship:', error);
    throw error;
  }
} 