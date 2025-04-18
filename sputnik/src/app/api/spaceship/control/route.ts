import { NextRequest, NextResponse } from 'next/server';
import { spaceshipState } from '@/lib/supabase';

// API key for authentication (should be in environment variables)
const API_KEY = process.env.SPACESHIP_CONTROL_API_KEY || 'dev-api-key';

// POST endpoint to receive control commands
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authHeader = request.headers.get('authorization');
    const providedApiKey = authHeader?.replace('Bearer ', '');
    
    if (!providedApiKey || providedApiKey !== API_KEY) {
      console.error('Authentication failed: Invalid API key');
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    // Parse the command from the request
    const command = await request.json();
    
    if (!command || !command.command) {
      return NextResponse.json(
        { error: 'Invalid command format' }, 
        { status: 400 }
      );
    }
    
    // Get current state from Supabase
    const currentState = await spaceshipState.getState();
    if (!currentState) {
      return NextResponse.json(
        { error: 'Failed to retrieve current spaceship state' }, 
        { status: 500 }
      );
    }
    
    // Process the command and update Supabase state
    let newState: any = {};
    let success = false;
    
    switch (command.command) {
      case 'move':
        if (command.direction && command.magnitude) {
          // Update velocity based on direction and magnitude
          newState.velocity = [
            command.direction.x * command.magnitude,
            command.direction.y * command.magnitude,
            command.direction.z * command.magnitude
          ];
          
          // Update position based on velocity (simplified physics)
          newState.position = [
            currentState.position[0] + newState.velocity[0] * 0.1,
            currentState.position[1] + newState.velocity[1] * 0.1,
            currentState.position[2] + newState.velocity[2] * 0.1
          ];
          // Decrease fuel slightly
          newState.fuel = Math.max(0, currentState.fuel - 0.5);
          success = true;
        } else if (command.target && command.speed) {
          // Calculate direction to target
          const direction = {
            x: command.target[0] - currentState.position[0],
            y: command.target[1] - currentState.position[1],
            z: command.target[2] - currentState.position[2]
          };
          
          // Normalize direction
          const magnitude = Math.sqrt(
            direction.x * direction.x + 
            direction.y * direction.y + 
            direction.z * direction.z
          );
          
          if (magnitude > 0) {
            const normalizedDirection = {
              x: direction.x / magnitude,
              y: direction.y / magnitude,
              z: direction.z / magnitude
            };
            
            // Set velocity based on direction and desired speed
            newState.velocity = [
              normalizedDirection.x * command.speed,
              normalizedDirection.y * command.speed,
              normalizedDirection.z * command.speed
            ];
            
            // Decrease fuel slightly
            newState.fuel = Math.max(0, currentState.fuel - 0.5);
            success = true;
          }
        }
        break;
        
      case 'stop':
        // Stop the spaceship
        newState.velocity = [0, 0, 0];
        success = true;
        break;
        
      case 'set_target':
        // Set target planet
        if (command.target_planet_id !== undefined) {
          newState.target_planet_id = command.target_planet_id;
          success = true;
        }
        break;
        
      case 'set_state':
        // Directly set state (useful for the Python AI to update position, fuel, etc.)
        // Only allow specific fields to be updated for security
        const allowedFields = ['position', 'velocity', 'rotation', 'fuel', 'target_planet_id'];
        
        for (const field of allowedFields) {
          if (command[field] !== undefined) {
            newState[field] = command[field];
          }
        }
        
        success = Object.keys(newState).length > 0;
        break;
        
      default:
        return NextResponse.json(
          { error: 'Unknown command' }, 
          { status: 400 }
        );
    }
    
    if (!success) {
      return NextResponse.json(
        { error: 'Invalid command parameters' }, 
        { status: 400 }
      );
    }
    
    // Update state in Supabase
    const response = await spaceshipState.updateState(newState);
    
    if (response.error) {
      return NextResponse.json(
        { error: 'Failed to update spaceship state', details: response.error.message }, 
        { status: 500 }
      );
    }
    
    // Get the updated state after the change
    const updatedState = await spaceshipState.getState();
    
    if (!updatedState) {
      return NextResponse.json(
        { error: 'Failed to retrieve updated spaceship state' }, 
        { status: 500 }
      );
    }
    
    // Return success response with updated state
    return NextResponse.json({
      success: true,
      state: {
        position: updatedState.position,
        velocity: updatedState.velocity,
        rotation: updatedState.rotation,
        fuel: updatedState.fuel,
        targetPlanet: updatedState.target_planet_id
      }
    });
  } catch (error) {
    console.error('Error processing spaceship command:', error);
    return NextResponse.json(
      { error: 'Failed to process command' }, 
      { status: 500 }
    );
  }
} 