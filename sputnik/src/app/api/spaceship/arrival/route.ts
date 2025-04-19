import { NextRequest, NextResponse } from 'next/server';
import { spaceshipState } from '@/lib/supabase';

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
    
    // Get current state to preserve required fields like rotation
    const currentState = await spaceshipState.getState();
    if (!currentState) {
      return NextResponse.json(
        { error: 'Failed to retrieve current spaceship state' }, 
        { status: 500 }
      );
    }
    
    // Update state in Supabase to mark arrival
    const response = await spaceshipState.updateState({
      id: data.id,
      position: data.position,
      destination: null,
      velocity: [0, 0, 0],
      rotation: currentState.rotation // Preserve the current rotation value
    });
    
    if (response.error) {
      return NextResponse.json(
        { error: 'Failed to update spaceship state', details: response.error?.message || 'Unknown error' }, 
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error processing arrival:', error);
    return NextResponse.json(
      { error: 'Failed to process arrival' }, 
      { status: 500 }
    );
  }
} 