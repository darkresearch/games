import { createClient } from 'redis';
import { REFUELING_RADIUS_MULTIPLIER, BASE_REFUELING_RATE, DEFAULT_MAX_FUEL } from '@/lib/constants';
import { type PlanetConfig } from '@/app/components/game/planets/mapUtils';

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
  private spaceshipId: string = 'sputnik-1'; // Default ID
  private isRefueling = false;
  private planets: PlanetConfig[] = [];

  constructor() {
    // Initialize Redis client
    this.redis = createClient({ url: process.env.REDIS_URL });
  }

  async initialize() {
    // Connect to Redis if not already connected
    if (!this.redis.isOpen) {
      await this.redis.connect();
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
      console.log('🚀 SERVER INTERPOLATOR: Initializing default state in Redis');
      await this.updateState({
        position: [0, 0, 0],
        velocity: [0, 0, 0],
        fuel: 100,
        isRefueling: false
      });
    }

    // Load planets data for refueling
    await this.loadPlanets();

    // Update Redis with current position
    await this.updateRedisPosition();
    
    // Listen for destination changes through Redis
    await this.setupRedisListener();
  }

  // Load planets data from Redis for refueling checks
  private async loadPlanets() {
    try {
      const planetsData = await this.redis.get('planets');
      if (planetsData) {
        this.planets = JSON.parse(planetsData);
        console.log(`Loaded ${this.planets.length} planets for refueling checks`);
      } else {
        console.log('No planets data found in Redis');
      }
    } catch (error) {
      console.error('Error loading planets data:', error);
    }
  }

  // Set up Redis subscriber to listen for commands
  private async setupRedisListener() {
    try {
      // Subscribe to a command channel
      const subscriber = this.redis.duplicate();
      await subscriber.connect();
      
      // Listen for move commands on a dedicated channel
      await subscriber.subscribe('sputnik:commands', (message) => {
        try {
          const command = JSON.parse(message);
          
          if (command.type === 'move_to' && Array.isArray(command.destination)) {
            // Handle move_to command
            this.destination = {
              x: command.destination[0],
              y: command.destination[1],
              z: command.destination[2]
            };
            
            // Start interpolation if not already running
            this.startInterpolation();
            console.log('Received move_to command via Redis:', command.destination);
          } else if (command.type === 'stop') {
            // Handle stop command
            this.destination = null;
            this.stopInterpolation();
            console.log('Received stop command via Redis');
          }
        } catch (error) {
          console.error('Error processing Redis command:', error);
        }
      });
      
      console.log('Redis command listener initialized');
    } catch (error) {
      console.error('Failed to set up Redis listener:', error);
    }
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

  // Get current fuel level
  private async getCurrentFuel(): Promise<number> {
    try {
      const fuelStr = await this.redis.hGet('sputnik:state', 'fuel');
      return fuelStr ? parseFloat(fuelStr) : 100; // Default to 100 if not found
    } catch (error) {
      console.error('Error getting fuel level:', error);
      return 100; // Default value on error
    }
  }

  // Update fuel level
  private async updateFuel(newFuel: number): Promise<void> {
    try {
      await this.redis.hSet('sputnik:state', 'fuel', newFuel.toString());
    } catch (error) {
      console.error('Error updating fuel level:', error);
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
    
    // Get current fuel level
    const currentFuel = await this.getCurrentFuel();
    
    // Calculate fuel consumption for this movement increment
    const fuelConsumed = moveDistance * FUEL_CONSUMPTION_RATE;
    
    // Check if we have enough fuel to move
    if (currentFuel <= 0) {
      // Already out of fuel, stop movement
      this.destination = null;
      this.stopInterpolation();
      console.log('🚀 INTERPOLATOR: Movement stopped - no fuel');
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
      
      // Stop movement due to fuel depletion
      this.destination = null;
      this.stopInterpolation();
      
      // Notify of fuel depletion
      await this.redis.publish('sputnik:events', JSON.stringify({
        type: 'fuel_depleted',
        position: [this.currentPosition.x, this.currentPosition.y, this.currentPosition.z],
        timestamp: Date.now()
      }));
      
      // Update position in Redis one last time
      await this.updateRedisPosition();
      console.log('🚀 INTERPOLATOR: Fuel depleted during movement');
      return;
    }
    
    // Deduct fuel used in this movement (unless refueling)
    if (!this.isRefueling) {
      await this.updateFuel(Math.max(0, currentFuel - fuelConsumed));
    }

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

    // Check if we're near a planet for refueling
    await this.checkRefuelingStatus(deltaTime);

    // Update position in Redis
    await this.updateRedisPosition();
  }

  // Check if the ship is near any planet for refueling
  private async checkRefuelingStatus(deltaTime: number) {
    // Skip if no planets data
    if (!this.planets || this.planets.length === 0) return;
    
    // Flag to track if we're near any planet
    let isNearAnyPlanet = false;
    
    // Get current fuel
    const currentFuel = await this.getCurrentFuel();
    
    // Exit early if fuel is already at maximum
    if (currentFuel >= DEFAULT_MAX_FUEL) {
      if (this.isRefueling) {
        // If we were refueling but are now full, stop refueling
        this.isRefueling = false;
        await this.updateState({ isRefueling: false });
        
        // Emit refueling stopped event
        await this.redis.publish('sputnik:events', JSON.stringify({
          type: 'refueling_stop',
          reason: 'fuel_full',
          position: [this.currentPosition.x, this.currentPosition.y, this.currentPosition.z],
          timestamp: Date.now()
        }));
      }
      return;
    }
    
    // Check each planet
    for (const planet of this.planets) {
      // Calculate planet position as Vector3
      const planetPos = {
        x: planet.position[0],
        y: planet.position[1],
        z: planet.position[2]
      };
      
      // Calculate distance to planet
      const distance = this.calculateDistance(this.currentPosition, planetPos);
      
      // Calculate refueling radius based on planet size
      const refuelingRadius = planet.size * REFUELING_RADIUS_MULTIPLIER;
      
      // If ship is within refueling radius of this planet
      if (distance <= refuelingRadius) {
        isNearAnyPlanet = true;
        
        // Calculate refueling rate based on planet size
        const refuelingRate = planet.size * BASE_REFUELING_RATE;
        
        // Calculate how much fuel to add this frame
        const fuelToAdd = refuelingRate * deltaTime;
        
        // Add fuel
        const newFuel = Math.min(DEFAULT_MAX_FUEL, currentFuel + fuelToAdd);
        await this.updateFuel(newFuel);
        
        // If we weren't refueling before, emit refueling started event
        if (!this.isRefueling) {
          this.isRefueling = true;
          await this.updateState({ isRefueling: true });
          
          // Emit refueling started event
          await this.redis.publish('sputnik:events', JSON.stringify({
            type: 'refueling_start',
            planetId: planet.id,
            planetType: planet.type,
            position: [this.currentPosition.x, this.currentPosition.y, this.currentPosition.z],
            timestamp: Date.now()
          }));
          
          console.log(`🚀 INTERPOLATOR: Started refueling at planet ${planet.id}`);
        }
        
        // Break after first refueling planet is found
        break;
      }
    }
    
    // If we were refueling but are now not near any planet, stop refueling
    if (this.isRefueling && !isNearAnyPlanet) {
      this.isRefueling = false;
      await this.updateState({ isRefueling: false });
      
      // Emit refueling stopped event
      await this.redis.publish('sputnik:events', JSON.stringify({
        type: 'refueling_stop',
        reason: 'out_of_range',
        position: [this.currentPosition.x, this.currentPosition.y, this.currentPosition.z],
        timestamp: Date.now()
      }));
      
      console.log('🚀 INTERPOLATOR: Stopped refueling - moved out of range');
    }
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
        isRefueling: this.isRefueling.toString(),
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

      // Also publish arrival event to Redis
      await this.redis.publish('sputnik:events', JSON.stringify({
        type: 'arrival',
        position: [this.currentPosition.x, this.currentPosition.y, this.currentPosition.z],
        timestamp: Date.now()
      }));
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
  
  // Get the complete state from Redis
  async getState(): Promise<Record<string, any> | null> {
    try {
      const stateData = await this.redis.hGetAll('sputnik:state');
      if (!Object.keys(stateData).length) return null;
      
      // Parse JSON strings back to objects/arrays
      const state: Record<string, any> = {};
      
      if (stateData.position) {
        state.position = JSON.parse(stateData.position);
      }
      
      if (stateData.velocity) {
        state.velocity = JSON.parse(stateData.velocity);
      }
      
      if (stateData.destination && stateData.destination !== '') {
        state.destination = JSON.parse(stateData.destination);
      }
      
      // Get additional state fields if they exist
      if (stateData.fuel) {
        state.fuel = parseFloat(stateData.fuel);
      } else {
        state.fuel = 100; // Default fuel value
      }
      
      if (stateData.isRefueling) {
        state.isRefueling = stateData.isRefueling === 'true';
      }
      
      if (stateData.target_planet_id) {
        state.target_planet_id = stateData.target_planet_id;
      }
      
      return state;
    } catch (error) {
      console.error('Error getting state from Redis:', error);
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
      await this.redis.hSet('sputnik:state', updateData);
      
      return true;
    } catch (error) {
      console.error('Error updating state in Redis:', error);
      return false;
    }
  }
  
  // Set destination directly through API (allowing the control API to trigger movement)
  async setDestination(destination: [number, number, number]): Promise<boolean> {
    try {
      this.destination = {
        x: destination[0],
        y: destination[1],
        z: destination[2]
      };
      this.startInterpolation();
      
      // Also publish this command to Redis for any other listeners
      await this.redis.publish('sputnik:commands', JSON.stringify({
        type: 'move_to',
        destination
      }));
      
      return true;
    } catch (error) {
      console.error('Error setting destination:', error);
      return false;
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