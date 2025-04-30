import { NextRequest, NextResponse } from 'next/server';
import { getInterpolator } from '../interpolator';
import { getSputnikUuid } from '@/lib/redis-streams';

// API key for authentication (should be in environment variables)
const API_KEY = process.env.SPACESHIP_CONTROL_API_KEY || '1234';

// GET endpoint to retrieve spaceship status
export async function GET(request: NextRequest) {
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
    
    // Extract UUID from query parameters if provided
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get('uuid') || getSputnikUuid();
    
    // Get the interpolator for the specific sputnik
    const interpolator = await getInterpolator(uuid);
    
    // Get current state from Redis
    const currentState = await interpolator.getState();
    if (!currentState) {
      return NextResponse.json(
        { error: `Failed to retrieve state for Sputnik ${uuid} from Redis` }, 
        { status: 500 }
      );
    }
    
    // Determine if spaceship is moving based on whether destination is set
    const isMoving = currentState.destination !== undefined && currentState.destination !== null;
    
    // Return the status response
    return NextResponse.json({
      success: true,
      uuid: uuid,
      state: {
        position: currentState.position,
        velocity: currentState.velocity,
        rotation: currentState.rotation || [0, 0, 0],
        fuel: currentState.fuel,
        isMoving: isMoving,
        destination: currentState.destination || null,
        targetPlanet: currentState.target_planet_id
      }
    });
  } catch (error) {
    console.error('Error retrieving spaceship status:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve spaceship status' }, 
      { status: 500 }
    );
  }
} 