import React, { useEffect, useState } from 'react';
import { SpaceshipStatus, TARGET_PLANET_ID } from '../spaceship/api';
import { spaceshipState, SpaceshipStateData } from '@/lib/supabase';

type SpaceshipPanelProps = {
  status?: SpaceshipStatus | null;
};

// Helper function to convert array position to object with x,y,z properties
const toPositionObject = (pos: [number, number, number] | undefined) => {
  if (!pos) return { x: 'N/A', y: 'N/A', z: 'N/A' };
  return { x: pos[0], y: pos[1], z: pos[2] };
};

export default function SpaceshipPanel({ status: propStatus }: SpaceshipPanelProps) {
  const [supabaseState, setSupabaseState] = useState<SpaceshipStateData | null>(null);
  
  // Subscribe to Supabase state updates
  useEffect(() => {
    let isMounted = true;
    
    // Get initial state
    const loadInitialState = async () => {
      if (!isMounted) return;
      
      try {
        const state = await spaceshipState.getState();
        if (state && isMounted) {
          setSupabaseState(state);
        }
      } catch (error) {
        console.error('Error loading initial spaceship state:', error);
      }
    };
    
    loadInitialState();
    
    // Subscribe to state changes
    const subscription = spaceshipState.subscribeToState((state) => {
      if (isMounted) {
        setSupabaseState(state);
      }
    });
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  // Handle different position formats between Supabase and API
  const position = propStatus?.position || 
    (supabaseState?.position ? toPositionObject(supabaseState.position) : { x: 'N/A', y: 'N/A', z: 'N/A' });
  
  const velocity = propStatus?.velocity || 
    (supabaseState?.velocity ? toPositionObject(supabaseState.velocity) : { x: 'N/A', y: 'N/A', z: 'N/A' });
  
  // Calculate speed from velocity
  const speed = velocity.x !== 'N/A'
    ? Math.sqrt(
        Number(velocity.x) * Number(velocity.x) + 
        Number(velocity.y) * Number(velocity.y) + 
        Number(velocity.z) * Number(velocity.z)
      ).toFixed(1)
    : 'N/A';
  
  // Get fuel value
  const fuel = propStatus?.fuel !== undefined 
    ? `${Math.round(propStatus.fuel)}%` 
    : supabaseState?.fuel !== undefined 
      ? `${Math.round(supabaseState.fuel)}%` 
      : 'N/A';
  
  // Fuel percentage for bar display
  const fuelPercentage = propStatus?.fuel ?? supabaseState?.fuel ?? 0;

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      color: 'white',
      background: '#131313',
      backdropFilter: 'blur(10px)',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      boxShadow: '0 0 20px rgba(0,0,0,0.5), 0 0 5px rgba(66, 153, 225, 0.3)',
      border: '1px solid rgba(250, 250, 250, 0.2)',
      width: '280px',
      letterSpacing: '0.3px',
      lineHeight: '1.5',
      padding: '16px',
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold', color: '#63B3ED' }}>
        AI Spaceship Status
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <p style={{ margin: '0', fontSize: '14px', color: '#fafafa' }}>
            <span style={{ color: '#63B3ED' }}>Position:</span>
          </p>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#fafafa' }}>
            X: {typeof position.x === 'number' ? position.x.toFixed(1) : position.x}<br />
            Y: {typeof position.y === 'number' ? position.y.toFixed(1) : position.y}<br />
            Z: {typeof position.z === 'number' ? position.z.toFixed(1) : position.z}
          </p>
          
          <p style={{ margin: '0', fontSize: '14px', color: '#fafafa' }}>
            <span style={{ color: '#63B3ED' }}>Speed:</span> {speed} units/s
          </p>
        </div>
        
        <div>
          <p style={{ margin: '0', fontSize: '14px', color: '#fafafa' }}>
            <span style={{ color: '#63B3ED' }}>Fuel:</span> {fuel}
          </p>
          
          {/* Fuel bar */}
          <div style={{ 
            width: '100%', 
            height: '10px', 
            background: '#333', 
            borderRadius: '5px',
            overflow: 'hidden',
            margin: '4px 0 8px 0'
          }}>
            <div style={{ 
              width: `${fuelPercentage}%`, 
              height: '100%', 
              background: fuelPercentage > 25 ? '#63B3ED' : '#ED6363',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>
      
      <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#fafafa' }}>
        <span style={{ color: '#63B3ED' }}>Target:</span> Planet {TARGET_PLANET_ID}
      </p>
    </div>
  );
} 