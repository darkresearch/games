import { NextRequest, NextResponse } from 'next/server';
import { spaceshipState } from '@/lib/supabase';
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
    
    // Get current state from Supabase
    const currentState = await spaceshipState.getState();
    if (!currentState) {
      return NextResponse.json(
        { error: 'Failed to retrieve current spaceship state' }, 
        { status: 500 }
      );
    }
    
    // Process the command and update Supabase state
    const newState: Record<string, unknown> = {};
    let success = false;
    
    switch (command.command) {
      case 'move_to':
        if (command.destination && 
            Array.isArray(command.destination) && 
            command.destination.length === 3) {
          
          // Store the destination coordinates
          newState.destination = command.destination;
          
          // Set velocity to zero - server-side interpolator will handle movement
          newState.velocity = [0, 0, 0];
          
          // Decrease fuel slightly
          // TODO: Make this dynamic based on distance to destination
          newState.fuel = Math.max(0, currentState.fuel - 0.5);
          success = true;
          
          // Get the interpolator and server updates will take it from here
          try {
            await getInterpolator();
            console.log('🚀 CONTROL API: Interpolator notified of new destination');
          } catch (error) {
            console.error('Failed to notify interpolator:', error);
            // Continue anyway, it will pick up the destination from Supabase
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
    
    // Ensure all required fields are present by preserving existing values if not explicitly changed
    const completeState: Record<string, unknown> = {
      // Start with current values as defaults
      id: currentState.id,
      position: currentState.position,
      velocity: currentState.velocity,
      rotation: currentState.rotation,
      fuel: currentState.fuel,
      target_planet_id: currentState.target_planet_id,
      
      // Then override with any new values
      ...newState
    };
    
    console.log('Updating spaceship state with:', completeState);
    
    // Update state in Supabase
    const response = await spaceshipState.updateState(completeState);
    
    if (response.error) {
      return NextResponse.json(
        { error: 'Failed to update spaceship state', details: response.error?.message || 'Unknown error' }, 
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
        destination: updatedState.destination,
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