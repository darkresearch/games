import React, { useEffect, useState, useRef } from 'react';
import { SpaceshipStatus, TARGET_PLANET_ID } from '../spaceship/api';
import { spaceshipState, SpaceshipStateData } from '@/lib/supabase';

type SpaceshipPanelProps = {
  status?: SpaceshipStatus | null;
  onFollowSpaceship?: () => void;
  isFollowing?: boolean;
  currentPosition?: { x: number, y: number, z: number } | null;
};

// Helper function to convert array position to object with x,y,z properties
const toPositionObject = (pos: [number, number, number] | undefined) => {
  if (!pos) return { x: 'N/A', y: 'N/A', z: 'N/A' };
  return { x: pos[0], y: pos[1], z: pos[2] };
};

export default function SpaceshipPanel({ 
  status: propStatus,
  onFollowSpaceship,
  isFollowing = false,
  currentPosition = null
}: SpaceshipPanelProps) {
  const [supabaseState, setSupabaseState] = useState<SpaceshipStateData | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const prevPositionRef = useRef<{ x: number | string, y: number | string, z: number | string } | null>(null);
  
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
          // Check if there's a destination set initially
          if (state.destination) {
            setIsMoving(true);
          }
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
        // Update moving state based on whether there's a destination
        setIsMoving(!!state.destination);
      }
    });
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  // Use current position from props if available, otherwise use database values
  const position = currentPosition || propStatus?.position || 
    (supabaseState?.position ? toPositionObject(supabaseState.position) : { x: 'N/A', y: 'N/A', z: 'N/A' });
  
  const velocity = propStatus?.velocity || 
    (supabaseState?.velocity ? toPositionObject(supabaseState.velocity) : { x: 'N/A', y: 'N/A', z: 'N/A' });
  
  // Create stable references for dependencies
  const hasDestination = supabaseState?.destination !== null && 
                        supabaseState?.destination !== undefined;
  
  // Check if velocity is non-zero (meaning Sputnik is actually moving)
  const isActuallyMoving = 
    typeof velocity.x === 'number' && 
    typeof velocity.y === 'number' && 
    typeof velocity.z === 'number' && 
    (Math.abs(velocity.x) > 0.01 || Math.abs(velocity.y) > 0.01 || Math.abs(velocity.z) > 0.01);
  
  // Combined effect for movement detection
  useEffect(() => {
    // Only pulse if:
    // 1. Sputnik has a destination AND it's actually moving, OR
    // 2. Position has changed significantly (for client-side movement detection)
    
    // Position change detection
    if (!prevPositionRef.current) {
      prevPositionRef.current = { ...position };
      return;
    }
    
    const isPositionChanged = 
      position.x !== prevPositionRef.current.x ||
      position.y !== prevPositionRef.current.y ||
      position.z !== prevPositionRef.current.z;
    
    // Update the movement state based on actual velocity or position changes
    if (isActuallyMoving || (isPositionChanged && hasDestination)) {
      setIsMoving(true);
    } else {
      setIsMoving(false);
    }
    
    // Store new position
    prevPositionRef.current = { ...position };
  }, [position, hasDestination, isActuallyMoving]);
  
  // Calculate speed from velocity
  const speed = velocity.x !== 'N/A'
    ? Math.sqrt(
        Number(velocity.x) * Number(velocity.x) + 
        Number(velocity.y) * Number(velocity.y) + 
        Number(velocity.z) * Number(velocity.z)
      ).toFixed(1)
    : (currentPosition ? '3.0' : '0.0'); // Use default speed if we have current position but no velocity
  
  // Get fuel value
  const fuel = propStatus?.fuel !== undefined 
    ? `${Math.round(propStatus.fuel)}%` 
    : supabaseState?.fuel !== undefined 
      ? `${Math.round(supabaseState.fuel)}%` 
      : 'N/A';
  
  // Fuel percentage for bar display
  const fuelPercentage = propStatus?.fuel ?? supabaseState?.fuel ?? 0;

  // CSS Animation for pulsing effect
  const pulsingStyle = isMoving ? {
    animation: 'pulse 1.5s infinite',
    borderLeft: '2px solid #2B8BFF'  // Brighter blue when pulsing
  } : {
    borderLeft: '2px solid #63B3ED'
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      color: 'white',
      background: '#131313',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      fontSize: '14px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      boxShadow: '0 0 20px rgba(0,0,0,0.5), 0 0 5px rgba(66, 153, 225, 0.3)',
      border: '1px solid rgba(250, 250, 250, 0.2)',
      height: '345px',
      width: '280px',
      letterSpacing: '0.3px',
      lineHeight: '1.5',
      padding: '16px',
    }}>
      <style jsx>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(99, 179, 237, 0.4);
            background: rgba(0,0,0,0.2);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(99, 179, 237, 0);
            background: rgba(43, 139, 255, 0.15);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(99, 179, 237, 0);
            background: rgba(0,0,0,0.2);
          }
        }
      `}</style>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{ 
          margin: 0, 
          color: '#63B3ED', 
          fontSize: '16px', 
          fontWeight: '600' 
        }}>
          SPUTNIK
        </h3>
        
        <button 
          onClick={onFollowSpaceship}
          style={{
            background: isFollowing ? 'rgba(99, 179, 237, 0.3)' : 'rgba(0,0,0,0.2)',
            border: '1px solid',
            borderColor: isFollowing ? '#63B3ED' : 'rgba(255,255,255,0.1)',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer',
            borderRadius: '4px',
            padding: '4px 8px',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
          onMouseOver={(e) => {
            if (!isFollowing) {
              e.currentTarget.style.background = 'rgba(99, 179, 237, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(99, 179, 237, 0.4)';
            }
          }}
          onMouseOut={(e) => {
            if (!isFollowing) {
              e.currentTarget.style.background = 'rgba(0,0,0,0.2)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            }
          }}
        >
          {isFollowing ? '👁️ Following' : 'Go to SPUTNIK'}
        </button>
      </div>
      
      {/* Position Section */}
      <div style={{ 
        padding: '12px', 
        background: 'rgba(0,0,0,0.2)', 
        borderRadius: '8px',
        ...pulsingStyle,
        marginBottom: '12px',
        transition: 'all 0.3s ease'
      }}>
        <p style={{ 
          margin: '0 0 8px 0', 
          color: '#90CDF4', 
          fontWeight: '500',
          fontSize: '14px'
        }}>
          Position
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <p style={{ margin: '0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>X</p>
            <p style={{ margin: '0', fontSize: '14px', color: '#fafafa' }}>
              {typeof position.x === 'number' ? position.x.toFixed(1) : position.x}
            </p>
          </div>
          <div>
            <p style={{ margin: '0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Y</p>
            <p style={{ margin: '0', fontSize: '14px', color: '#fafafa' }}>
              {typeof position.y === 'number' ? position.y.toFixed(1) : position.y}
            </p>
          </div>
          <div>
            <p style={{ margin: '0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Z</p>
            <p style={{ margin: '0', fontSize: '14px', color: '#fafafa' }}>
              {typeof position.z === 'number' ? position.z.toFixed(1) : position.z}
            </p>
          </div>
        </div>
      </div>
      
      {/* Status Section */}
      <div style={{ 
        padding: '12px', 
        background: 'rgba(0,0,0,0.2)', 
        borderRadius: '8px',
        borderLeft: '2px solid #63B3ED',
        marginBottom: '12px'
      }}>
        <p style={{ 
          margin: '0 0 8px 0', 
          color: '#90CDF4', 
          fontWeight: '500',
          fontSize: '14px'
        }}>
          Status
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Speed */}
          <div>
            <p style={{ margin: '0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Speed</p>
            <p style={{ margin: '0', fontSize: '14px', color: '#fafafa' }}>
              {speed} units/s
            </p>
          </div>
          
          {/* Target */}
          <div>
            <p style={{ margin: '0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Target</p>
            <p style={{ margin: '0', fontSize: '14px', color: '#fafafa' }}>
              Planet {TARGET_PLANET_ID}
            </p>
          </div>
        </div>
      </div>
      
      {/* Fuel Section */}
      <div style={{ 
        padding: '12px', 
        background: 'rgba(0,0,0,0.2)', 
        borderRadius: '8px',
        borderLeft: '2px solid #63B3ED'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <p style={{ 
            margin: '0', 
            color: '#90CDF4', 
            fontWeight: '500',
            fontSize: '14px'
          }}>
            Fuel
          </p>
          <p style={{ 
            margin: '0', 
            color: '#fafafa',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {fuel}
          </p>
        </div>
        
        {/* Fuel bar */}
        <div style={{ 
          width: '100%', 
          height: '8px', 
          background: '#222', 
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${fuelPercentage}%`, 
            height: '100%', 
            background: fuelPercentage > 25 
              ? 'linear-gradient(90deg, #3182CE, #63B3ED)' 
              : 'linear-gradient(90deg, #E53E3E, #FC8181)',
            transition: 'width 0.3s ease',
            borderRadius: '4px'
          }} />
        </div>
      </div>
    </div>
  );
} 