import { NextRequest, NextResponse } from 'next/server';
import { loadMapConfig, saveMapConfig, MapConfig } from '@/app/components/game/planets/mapUtils';

// GET endpoint to retrieve map configuration
export async function GET() {
  try {
    const mapConfig = await loadMapConfig();
    
    if (!mapConfig) {
      return NextResponse.json({ error: 'No map configuration found' }, { status: 404 });
    }
    
    return NextResponse.json(mapConfig);
  } catch (error) {
    console.error('Error loading map configuration:', error);
    return NextResponse.json({ error: 'Failed to load map configuration' }, { status: 500 });
  }
}

// POST endpoint to save map configuration
export async function POST(request: NextRequest) {
  try {
    const mapConfig = await request.json() as MapConfig;
    
    if (!mapConfig || !mapConfig.planets || !Array.isArray(mapConfig.planets)) {
      return NextResponse.json({ error: 'Invalid map configuration' }, { status: 400 });
    }
    
    await saveMapConfig(mapConfig);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving map configuration:', error);
    return NextResponse.json({ error: 'Failed to save map configuration' }, { status: 500 });
  }
} 