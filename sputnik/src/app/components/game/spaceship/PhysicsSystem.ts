// Physics system for the spaceship
// Handles acceleration, velocity, and position updates with realistic momentum

export type Vector3 = {
  x: number;
  y: number;
  z: number;
};

export class PhysicsSystem {
  // Current position
  position: Vector3;
  
  // Current velocity (units per second)
  velocity: Vector3;
  
  // Current acceleration (units per second squared)
  acceleration: Vector3;
  
  // Target position for interpolation
  targetPosition: Vector3;
  
  // Target velocity for interpolation
  targetVelocity: Vector3;
  
  // Timestamp of the last server update
  lastUpdateTimestamp: number;
  
  // Interpolation speed factor (1.0 = instant, 0.1 = slow)
  interpolationFactor: number;
  
  // Maximum interpolation time in milliseconds
  maxInterpolationTime: number;
  
  // Maximum speed in units per second
  maxSpeed: number;
  
  // Drag coefficient (simulates space resistance, very low in space)
  drag: number;
  
  constructor(
    initialPosition: Vector3 = { x: 0, y: 0, z: 0 },
    initialVelocity: Vector3 = { x: 0, y: 0, z: 0 },
    maxSpeed: number = 2000,
    interpolationFactor: number = 0.1
  ) {
    this.position = { ...initialPosition };
    this.velocity = { ...initialVelocity };
    this.acceleration = { x: 0, y: 0, z: 0 };
    this.targetPosition = { ...initialPosition };
    this.targetVelocity = { ...initialVelocity };
    this.lastUpdateTimestamp = Date.now();
    this.maxSpeed = maxSpeed;
    this.drag = 0.01; // Very low drag in space
    this.interpolationFactor = interpolationFactor;
    this.maxInterpolationTime = 1000; // Maximum 1 second of interpolation
  }
  
  // Apply a force to change acceleration (in the given direction)
  applyForce(direction: Vector3, magnitude: number) {
    this.acceleration.x += direction.x * magnitude;
    this.acceleration.y += direction.y * magnitude;
    this.acceleration.z += direction.z * magnitude;
  }
  
  // Apply a thrust in the forward direction
  applyThrust(magnitude: number, direction: Vector3) {
    this.applyForce(direction, magnitude);
  }
  
  // Update the physics simulation by the given time step (in seconds)
  update(deltaTime: number) {
    // Interpolate position and velocity toward target values
    this.interpolateToTargets(deltaTime);
    
    // Update velocity based on acceleration
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    this.velocity.z += this.acceleration.z * deltaTime;
    
    // Apply drag (subtle slowdown over time)
    this.velocity.x *= (1 - this.drag * deltaTime);
    this.velocity.y *= (1 - this.drag * deltaTime);
    this.velocity.z *= (1 - this.drag * deltaTime);
    
    // Limit to max speed
    const speed = Math.sqrt(
      this.velocity.x * this.velocity.x + 
      this.velocity.y * this.velocity.y + 
      this.velocity.z * this.velocity.z
    );
    
    if (speed > this.maxSpeed) {
      const ratio = this.maxSpeed / speed;
      this.velocity.x *= ratio;
      this.velocity.y *= ratio;
      this.velocity.z *= ratio;
    }
    
    // Update position based on velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    // Reset acceleration (forces only apply for one frame)
    this.acceleration.x = 0;
    this.acceleration.y = 0;
    this.acceleration.z = 0;
  }
  
  // Interpolate current position and velocity toward target values
  private interpolateToTargets(deltaTime: number) {
    // Check if we're beyond the max interpolation time
    const now = Date.now();
    const timeSinceUpdate = now - this.lastUpdateTimestamp;
    
    if (timeSinceUpdate > this.maxInterpolationTime) {
      // If we're past the max time, just snap to the target
      this.position = { ...this.targetPosition };
      this.velocity = { ...this.targetVelocity };
      return;
    }
    
    // Calculate interpolation amount for this frame
    // Higher values = faster interpolation
    const lerpAmount = Math.min(1.0, this.interpolationFactor * deltaTime * 10);
    
    // Interpolate position
    this.position.x += (this.targetPosition.x - this.position.x) * lerpAmount;
    this.position.y += (this.targetPosition.y - this.position.y) * lerpAmount;
    this.position.z += (this.targetPosition.z - this.position.z) * lerpAmount;
    
    // Interpolate velocity
    this.velocity.x += (this.targetVelocity.x - this.velocity.x) * lerpAmount;
    this.velocity.y += (this.targetVelocity.y - this.velocity.y) * lerpAmount;
    this.velocity.z += (this.targetVelocity.z - this.velocity.z) * lerpAmount;
  }
  
  // Get the current speed
  getCurrentSpeed(): number {
    return Math.sqrt(
      this.velocity.x * this.velocity.x + 
      this.velocity.y * this.velocity.y + 
      this.velocity.z * this.velocity.z
    );
  }
  
  // Set position directly (useful for teleporting or initialization)
  setPosition(position: Vector3) {
    this.targetPosition = { ...position };
    this.lastUpdateTimestamp = Date.now();
    
    // For large changes (e.g. initial positioning), set immediately
    const distance = Math.sqrt(
      Math.pow(position.x - this.position.x, 2) +
      Math.pow(position.y - this.position.y, 2) +
      Math.pow(position.z - this.position.z, 2)
    );
    
    // If we're far from the target (>100 units) or this is first update, snap directly
    if (distance > 100 || this.position.x === 0 && this.position.y === 0 && this.position.z === 0) {
      this.position = { ...position };
    }
  }
  
  // Set velocity directly
  setVelocity(velocity: Vector3) {
    this.targetVelocity = { ...velocity };
    
    // For initial velocity or stopped state, set immediately
    const currentSpeed = this.getCurrentSpeed();
    const targetSpeed = Math.sqrt(
      velocity.x * velocity.x +
      velocity.y * velocity.y +
      velocity.z * velocity.z
    );
    
    // If we're stopped or just starting, update immediately
    if (currentSpeed < 0.1 || targetSpeed < 0.1) {
      this.velocity = { ...velocity };
    }
  }
  
  // Reset all motion
  stop() {
    this.velocity = { x: 0, y: 0, z: 0 };
    this.targetVelocity = { x: 0, y: 0, z: 0 };
    this.acceleration = { x: 0, y: 0, z: 0 };
  }
} 