'use client';

import React from 'react';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { getPanelBaseStyles, mergeStyles, panelStyles, touchFriendlyStyles } from '@/lib/styles/responsive';

// Import Planet info type
import { PlanetInfo, PlanetType } from '../planets/SimplePlanet';

type PlanetPanelProps = {
  selectedPlanet: PlanetInfo | null;
  onClose: () => void;
};

// Function to get planet color based on type
const getPlanetColor = (type: PlanetType): string => {
  switch (type) {
    case 'fire': return '#ff5500';
    case 'water': return '#0088ff';
    case 'earth': return '#55aa77';
    case 'air': return '#aabbff';
    case 'jupiter': return '#ffaa44';
    case 'wif': return '#cc77ee';
    default: return '#ffffff';
  }
};

export default function PlanetPanel({ selectedPlanet, onClose }: PlanetPanelProps) {
  const isMobile = useIsMobile();
  
  if (!selectedPlanet) {
    return null;
  }
  
  // Choose style variant based on device
  const variant = isMobile ? 'mobile' : 'desktop';
  
  // Get responsive styles
  const containerStyles = mergeStyles(
    getPanelBaseStyles(variant),
    panelStyles.planet[variant]
  );
  
  // Get planet color
  const planetColor = getPlanetColor(selectedPlanet.type);
  
  // Close button style adjustments for mobile
  const closeButtonStyles = {
    position: 'absolute' as const,
    top: isMobile ? '16px' : '12px',
    right: isMobile ? '16px' : '12px',
    cursor: 'pointer',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    color: '#fff',
    borderRadius: '50%',
    width: isMobile ? '44px' : '28px',
    height: isMobile ? '44px' : '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: isMobile ? '24px' : '18px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    zIndex: 10,
  };

  return (
    <div style={containerStyles}>
      {/* Planet Header with gradient matching planet type */}
      <div style={{
        padding: isMobile ? '24px 20px' : '16px',
        background: `linear-gradient(to bottom, ${planetColor}33, transparent)`,
        position: 'relative',
        borderTopLeftRadius: isMobile ? '0' : '8px',
        borderTopRightRadius: isMobile ? '0' : '8px',
      }}>
        {/* Close button */}
        <div 
          style={closeButtonStyles}
          onClick={onClose}
        >
          ×
        </div>
        
        <h2 style={{ 
          margin: '0', 
          color: planetColor, 
          fontSize: isMobile ? '28px' : '24px',
          fontWeight: '600'
        }}>
          Planet {selectedPlanet.id}
        </h2>
        
        <p style={{ 
          margin: '4px 0 0', 
          opacity: 0.8,
          fontSize: isMobile ? '16px' : '14px',
        }}>
          Type: {selectedPlanet.type}
        </p>
      </div>
      
      {/* Planet Details */}
      <div style={{ 
        padding: isMobile ? '20px' : '16px',
        fontSize: isMobile ? '16px' : '14px',
        lineHeight: '1.6',
        maxHeight: isMobile ? 'calc(100vh - 180px)' : '300px',
        overflowY: 'auto'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ 
            margin: '0 0 8px', 
            color: planetColor,
            fontSize: isMobile ? '18px' : '16px',
          }}>
            Distance
          </h3>
          <p style={{ margin: '0' }}>
            <span style={{ opacity: 0.7 }}>X:</span> {selectedPlanet.position[0].toFixed(2)}{' '}
            <span style={{ opacity: 0.7 }}>Y:</span> {selectedPlanet.position[1].toFixed(2)}{' '}
            <span style={{ opacity: 0.7 }}>Z:</span> {selectedPlanet.position[2].toFixed(2)}
          </p>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ 
            margin: '0 0 8px', 
            color: planetColor,
            fontSize: isMobile ? '18px' : '16px',
          }}>
            Size
          </h3>
          <p style={{ margin: '0' }}>
            {selectedPlanet.size} units
          </p>
        </div>
        
        <div>
          <h3 style={{ 
            margin: '0 0 8px', 
            color: planetColor,
            fontSize: isMobile ? '18px' : '16px',
          }}>
            Description
          </h3>
          <p style={{ 
            margin: '0',
            lineHeight: '1.6',
          }}>
            {selectedPlanet.type.charAt(0).toUpperCase() + selectedPlanet.type.slice(1)} planet with unique properties.
          </p>
        </div>
      </div>
      
      {/* Action buttons */}
      <div style={{ 
        padding: isMobile ? '20px' : '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px'
      }}>
        <button 
          onClick={onClose}
          style={mergeStyles({
            backgroundColor: '#3B3B3B',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: isMobile ? '16px' : '14px',
            fontWeight: '500',
          }, isMobile ? touchFriendlyStyles : {})}
        >
          Close
        </button>
        <button 
          style={mergeStyles({
            backgroundColor: planetColor,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: isMobile ? '16px' : '14px',
            fontWeight: '500',
          }, isMobile ? touchFriendlyStyles : {})}
        >
          Set Target
        </button>
      </div>
    </div>
  );
}
