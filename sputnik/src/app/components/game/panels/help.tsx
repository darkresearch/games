import React, { useState } from 'react';

export default function HelpPanel() {
  const [isVisible, setIsVisible] = useState(true);
  
  const togglePanel = () => {
    setIsVisible(!isVisible);
  };
  
  // Help button that shows when panel is hidden
  if (!isVisible) {
    return (
      <button 
        onClick={togglePanel}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(145deg, rgba(15,23,42,0.85), rgba(15,23,42,0.6))',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(66, 153, 225, 0.3)',
          color: '#63B3ED',
          fontSize: '20px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 0 15px rgba(0,0,0,0.3)',
          zIndex: 1000,
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(66, 153, 225, 0.4)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 0 15px rgba(0,0,0,0.3)';
        }}
      >
        ?
      </button>
    );
  }
  
  // Full help panel
  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      color: 'white',
      background: '#131313',
      backdropFilter: 'blur(10px)',
      padding: '16px 20px',
      borderRadius: '12px',
      fontSize: '14px',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      boxShadow: '0 0 20px rgba(0,0,0,0.5), 0 0 5px rgba(66, 153, 225, 0.3)',
      border: '1px solid rgba(250, 250, 250, 0.2)',
      pointerEvents: 'auto',
      height: '345px',
      width: '280px',
      letterSpacing: '0.3px',
      lineHeight: '1.5',
      zIndex: 1000
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
          Your Controls
        </h3>
        <button 
          onClick={togglePanel}
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
      
      <div style={{ 
        padding: '12px 14px', 
        background: 'rgba(0,0,0,0.2)', 
        borderRadius: '8px',
        borderLeft: '2px solid #63B3ED'
      }}>
        <p style={{ margin: '6px 0', color: 'rgba(255,255,255,0.9)' }}>
            <span style={{ color: '#90CDF4', width: '45px', display: 'inline-block' }}>W</span> Forward
        </p>
        <p style={{ margin: '6px 0', color: 'rgba(255,255,255,0.9)' }}>
            <span style={{ color: '#90CDF4', width: '45px', display: 'inline-block' }}>S</span> Backwards
        </p>
        <p style={{ margin: '6px 0', color: 'rgba(255,255,255,0.9)' }}>
            <span style={{ color: '#90CDF4', width: '45px', display: 'inline-block' }}>A</span> Left
        </p>
        <p style={{ margin: '6px 0', color: 'rgba(255,255,255,0.9)' }}>
            <span style={{ color: '#90CDF4', width: '45px', display: 'inline-block' }}>D</span> Right
        </p>
        <p style={{ margin: '6px 0', color: 'rgba(255,255,255,0.9)' }}>
            <span style={{ color: '#90CDF4', width: '45px', display: 'inline-block' }}> ⬆️ ⬅️ ➡️ ⬇️ </span> Turn
        </p>
        <p style={{ margin: '6px 0', color: 'rgba(255,255,255,0.9)' }}>
            <span style={{ color: '#90CDF4', width: '45px', display: 'inline-block' }}> Q/E </span> Rotate
        </p>
        <p style={{ margin: '6px 0', color: 'rgba(255,255,255,0.9)' }}>
            <span style={{ color: '#90CDF4', width: '45px', display: 'inline-block' }}> T </span> Speed up
        </p>
        <p style={{ margin: '6px 0', color: 'rgba(255,255,255,0.9)' }}>
            <span style={{ color: '#90CDF4', width: '45px', display: 'inline-block' }}> G </span> Slow down
        </p>
      </div>
    </div>
  );
}
