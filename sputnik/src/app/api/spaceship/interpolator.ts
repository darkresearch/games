import { createClient } from 'redis';
import { RedisStreams, getSputnikUuid } from '@/lib/redis-streams';

// Constants
const MOVEMENT_SPEED = Number(process.env.NEXT_PUBLIC_SPACESHIP_SPEED) || 24.33; // units per second
const ARRIVAL_THRESHOLD = 10; // units
const UPDATE_INTERVAL = 50; // milliseconds (20 updates per second)
const FUEL_CONSUMPTION_RATE = Number(process.env.FUEL_CONSUMPTION_RATE) || 0.01; // fuel units per distance unit

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
  private spaceshipId: string;
  private isNotifyingArrival = false; // Flag to prevent duplicate arrival notifications
  private redisClient: ReturnType<typeof createClient> | null = null;
  private redisStreams: RedisStreams | null = null;
  private lastCommandId: string = '0-0';
  private commandCheckInterval: NodeJS.Timeout | null = null;

  constructor(uuid: string = getSputnikUuid()) {
    // Use the provided UUID or get from environment
    this.spaceshipId = uuid;
    
    // Initialize Redis client
    this.redis = createClient({ url: process.env.REDIS_URL });
  }

  async initialize() {
    // Connect to Redis if not already connected
    if (!this.redis.isOpen) {
      await this.redis.connect();
    }

    // Initialize Redis Streams
    this.redisStreams = await RedisStreams.getInstance();
    
    // Register this Sputnik as active
    if (this.redisStreams) {
      await this.redisStreams.registerSputnik(this.spaceshipId);
    }

    // Load state from Redis
    const state = await this.getState();
    if (state) {
      if (state.position) {
        this.currentPosition = this.arrayToVector3(state.position);
      }
      
      if (state.destination) {
        this.destination = this.arrayToVector3(state.destination);
        this.startInterpolation();
      }
    } else {
      // Initialize Redis with default state if not exists
      console.log(`🚀 SERVER INTERPOLATOR (${this.spaceshipId}): Initializing default state in Redis`);
      await this.updateState({
        position: [0, 0, 0],
        velocity: [0, 0, 0],
        fuel: 100
      });
    }

    // Update Redis with current position
    await this.updateRedisPosition();
    
    // Listen for destination changes through Redis Streams
    await this.setupRedisListener();
  }

  // Get the Redis key for this Sputnik's state
  private getStateKey(): string {
    return `sputnik:${this.spaceshipId}:state`;
  }

  // Set up Redis Stream listener to process commands
  private async setupRedisListener() {
    try {
      // Close previous client if exists
      if (this.redisClient && this.redisClient.isOpen) {
        await this.redisClient.quit();
      }
      
      // Create a new client
      this.redisClient = this.redis.duplicate();
      await this.redisClient.connect();
      
      // Clear any existing interval
      if (this.commandCheckInterval) {
        clearInterval(this.commandCheckInterval);
      }

      // Set up interval to poll for new commands from stream
      this.commandCheckInterval = setInterval(async () => {
        if (!this.redisStreams) return;
        
        try {
          // Read new commands for this specific Sputnik
          const commands = await this.redisStreams.readCommandsForSputnik(this.spaceshipId, this.lastCommandId);
          
          if (commands.length > 0) {
            // Update last command ID
            this.lastCommandId = commands[commands.length - 1].id;
            
            // Process each command
            for (const { command } of commands) {
              if (command.type === 'move_to' && Array.isArray(command.destination)) {
                // Handle move_to command
                this.destination = {
                  x: command.destination[0],
                  y: command.destination[1],
                  z: command.destination[2]
                };
                
                if (!this.isRunning) {
                  this.startInterpolation();
                  console.log(`Received move_to command via Redis Stream for Sputnik ${this.spaceshipId}:`, command.destination);
                }
              } else if (command.type === 'stop') {
                // Handle stop command
                this.destination = null;
                this.stopInterpolation();
                console.log(`Received stop command via Redis Stream for Sputnik ${this.spaceshipId}`);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing Redis Stream commands for Sputnik ${this.spaceshipId}:`, error);
        }
      }, 100); // Check every 100ms
      
      console.log(`Redis Stream command listener initialized for Sputnik ${this.spaceshipId}`);
    } catch (error) {
      console.error(`Failed to set up Redis Stream listener for Sputnik ${this.spaceshipId}:`, error);
    }
  }

  // Start the position interpolation loop
  private startInterpolation() {
    if (this.isRunning) {
      console.log(`🚀 SERVER INTERPOLATOR (${this.spaceshipId}): Already running, not starting again`);
      return;
    }
    
    this.isRunning = true;
    this.isNotifyingArrival = false;
    
    console.log(`🚀 SERVER INTERPOLATOR (${this.spaceshipId}): Starting interpolation`);
    
    // Clear any existing interval to be safe
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Set up interval for position updates
    this.intervalId = setInterval(async () => {
      await this.updatePosition();
    }, UPDATE_INTERVAL);
  }

  // Stop the interpolation loop
  private async stopInterpolation() {
    if (!this.isRunning) {
      console.log(`🚀 SERVER INTERPOLATOR (${this.spaceshipId}): Already stopped, not stopping again`);
      return;
    }
    
    this.isRunning = false;
    
    console.log(`🚀 SERVER INTERPOLATOR (${this.spaceshipId}): Stopping interpolation`);
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Ensure we update Redis with stopped state
    await this.updateRedisPosition();
    
    // Explicitly update isMoving state to ensure it's properly saved
    await this.redis.hSet(this.getStateKey(), 'isMoving', 'false');
  }

  // Get current fuel level
  private async getCurrentFuel(): Promise<number> {
    try {
      const fuelStr = await this.redis.hGet(this.getStateKey(), 'fuel');
      return fuelStr ? parseFloat(fuelStr) : 100; // Default to 100 if not found
    } catch (error) {
      console.error(`Error getting fuel level for Sputnik ${this.spaceshipId}:`, error);
      return 100; // Default value on error
    }
  }

  // Update fuel level
  private async updateFuel(newFuel: number): Promise<void> {
    try {
      await this.redis.hSet(this.getStateKey(), 'fuel', newFuel.toString());
      
      // Publish a fuel update event to stream
      if (this.redisStreams) {
        await this.redisStreams.publishEvent(this.spaceshipId, { 
          type: 'fuel_update', 
          fuel: newFuel 
        });
      }
    } catch (error) {
      console.error(`Error updating fuel level for Sputnik ${this.spaceshipId}:`, error);
    }
  }

  // Update the spaceship position based on destination
  private async updatePosition() {
    if (!this.destination || !this.isRunning) return;

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
    
    // Get current fuel level
    const currentFuel = await this.getCurrentFuel();
    
    // Calculate fuel consumption for this movement increment
    const fuelConsumed = moveDistance * FUEL_CONSUMPTION_RATE;
    
    // Check if we have enough fuel to move
    if (currentFuel <= 0) {
      // Already out of fuel, stop movement
      this.destination = null;
      await this.stopInterpolation();
      console.log(`🚀 INTERPOLATOR (${this.spaceshipId}): Movement stopped - no fuel`);
      return;
    }
    
    // Check if this movement will deplete fuel
    if (currentFuel - fuelConsumed <= 0) {
      // Set fuel to exactly zero
      await this.updateFuel(0);
      
      // Calculate how far we can go with remaining fuel
      const possibleDistance = currentFuel / FUEL_CONSUMPTION_RATE;
      const partialMoveFactor = possibleDistance / moveDistance;
      
      // Move partial distance with remaining fuel
      this.currentPosition = {
        x: this.currentPosition.x + direction.x * possibleDistance,
        y: this.currentPosition.y + direction.y * possibleDistance,
        z: this.currentPosition.z + direction.z * possibleDistance,
      };
      
      // Update position in Redis one last time
      await this.updateRedisPosition();
      
      // Notify of fuel depletion via Redis Stream
      if (this.redisStreams) {
        await this.redisStreams.publishEvent(this.spaceshipId, {
          type: 'fuel_depleted',
          position: [this.currentPosition.x, this.currentPosition.y, this.currentPosition.z],
          timestamp: Date.now()
        });
      }
      
      // Stop movement due to fuel depletion
      this.destination = null;
      await this.stopInterpolation();
      
      console.log(`🚀 INTERPOLATOR (${this.spaceshipId}): Fuel depleted during movement`);
      return;
    }
    
    // Deduct fuel used in this movement
    await this.updateFuel(Math.max(0, currentFuel - fuelConsumed));

    // Check if we've reached the destination
    if (distance <= ARRIVAL_THRESHOLD) {
      // We've arrived at the destination - make sure position is exactly the destination
      this.currentPosition = {
        x: this.destination.x,
        y: this.destination.y,
        z: this.destination.z
      };
      
      // Store destination temporarily before clearing it
      const arrivalPosition = {...this.currentPosition};
      
      // First stop interpolation to prevent further updates
      await this.stopInterpolation();
      
      // Clear the destination in memory
      const destinationForNotification = {...this.destination};
      this.destination = null;
      
      // Update Redis to reflect null destination
      await this.redis.hSet(this.getStateKey(), 'destination', '');
      
      // Then notify arrival with the correct position
      await this.notifyArrival(arrivalPosition);
    } else {
      // Move toward destination
      const movementThisFrame = Math.min(moveDistance, distance);
      this.currentPosition = {
        x: this.currentPosition.x + direction.x * movementThisFrame,
        y: this.currentPosition.y + direction.y * movementThisFrame,
        z: this.currentPosition.z + direction.z * movementThisFrame,
      };
      
      // Update position in Redis
      await this.updateRedisPosition();
    }
  }

  // Update the position in Redis and publish to stream
  private async updateRedisPosition() {
    const position = [
      this.currentPosition.x,
      this.currentPosition.y,
      this.currentPosition.z
    ];

    const velocity = this.destination ? this.calculateVelocity() : [0, 0, 0];
    const timestamp = Date.now();
    
    // Get current fuel level to include in the update
    const currentFuel = await this.getCurrentFuel();

    try {
      // Update state in Redis hash (keep this for state persistence)
      await this.redis.hSet(this.getStateKey(), {
        position: JSON.stringify(position),
        velocity: JSON.stringify(velocity),
        destination: this.destination ? JSON.stringify([
          this.destination.x,
          this.destination.y,
          this.destination.z
        ]) : '',
        timestamp: timestamp.toString(),
        isMoving: this.isRunning ? 'true' : 'false',
        fuel: currentFuel.toString()
      });

      // Also publish to Redis Stream for real-time updates
      if (this.redisStreams) {
        await this.redisStreams.publishPosition(this.spaceshipId, {
          position,
          velocity,
          destination: this.destination ? [
            this.destination.x,
            this.destination.y,
            this.destination.z
          ] : null,
          isMoving: this.isRunning,
          fuel: currentFuel
        });
      }
    } catch (error) {
      console.error(`Error updating Redis position for Sputnik ${this.spaceshipId}:`, error);
    }
  }

  // Notify the server that we've reached the destination
  private async notifyArrival(position: Vector3) {
    // Prevent duplicate notifications
    if (this.isNotifyingArrival) {
      console.log(`🚀 SERVER INTERPOLATOR (${this.spaceshipId}): Already notifying arrival, skipping duplicate`);
      return;
    }
    
    try {
      this.isNotifyingArrival = true;
      
      // Create a position array with defined values
      const positionArray = [
        position.x ?? 0,
        position.y ?? 0, 
        position.z ?? 0
      ];
      
      console.log(`🚀 SERVER INTERPOLATOR (${this.spaceshipId}): Notifying arrival at position:`, positionArray);
      
      // Get current fuel for inclusion in notification
      const currentFuel = await this.getCurrentFuel();

      // Publish arrival event to Redis Stream
      if (this.redisStreams) {
        await this.redisStreams.publishEvent(this.spaceshipId, {
          type: 'arrival',
          position: positionArray,
          fuel: currentFuel,
          timestamp: Date.now()
        });
      }
      
      // Ensure the arrival state is in Redis
      await this.updateState({
        position: positionArray,
        velocity: [0, 0, 0],
        destination: null,
        isMoving: false,
        fuel: currentFuel
      });
      
    } catch (error) {
      console.error(`Error notifying arrival for Sputnik ${this.spaceshipId}:`, error);
    } finally {
      // Reset the notification flag after a delay to prevent immediate re-triggering
      setTimeout(() => {
        this.isNotifyingArrival = false;
      }, 1000); // 1 second delay
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
      const positionStr = await this.redis.hGet(this.getStateKey(), 'position');
      if (!positionStr) return null;
      
      const position = JSON.parse(positionStr);
      return this.arrayToVector3(position);
    } catch (error) {
      console.error(`Error getting position from Redis for Sputnik ${this.spaceshipId}:`, error);
      return null;
    }
  }
  
  // Get the complete state from Redis
  async getState(): Promise<Record<string, any> | null> {
    try {
      const stateData = await this.redis.hGetAll(this.getStateKey());
      if (!Object.keys(stateData).length) return null;
      
      // Parse JSON strings back to objects/arrays
      const state: Record<string, any> = {};
      
      if (stateData.position) {
        try {
          state.position = JSON.parse(stateData.position);
          // Ensure position values are never null
          if (state.position) {
            state.position = state.position.map((val: number | null) => val ?? 0);
          } else {
            state.position = [0, 0, 0];
          }
        } catch (error) {
          state.position = [0, 0, 0];
        }
      } else {
        state.position = [0, 0, 0];
      }
      
      if (stateData.velocity) {
        try {
          state.velocity = JSON.parse(stateData.velocity);
          // Ensure velocity values are never null
          if (state.velocity) {
            state.velocity = state.velocity.map((val: number | null) => val ?? 0);
          } else {
            state.velocity = [0, 0, 0];
          }
        } catch (error) {
          state.velocity = [0, 0, 0];
        }
      } else {
        state.velocity = [0, 0, 0];
      }
      
      if (stateData.destination && stateData.destination !== '') {
        try {
          state.destination = JSON.parse(stateData.destination);
        } catch (error) {
          state.destination = null;
        }
      } else {
        state.destination = null;
      }
      
      // Get additional state fields if they exist
      if (stateData.fuel) {
        state.fuel = parseFloat(stateData.fuel);
      } else {
        state.fuel = 100; // Default fuel value
      }
      
      if (stateData.target_planet_id) {
        state.target_planet_id = stateData.target_planet_id;
      }
      
      // Parse isMoving state
      state.isMoving = stateData.isMoving === 'true';
      
      // Add Sputnik ID
      state.uuid = this.spaceshipId;
      
      return state;
    } catch (error) {
      console.error(`Error getting state from Redis for Sputnik ${this.spaceshipId}:`, error);
      return null;
    }
  }
  
  // Update specific state fields in Redis
  async updateState(updates: Record<string, any>): Promise<boolean> {
    try {
      const updateData: Record<string, string> = {};
      
      // Convert each field to appropriate Redis value
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'position' || key === 'velocity' || key === 'destination') {
          // These should be arrays, stringify them
          updateData[key] = JSON.stringify(value);
        } else if (typeof value === 'number') {
          // Store numbers as strings
          updateData[key] = value.toString();
        } else if (typeof value === 'string') {
          // Strings can be stored directly
          updateData[key] = value;
        } else if (value === null) {
          // For null values, we'll use empty string
          updateData[key] = '';
        } else {
          // For other objects/complex types, stringify
          updateData[key] = JSON.stringify(value);
        }
      }
      
      // Update timestamp
      updateData.timestamp = Date.now().toString();
      
      // Update in Redis
      await this.redis.hSet(this.getStateKey(), updateData);
      
      return true;
    } catch (error) {
      console.error(`Error updating state in Redis for Sputnik ${this.spaceshipId}:`, error);
      return false;
    }
  }
  
  // Set destination using Redis Stream instead of direct update
  async setDestination(destination: [number, number, number]): Promise<boolean> {
    try {
      if (!this.redisStreams) {
        this.redisStreams = await RedisStreams.getInstance();
      }
      
      // Publish move_to command to stream
      await this.redisStreams.publishCommand(this.spaceshipId, {
        type: 'move_to',
        destination,
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error(`Error setting destination via Redis Stream for Sputnik ${this.spaceshipId}:`, error);
      return false;
    }
  }

  // Get the Sputnik UUID
  getUuid(): string {
    return this.spaceshipId;
  }
}

// Keep a map of interpolator instances by UUID
const interpolatorInstances: Map<string, SpaceshipInterpolator> = new Map();

export async function getInterpolator(uuid?: string): Promise<SpaceshipInterpolator> {
  const sputnikUuid = uuid || getSputnikUuid();
  
  if (!interpolatorInstances.has(sputnikUuid)) {
    const interpolator = new SpaceshipInterpolator(sputnikUuid);
    await interpolator.initialize();
    interpolatorInstances.set(sputnikUuid, interpolator);
    console.log(`Created new interpolator instance for Sputnik ${sputnikUuid}`);
  }
  
  return interpolatorInstances.get(sputnikUuid)!;
}

// Helper function to get all active interpolators
export async function getAllInterpolators(): Promise<SpaceshipInterpolator[]> {
  return Array.from(interpolatorInstances.values());
}

// Clean up function to remove inactive interpolators
export async function cleanupInterpolator(uuid: string): Promise<boolean> {
  if (interpolatorInstances.has(uuid)) {
    const interpolator = interpolatorInstances.get(uuid)!;
    
    // Clean up any resources
    if (interpolator['commandCheckInterval']) {
      clearInterval(interpolator['commandCheckInterval']);
    }
    
    if (interpolator['intervalId']) {
      clearInterval(interpolator['intervalId']);
    }
    
    // Remove from map
    interpolatorInstances.delete(uuid);
    return true;
  }
  return false;
} 