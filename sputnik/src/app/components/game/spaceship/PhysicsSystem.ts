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
  
  // Maximum speed in units per second
  maxSpeed: number;
  
  // Drag coefficient (simulates space resistance, very low in space)
  drag: number;
  
  constructor(
    initialPosition: Vector3 = { x: 0, y: 0, z: 0 },
    initialVelocity: Vector3 = { x: 0, y: 0, z: 0 },
    maxSpeed: number = 2000
  ) {
    this.position = { ...initialPosition };
    this.velocity = { ...initialVelocity };
    this.acceleration = { x: 0, y: 0, z: 0 };
    this.maxSpeed = maxSpeed;
    this.drag = 0.01; // Very low drag in space
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
    this.position = { ...position };
  }
  
  // Set velocity directly
  setVelocity(velocity: Vector3) {
    this.velocity = { ...velocity };
  }
  
  // Reset all motion
  stop() {
    this.velocity = { x: 0, y: 0, z: 0 };
    this.acceleration = { x: 0, y: 0, z: 0 };
  }
} 