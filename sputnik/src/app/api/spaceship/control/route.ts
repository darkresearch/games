import { NextRequest, NextResponse } from 'next/server';
import { getInterpolator } from '../interpolator';

// API key for authentication (should be in environment variables)
const API_KEY = process.env.SPACESHIP_CONTROL_API_KEY || '1234';

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
    
    // Get the interpolator to access Redis
    const interpolator = await getInterpolator();
    
    // Get current state from Redis
    const currentState = await interpolator.getState();
    if (!currentState) {
      return NextResponse.json(
        { error: 'Failed to retrieve current spaceship state from Redis' }, 
        { status: 500 }
      );
    }
    
    // Process the command and update state
    let success = false;
    const newState: Record<string, unknown> = {};
    
    switch (command.command) {
      case 'move_to':
        if (command.destination && 
            Array.isArray(command.destination) && 
            command.destination.length === 3) {
          
          // Check if the spaceship is already moving (has a destination set)
          if (currentState.destination) {
            return NextResponse.json(
              { 
                error: 'Spaceship is already moving to a destination. Wait until it arrives or issue a stop command.', 
                currentDestination: currentState.destination 
              }, 
              { status: 409 } // 409 Conflict status code
            );
          }
          
          // Check if the spaceship has fuel
          if (currentState.fuel <= 0) {
            return NextResponse.json(
              {
                error: 'Cannot move the spaceship. No fuel remaining.',
                fuelLevel: currentState.fuel
              },
              { status: 400 }
            );
          }
          
          // Store the destination coordinates
          newState.destination = command.destination;
          
          // Set zero velocity - interpolator will calculate actual velocity
          newState.velocity = [0, 0, 0];
          
          // Set the destination in Redis via interpolator
          try {
            const result = await interpolator.setDestination(command.destination);
            
            if (result) {
              console.log('🚀 CONTROL API: Interpolator received new destination');
              success = true;
            } else {
              console.error('Failed to set destination in interpolator');
            }
          } catch (error) {
            console.error('Failed to notify interpolator:', error);
            return NextResponse.json(
              { error: 'Failed to set destination' }, 
              { status: 500 }
            );
          }
        }
        break;
        
      default:
        return NextResponse.json(
          { error: 'Unknown command. Available commands: move_to' }, 
          { status: 400 }
        );
    }
    
    if (!success) {
      return NextResponse.json(
        { error: 'Invalid command parameters' }, 
        { status: 400 }
      );
    }
    
    // Return success response with the command result
    return NextResponse.json({
      success: true,
      state: {
        position: currentState.position,
        velocity: currentState.velocity,
        rotation: currentState.rotation,
        fuel: currentState.fuel,
        destination: command.destination,
        targetPlanet: currentState.target_planet_id
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