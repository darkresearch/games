import React from 'react';
import { PlanetInfo } from '../planets/SimplePlanet';

// Get planet type color helper
const getPlanetColor = (type: string): string => {
  switch (type) {
    case 'fire': return '#ff5500';
    case 'water': return '#0066ff';
    case 'earth': return '#338855';
    case 'air': return '#ddddff';
    default: return '#ffffff';
  }
};

type PlanetPanelProps = {
  selectedPlanet: PlanetInfo | null;
  onClose: () => void;
};

export default function PlanetPanel({ selectedPlanet, onClose }: PlanetPanelProps) {
  if (!selectedPlanet) return null;
  
  const typeColor = getPlanetColor(selectedPlanet.type);
  const typeColorValues = selectedPlanet.type === 'air' ? '185,185,255' : 
                           selectedPlanet.type === 'fire' ? '255,85,0' : 
                           selectedPlanet.type === 'water' ? '0,102,255' : '51,136,85';
  
  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      height: '345px',
      width: '280px',
      color: 'white',
      background: '#131313',
      backdropFilter: 'blur(10px)',
      padding: '16px 20px',
      borderRadius: '12px',
      fontSize: '15px',
      letterSpacing: '0.3px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      border: `1px solid rgba(${typeColorValues},0.4)`,
      boxShadow: `0 0 30px rgba(${typeColorValues},0.2)`,
      zIndex: 1000,
      pointerEvents: 'auto',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{ 
          color: typeColor,
          margin: '0',
          fontSize: '22px',
          fontWeight: '600',
          textShadow: `0 0 8px ${typeColor}`
        }}>
          Planet {selectedPlanet.id}
        </h2>
        <button 
          onClick={onClose}
          style={{
            background: 'rgba(0,0,0,0.2)',
            border: 'none',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease',
            padding: 0
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
        >
          ✕
        </button>
      </div>
      
      <div style={{ display: 'flex', marginBottom: '10px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '3px 0', fontSize: '14px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Type:</span> 
            <span style={{ color: typeColor, fontWeight: '500' }}>
              {selectedPlanet.type.charAt(0).toUpperCase() + selectedPlanet.type.slice(1)}
            </span>
          </p>
          <p style={{ margin: '3px 0', fontSize: '14px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Size:</span>
            <span style={{ fontWeight: '500' }}>{selectedPlanet.size}</span>
          </p>
        </div>
        <div style={{ 
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: typeColor,
          opacity: 0.7,
          marginLeft: '15px',
          boxShadow: `0 0 20px ${typeColor}`,
          border: `2px solid rgba(255,255,255,0.1)`
        }} />
      </div>
      
      <div style={{ 
        background: 'linear-gradient(to right, rgba(0,0,0,0.3), rgba(20,20,20,0.1))', 
        padding: '8px 12px', 
        borderRadius: '8px',
        marginTop: '10px',
        borderLeft: `2px solid ${typeColor}`
      }}>
        <p style={{ margin: '0 0 6px 0', fontWeight: '500', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>Coordinates:</p>
        <p style={{ margin: '4px 0', fontSize: '14px' }}>
          <span style={{ color: '#63B3ED', width: '20px', display: 'inline-block' }}>X:</span> {selectedPlanet.position[0].toFixed(1)}
        </p>
        <p style={{ margin: '4px 0', fontSize: '14px' }}>
          <span style={{ color: '#63B3ED', width: '20px', display: 'inline-block' }}>Y:</span> {selectedPlanet.position[1].toFixed(1)}
        </p>
        <p style={{ margin: '4px 0', fontSize: '14px' }}>
          <span style={{ color: '#63B3ED', width: '20px', display: 'inline-block' }}>Z:</span> {selectedPlanet.position[2].toFixed(1)}
        </p>
      </div>
    </div>
  );
}
