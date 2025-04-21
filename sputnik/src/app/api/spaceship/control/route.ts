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
    
    // Get current state from Supabase (just for reference, not for real-time)
    const currentState = await spaceshipState.getState();
    if (!currentState) {
      return NextResponse.json(
        { error: 'Failed to retrieve current spaceship state' }, 
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
          
          // Store the destination coordinates in Supabase for persistence
          newState.destination = command.destination;
          
          // Set zero velocity - interpolator will calculate actual velocity
          newState.velocity = [0, 0, 0];
          
          // Decrease fuel slightly
          newState.fuel = Math.max(0, currentState.fuel - 0.5);
          
          // Get the interpolator to start movement using Redis
          try {
            const interpolator = await getInterpolator();
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
    
    // Update Supabase (just for persistence)
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
    
    console.log('Updating Supabase state (persistence only):', completeState);
    
    // Update state in Supabase
    const response = await spaceshipState.updateState(completeState);
    
    if (response.error) {
      console.error('Failed to update Supabase state:', response.error);
      // Continue anyway since Redis is our source of truth now
    }
    
    // Return success response with the command result
    return NextResponse.json({
      success: true,
      state: {
        position: currentState.position,
        velocity: currentState.velocity,
        rotation: currentState.rotation,
        fuel: newState.fuel || currentState.fuel,
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