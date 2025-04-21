import { NextRequest, NextResponse } from 'next/server';
import { getInterpolator } from '../interpolator';

// API endpoint for when the spaceship arrives at destination
export async function POST(request: NextRequest) {
  try {
    // Parse the request
    const data = await request.json();
    
    if (!data || !data.position || !data.id) {
      return NextResponse.json(
        { error: 'Invalid request format' }, 
        { status: 400 }
      );
    }
    
    // Get the interpolator which manages the state in Redis
    const interpolator = await getInterpolator();
    
    // Update state to indicate arrival (just save the position)
    await interpolator.updateState({
      position: data.position || [0, 0, 0],
      destination: null, // Clear destination since we've arrived
      velocity: [0, 0, 0]  // Stop the ship
    });
    
    // Return success response
    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error handling arrival event:', error);
    return NextResponse.json(
      { error: 'Failed to process arrival' }, 
      { status: 500 }
    );
  }
} 