'use client';

import React from 'react';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { getPanelBaseStyles, mergeStyles, panelStyles } from '@/lib/styles/responsive';

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
  const isMobile = useIsMobile();
  
  // Fuel percentage for bar display - ensure it's within 0-100 range
  const fuelPercentage = Math.max(0, Math.min(100, currentFuel));
  const fuelText = `${Math.round(fuelPercentage)}%`;
  
  // Choose style variant based on device
  const variant = isMobile ? 'mobile' : 'desktop';
  
  // Get responsive styles
  const containerStyles = mergeStyles(
    getPanelBaseStyles(variant),
    panelStyles.nav[variant]
  );
  
  return (
    <div style={containerStyles}>
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px',
      }}>
        {/* Position display */}
        <p style={{ 
          margin: '0', 
          fontSize: isMobile ? '11px' : '14px', 
          color: '#fafafa' 
        }}>
          <span style={{ color: '#63B3ED' }}>X:</span> {spaceshipPosition.x.toFixed(isMobile ? 0 : 1)} <span style={{ color: '#63B3ED' }}>Y:</span> {spaceshipPosition.y.toFixed(isMobile ? 0 : 1)} <span style={{ color: '#63B3ED' }}>Z:</span> {spaceshipPosition.z.toFixed(isMobile ? 0 : 1)}
        </p>
        
        {/* Fuel percentage */}
        <p style={{ 
          margin: '0 0 0 12px', 
          color: '#fafafa',
          fontSize: isMobile ? '11px' : '14px',
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
