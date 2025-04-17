'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useState, useEffect, useRef } from 'react';
import { FlyControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import StarField from './assets/StarField';
import PlanetarySystem from './planets/PlanetarySystem';
import { PlanetInfo } from './planets/SimplePlanet';

// Component to track camera position and update coordinates
function CameraPositionTracker({ setPosition }: { setPosition: (position: Position) => void }) {
  const { camera } = useThree();
  
  useFrame(() => {
    setPosition({
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    });
  });
  
  return null;
}

// Define position type
type Position = {
  x: number;
  y: number;
  z: number;
};

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

export default function GameContainer() {
  const [flightSpeed, setFlightSpeed] = useState(200);
  const [position, setPosition] = useState<Position>({ x: 0, y: 5, z: 10 });
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetInfo | null>(null);
  const controlsRef = useRef(null);
  
  // Handle speed control with keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Increase speed with T key
      if (e.code === 'KeyT') {
        setFlightSpeed(prev => Math.min(prev * 2, 2500));
      }
      
      // Decrease speed with G key
      if (e.code === 'KeyG') {
        setFlightSpeed(prev => Math.max(prev / 2, 1));
      }
      
      // Close planet info panel with Escape key
      if (e.code === 'Escape') {
        setSelectedPlanet(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Handle planet click
  const handlePlanetClick = (planetInfo: PlanetInfo) => {
    setSelectedPlanet(planetInfo);
  };
  
  return (
    <>
      <Canvas
        camera={{ 
          position: [0, 5, 10], 
          fov: 45,
          far: 100000, // Increased far clipping plane to see distant objects
          near: 0.1
        }}
        gl={{ 
          antialias: true, 
          alpha: false,
          logarithmicDepthBuffer: true // Better depth precision for large scenes
        }}
        style={{ background: '#131313' }}
        shadows
      >
        <Suspense fallback={null}>
          <CameraPositionTracker setPosition={setPosition} />
          
          <FlyControls
            ref={controlsRef}
            movementSpeed={flightSpeed}
            rollSpeed={0.5}
            dragToLook={true}
            autoForward={false}
          />
          
          {/* Star field with stars */}
          <StarField count={25000} radius={20000} />
          
          {/* Planetary system */}
          <PlanetarySystem 
            planetCount={69} 
            universeRadius={10000} 
            onPlanetClick={handlePlanetClick}
          />
          
          {/* Add post-processing effects */}
          <EffectComposer>
            <Bloom 
              intensity={0.8}
              luminanceThreshold={0.1}
              luminanceSmoothing={0.9}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
      
      {/* Speed and controls indicator */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        color: 'white',
        background: 'rgba(0,0,0,0.5)',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '14px',
        pointerEvents: 'none'
      }}>
        <p>Speed: {flightSpeed.toFixed(1)}</p>
        <p>Position: X: {position.x.toFixed(1)} Y: {position.y.toFixed(1)} Z: {position.z.toFixed(1)}</p>
        <p>W: Forward | S: Backward | A/D: Strafe</p>
        <p>R: Up | F: Down | Q/E: Roll</p>
        <p>T: Speed Up | G: Slow Down</p>
      </div>
      
      {/* 2D panel for planet info */}
      {selectedPlanet && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          width: '300px',
          color: 'white',
          background: 'rgba(0,0,0,0.7)',
          padding: '15px',
          borderRadius: '10px',
          fontSize: '16px',
          border: `2px solid ${getPlanetColor(selectedPlanet.type)}`,
          boxShadow: `0 0 20px ${getPlanetColor(selectedPlanet.type)}`,
          zIndex: 1000,
          pointerEvents: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ 
              color: getPlanetColor(selectedPlanet.type),
              margin: '0 0 10px 0',
              fontSize: '20px'
            }}>
              Planet {selectedPlanet.id}
            </h2>
            <button 
              onClick={() => setSelectedPlanet(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
          
          <div style={{ display: 'flex', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '5px 0' }}><strong>Type:</strong> {selectedPlanet.type.charAt(0).toUpperCase() + selectedPlanet.type.slice(1)}</p>
              <p style={{ margin: '5px 0' }}><strong>Size:</strong> {selectedPlanet.size}</p>
            </div>
            <div style={{ 
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: getPlanetColor(selectedPlanet.type),
              opacity: 0.6,
              marginLeft: '10px'
            }} />
          </div>
          
          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.1)', 
            padding: '10px', 
            borderRadius: '5px',
            marginTop: '10px'
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Coordinates:</p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <p style={{ margin: '3px 0' }}><strong>X:</strong> {selectedPlanet.position[0].toFixed(1)}</p>
              <p style={{ margin: '3px 0' }}><strong>Y:</strong> {selectedPlanet.position[1].toFixed(1)}</p>
              <p style={{ margin: '3px 0' }}><strong>Z:</strong> {selectedPlanet.position[2].toFixed(1)}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 