// API utilities for spaceship control
// Handles communication with the Python backend service

import { Vector3 } from './PhysicsSystem';

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

class SpaceshipAPI {
  private baseUrl: string;
  private controlEndpoint: string;
  private statusEndpoint: string;
  
  constructor() {
    // In production, this would point to the actual backend service
    this.baseUrl = '/api/spaceship';
    this.controlEndpoint = `${this.baseUrl}/control`;
    this.statusEndpoint = `${this.baseUrl}/status`;
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
  
  // Get current spaceship status
  async getStatus(): Promise<SpaceshipStatus | null> {
    try {
      const response = await fetch(this.statusEndpoint);
      
      if (!response.ok) {
        throw new Error('Failed to get spaceship status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting spaceship status:', error);
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