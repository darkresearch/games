import React from 'react';
import { SpaceshipStatus, TARGET_PLANET_ID } from '../spaceship/model';

type SpaceshipPanelProps = {
  status?: SpaceshipStatus | null;
  onFollowSpaceship?: () => void;
  isFollowing?: boolean;
  currentPosition?: { x: number, y: number, z: number } | null;
  currentFuel?: number;
};

// Vector3 type for socket communication
type Vector3Position = {
  x: number;
  y: number;
  z: number;
};

export default function SpaceshipPanel({ 
  onFollowSpaceship,
  isFollowing = false,
  currentPosition = null,
  currentFuel = 50 // Default to 100% if not provided
}: SpaceshipPanelProps) {
  // Use current position from props if available or default
  const position = currentPosition || { x: 0, y: 0, z: 0 }
  
  // Fuel percentage for bar display - ensure it's within 0-100 range
  const fuelPercentage = Math.max(0, Math.min(100, currentFuel));
  const fuelText = `${Math.round(fuelPercentage)}%`;

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
        borderLeft: '2px solid #63B3ED',
        marginBottom: '12px',
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