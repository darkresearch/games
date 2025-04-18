// API utilities for spaceship control
// Handles communication with the Python backend service

import { Vector3 } from './PhysicsSystem';
import { spaceshipState } from '@/lib/supabase';

// Types for API requests and responses
export type SpaceshipCommand = {
  command: 'move' | 'rotate' | 'stop' | 'status';
  direction?: Vector3;
  magnitude?: number;
  target?: Vector3;
  speed?: number;
};

export type SpaceshipStatus = {
  position: Vector3;
  velocity: Vector3;
  rotation: Vector3;
  fuel: number;
};

// The target planet is fixed for the entire game
export const TARGET_PLANET_ID = 42; // Replace with actual target planet ID 

// Convert Supabase array format to Vector3
const arrayToVector3 = (arr: [number, number, number]): Vector3 => ({ 
  x: arr[0], 
  y: arr[1], 
  z: arr[2] 
});

class SpaceshipAPI {
  private baseUrl: string;
  private controlEndpoint: string;
  
  constructor() {
    // In production, this would point to the actual backend service
    this.baseUrl = '/api/spaceship';
    this.controlEndpoint = `${this.baseUrl}/control`;
  }
  
  // Send a command to the backend
  async sendCommand(command: SpaceshipCommand): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(this.controlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send command to spaceship');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending spaceship command:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // Get current spaceship status directly from Supabase
  async getStatus(): Promise<SpaceshipStatus | null> {
    try {
      const state = await spaceshipState.getState();
      
      if (!state) {
        console.warn('No spaceship state found in Supabase');
        return null;
      }
      
      // Convert the Supabase state format to our API format
      return {
        position: arrayToVector3(state.position),
        velocity: arrayToVector3(state.velocity),
        rotation: {
          x: state.rotation[0],
          y: state.rotation[1],
          z: state.rotation[2]
        },
        fuel: state.fuel
      };
    } catch (error) {
      console.error('Error getting spaceship status from Supabase:', error);
      return null;
    }
  }
  
  // Helper method to move the spaceship
  async move(direction: Vector3, magnitude: number): Promise<{ success: boolean }> {
    return this.sendCommand({
      command: 'move',
      direction,
      magnitude
    });
  }
  
  // Stop the spaceship
  async stop(): Promise<{ success: boolean }> {
    return this.sendCommand({
      command: 'stop'
    });
  }
  
  // Set a target destination
  async setTarget(target: Vector3, speed: number): Promise<{ success: boolean }> {
    return this.sendCommand({
      command: 'move',
      target,
      speed
    });
  }
}

// Export a singleton instance of the API
export const spaceshipAPI = new SpaceshipAPI(); 