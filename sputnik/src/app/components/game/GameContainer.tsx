'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useState, useEffect, useRef } from 'react';
import { FlyControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import StarField from './assets/StarField';
import PlanetarySystem from './planets/PlanetarySystem';
import { PlanetInfo } from './planets/SimplePlanet';
import NavPanel from './panels/nav';
import HelpPanel from './panels/help';
import PlanetPanel from './panels/planet';

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
  const [flightSpeed, setFlightSpeed] = useState(800);
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
  
  // Handle closing the planet panel
  const handleClosePlanetPanel = () => {
    setSelectedPlanet(null);
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
      
      {/* UI Panels */}
      <NavPanel flightSpeed={flightSpeed} position={position} />
      <HelpPanel />
      <PlanetPanel selectedPlanet={selectedPlanet} onClose={handleClosePlanetPanel} />
    </>
  );
} 