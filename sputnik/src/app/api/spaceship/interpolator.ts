import { createClient } from 'redis';
import { spaceshipState } from '@/lib/supabase';

// Constants
const MOVEMENT_SPEED = Number(process.env.NEXT_PUBLIC_SPACESHIP_SPEED) || 24.33; // units per second
const ARRIVAL_THRESHOLD = 10; // units
const UPDATE_INTERVAL = 50; // milliseconds (20 updates per second)

// Vector3 type for 3D positions
type Vector3 = {
  x: number;
  y: number;
  z: number;
};

// Class to handle server-side interpolation
export class SpaceshipInterpolator {
  private redis: ReturnType<typeof createClient>;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private currentPosition: Vector3 = { x: 0, y: 0, z: 0 };
  private destination: Vector3 | null = null;
  private spaceshipId: string = '';

  constructor() {
    // Initialize Redis client
    this.redis = createClient({ url: process.env.REDIS_URL });
  }

  async initialize() {
    // Connect to Redis if not already connected
    if (!this.redis.isOpen) {
      await this.redis.connect();
    }

    // Load initial state from Supabase
    const initialState = await spaceshipState.getState();
    if (initialState) {
      this.spaceshipId = initialState.id;
      this.currentPosition = this.arrayToVector3(initialState.position);
      
      if (initialState.destination) {
        this.destination = this.arrayToVector3(initialState.destination);
        this.startInterpolation();
      }

      // Store initial position in Redis
      await this.updateRedisPosition();
    }

    // Subscribe to Supabase changes to react to new destinations
    spaceshipState.subscribeToState(async (state) => {
      if (state.destination && !this.destination) {
        // New destination set
        this.destination = this.arrayToVector3(state.destination);
        this.startInterpolation();
      } else if (!state.destination && this.destination) {
        // Destination cleared
        this.destination = null;
        this.stopInterpolation();
      }

      // If we're not moving, update position from Supabase
      if (!this.destination) {
        this.currentPosition = this.arrayToVector3(state.position);
        await this.updateRedisPosition();
      }
    });
  }

  // Start the position interpolation loop
  private startInterpolation() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    console.log('🚀 SERVER INTERPOLATOR: Starting interpolation');
    
    // Set up interval for position updates
    this.intervalId = setInterval(async () => {
      await this.updatePosition();
    }, UPDATE_INTERVAL);
  }

  // Stop the interpolation loop
  private stopInterpolation() {
    if (!this.isRunning) return;
    this.isRunning = false;
    
    console.log('🚀 SERVER INTERPOLATOR: Stopping interpolation');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Update the spaceship position based on destination
  private async updatePosition() {
    if (!this.destination) return;

    // Calculate direction to destination
    const direction = this.normalizeVector({
      x: this.destination.x - this.currentPosition.x,
      y: this.destination.y - this.currentPosition.y,
      z: this.destination.z - this.currentPosition.z,
    });

    // Calculate distance to destination
    const distance = this.calculateDistance(this.currentPosition, this.destination);

    // Calculate movement distance this update
    const deltaTime = UPDATE_INTERVAL / 1000; // convert ms to seconds
    const moveDistance = MOVEMENT_SPEED * deltaTime;

    // Check if we've reached the destination
    if (distance <= ARRIVAL_THRESHOLD) {
      // We've arrived
      this.currentPosition = {...this.destination};
      this.destination = null;
      this.stopInterpolation();

      // Notify the server of arrival
      await this.notifyArrival();
    } else {
      // Move toward destination
      const movementThisFrame = Math.min(moveDistance, distance);
      this.currentPosition = {
        x: this.currentPosition.x + direction.x * movementThisFrame,
        y: this.currentPosition.y + direction.y * movementThisFrame,
        z: this.currentPosition.z + direction.z * movementThisFrame,
      };
    }

    // Update position in Redis
    await this.updateRedisPosition();
  }

  // Update the position in Redis
  private async updateRedisPosition() {
    const position = [
      this.currentPosition.x,
      this.currentPosition.y,
      this.currentPosition.z
    ];

    const velocity = this.destination ? this.calculateVelocity() : [0, 0, 0];
    const timestamp = Date.now();

    try {
      await this.redis.hSet('sputnik:state', {
        position: JSON.stringify(position),
        velocity: JSON.stringify(velocity),
        destination: this.destination ? JSON.stringify([
          this.destination.x,
          this.destination.y,
          this.destination.z
        ]) : '',
        timestamp: timestamp.toString()
      });
    } catch (error) {
      console.error('Error updating Redis position:', error);
    }
  }

  // Notify the server that we've reached the destination
  private async notifyArrival() {
    try {
      console.log('🚀 SERVER INTERPOLATOR: Notifying arrival at position:', [
        this.currentPosition.x, this.currentPosition.y, this.currentPosition.z
      ]);

      // Update Supabase state
      await spaceshipState.updateState({
        id: this.spaceshipId,
        position: [this.currentPosition.x, this.currentPosition.y, this.currentPosition.z],
        destination: null,
        velocity: [0, 0, 0]
      });
    } catch (error) {
      console.error('Error notifying arrival:', error);
    }
  }

  // Helper: Calculate velocity vector based on current direction and speed
  private calculateVelocity(): [number, number, number] {
    if (!this.destination) return [0, 0, 0];

    const direction = this.normalizeVector({
      x: this.destination.x - this.currentPosition.x,
      y: this.destination.y - this.currentPosition.y,
      z: this.destination.z - this.currentPosition.z,
    });

    return [
      direction.x * MOVEMENT_SPEED,
      direction.y * MOVEMENT_SPEED,
      direction.z * MOVEMENT_SPEED
    ];
  }

  // Helper: Convert array position to Vector3
  private arrayToVector3(arr: number[]): Vector3 {
    return {
      x: arr[0] || 0,
      y: arr[1] || 0,
      z: arr[2] || 0
    };
  }

  // Helper: Calculate distance between two points
  private calculateDistance(a: Vector3, b: Vector3): number {
    return Math.sqrt(
      Math.pow(b.x - a.x, 2) +
      Math.pow(b.y - a.y, 2) +
      Math.pow(b.z - a.z, 2)
    );
  }

  // Helper: Normalize a vector
  private normalizeVector(v: Vector3): Vector3 {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (length === 0) return { x: 0, y: 0, z: 0 };
    
    return {
      x: v.x / length,
      y: v.y / length,
      z: v.z / length
    };
  }

  // Get the current position from Redis
  async getCurrentPosition(): Promise<Vector3 | null> {
    try {
      const positionStr = await this.redis.hGet('sputnik:state', 'position');
      if (!positionStr) return null;
      
      const position = JSON.parse(positionStr);
      return this.arrayToVector3(position);
    } catch (error) {
      console.error('Error getting position from Redis:', error);
      return null;
    }
  }
}

// Create singleton instance
let interpolatorInstance: SpaceshipInterpolator | null = null;

export async function getInterpolator(): Promise<SpaceshipInterpolator> {
  if (!interpolatorInstance) {
    interpolatorInstance = new SpaceshipInterpolator();
    await interpolatorInstance.initialize();
  }
  return interpolatorInstance;
} 