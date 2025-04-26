import React from 'react';

type Position = {
  x: number;
  y: number;
  z: number;
};

type NavPanelProps = {
  position: Position;
  spaceshipPosition: Position;
  currentFuel: number;
};

export default function NavPanel({ spaceshipPosition, currentFuel }: NavPanelProps) {
  // Fuel percentage for bar display - ensure it's within 0-100 range
  const fuelPercentage = Math.max(0, Math.min(100, currentFuel));
  const fuelText = `${Math.round(fuelPercentage)}%`;
  
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      color: 'white',
      background: '#131313',
      backdropFilter: 'blur(10px)',
      borderRadius: '8px',
      fontSize: '14px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      boxShadow: '0 0 20px rgba(0,0,0,0.5), 0 0 5px rgba(66, 153, 225, 0.3)',
      border: '1px solid rgba(250, 250, 250, 0.2)',
      pointerEvents: 'none',
      width: '280px',
      letterSpacing: '0.3px',
      lineHeight: '1.5',
      padding: '12px 16px',
    }}>
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
      }}>
        {/* Position display */}
        <p style={{ margin: '0', fontSize: '14px', color: '#fafafa' }}>
          <span style={{ color: '#63B3ED' }}>X:</span> {spaceshipPosition.x.toFixed(1)} <span style={{ color: '#63B3ED' }}>Y:</span> {spaceshipPosition.y.toFixed(1)} <span style={{ color: '#63B3ED' }}>Z:</span> {spaceshipPosition.z.toFixed(1)}
        </p>
        
        {/* Fuel percentage */}
        <p style={{ 
          margin: '0 0 0 12px', 
          color: '#fafafa',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Fuel: {fuelText}
        </p>
      </div>
      
      {/* Fuel bar */}
      <div style={{ 
        width: '100%', 
        height: '4px', 
        background: '#222', 
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          width: `${fuelPercentage}%`, 
          height: '100%', 
          background: fuelPercentage > 25 
            ? 'linear-gradient(90deg, #3182CE, #63B3ED)' 
            : 'linear-gradient(90deg, #E53E3E, #FC8181)',
          transition: 'width 0.3s ease',
          borderRadius: '2px'
        }} />
      </div>
    </div>
  );
}
