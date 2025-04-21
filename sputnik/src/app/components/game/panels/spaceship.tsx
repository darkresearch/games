import React, { useEffect, useState, useRef } from 'react';
import { SpaceshipStatus, TARGET_PLANET_ID } from '../spaceship/model';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';

type SpaceshipPanelProps = {
  status?: SpaceshipStatus | null;
  onFollowSpaceship?: () => void;
  isFollowing?: boolean;
  currentPosition?: { x: number, y: number, z: number } | null;
};

// Vector3 type for socket communication
type Vector3Position = {
  x: number;
  y: number;
  z: number;
};

export default function SpaceshipPanel({ 
  status: propStatus,
  onFollowSpaceship,
  isFollowing = false,
  currentPosition = null
}: SpaceshipPanelProps) {
  const [isMoving, setIsMoving] = useState(false);
  const [fuel, setFuel] = useState<number>(100); // Default to 100%
  const prevPositionRef = useRef<{ x: number | string, y: number | string, z: number | string } | null>(null);
  const socketRef = useRef<Socket | null>(null);
  
  // State for realtime data from Redis/Socket.io
  const [velocity, setVelocity] = useState<Vector3Position>({ x: 0, y: 0, z: 0 });
  const [destination, setDestination] = useState<Vector3Position | null>(null);
  
  // Connect to Socket.io for realtime updates
  useEffect(() => {
    let isMounted = true;
    console.log('🚀 PANEL: Setting up event listeners');
    
    // Use the shared socket instance
    const socket = getSocket();
    socketRef.current = socket;
    
    // Listen for state updates from Redis
    socket.on('spaceship:state', (state: any) => {
      if (isMounted) {
        if (state.velocity) {
          setVelocity({
            x: state.velocity[0],
            y: state.velocity[1],
            z: state.velocity[2]
          });
        }
        
        if (state.destination) {
          setDestination({
            x: state.destination[0],
            y: state.destination[1],
            z: state.destination[2]
          });
          setIsMoving(true);
        } else {
          setDestination(null);
          // Only set isMoving to false if velocity is near zero
          if (isVelocityNearZero(state.velocity)) {
            setIsMoving(false);
          }
        }
        
        // Update fuel if provided
        if (state.fuel !== undefined) {
          setFuel(state.fuel);
        }
      }
    });
    
    // Also listen for position updates to detect movement
    socket.on('spaceship:position', (position: Vector3Position) => {
      if (isMounted && prevPositionRef.current) {
        // Check if position changed significantly
        const prev = prevPositionRef.current;
        const isChanged = 
          (typeof prev.x === 'number' && typeof position.x === 'number' && Math.abs(position.x - prev.x) > 0.01) ||
          (typeof prev.y === 'number' && typeof position.y === 'number' && Math.abs(position.y - prev.y) > 0.01) ||
          (typeof prev.z === 'number' && typeof position.z === 'number' && Math.abs(position.z - prev.z) > 0.01);
          
        if (isChanged) {
          setIsMoving(true);
        }
      }
    });
    
    return () => {
      isMounted = false;
      
      if (socketRef.current) {
        // Remove just our component's listeners without disconnecting the shared socket
        socket.off('spaceship:state');
        socket.off('spaceship:position');
        socketRef.current = null;
      }
    };
  }, []);
  
  // Helper function to check if velocity is near zero
  const isVelocityNearZero = (vel: [number, number, number] | Vector3Position | undefined | null) => {
    if (!vel) return true;
    
    // Handle array format
    if (Array.isArray(vel)) {
      return Math.abs(vel[0]) < 0.01 && Math.abs(vel[1]) < 0.01 && Math.abs(vel[2]) < 0.01;
    }
    
    // Handle object format
    return Math.abs(vel.x) < 0.01 && Math.abs(vel.y) < 0.01 && Math.abs(vel.z) < 0.01;
  };
  
  // Use current position from props if available or default
  const position = currentPosition || 
    (propStatus?.position || { x: 0, y: 0, z: 0 });
  
  // Combined effect for movement detection
  useEffect(() => {
    // Position change detection
    if (!prevPositionRef.current) {
      prevPositionRef.current = { ...position };
      return;
    }
    
    const isPositionChanged = 
      position.x !== prevPositionRef.current.x ||
      position.y !== prevPositionRef.current.y ||
      position.z !== prevPositionRef.current.z;
    
    // Set moving state based on position change or having a destination
    if (isPositionChanged || destination !== null) {
      setIsMoving(true);
    } else if (isVelocityNearZero(velocity)) {
      setIsMoving(false);
    }
    
    // Store new position for next comparison
    prevPositionRef.current = { ...position };
  }, [position, destination, velocity]);
  
  // Fuel percentage for bar display
  const fuelPercentage = fuel;
  const fuelText = `${Math.round(fuel)}%`;

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
              24.33 units/s
            </p>
          </div>
          
          {/* Target */}
          <div>
            <p style={{ margin: '0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Target</p>
            <p style={{ margin: '0', fontSize: '14px', color: '#fafafa' }}>
              {TARGET_PLANET_ID}
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
            {fuelText}
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