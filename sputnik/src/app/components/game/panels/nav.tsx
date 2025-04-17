import React from 'react';

type Position = {
  x: number;
  y: number;
  z: number;
};

type NavPanelProps = {
  flightSpeed: number;
  position: Position;
};

export default function NavPanel({ flightSpeed, position }: NavPanelProps) {
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
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '16px',
    }}>
      <p style={{ margin: '0 0 0 0', fontSize: '14px', color: '#fafafa' }}>
        <span style={{ color: '#63B3ED' }}>X:</span> {position.x.toFixed(1)} <span style={{ color: '#63B3ED' }}>Y:</span> {position.y.toFixed(1)} <span style={{ color: '#63B3ED' }}>Z:</span> {position.z.toFixed(1)}
      </p>
    </div>
  );
}
