'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useEffect, useRef } from 'react';
import { FlyControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { StarField } from './assets/StarField';
import PlanetarySystem from './planets/PlanetarySystem';

export default function GameContainer() {
  const [flightSpeed, setFlightSpeed] = useState(10);
  const controlsRef = useRef(null);
  
  // Handle speed control with keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Increase speed with Shift key
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setFlightSpeed(prev => Math.min(prev * 2, 200));
      }
      
      // Decrease speed with Control key
      if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
        setFlightSpeed(prev => Math.max(prev / 2, 1));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
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
          <FlyControls
            ref={controlsRef}
            movementSpeed={flightSpeed}
            rollSpeed={0.5}
            dragToLook={true}
            autoForward={false}
          />
          
          {/* Star field with 500,000 stars */}
          <StarField count={2500} radius={10000} />
          
          {/* Planetary system with 1000 planets */}
          <PlanetarySystem planetCount={69} universeRadius={10000} />
          
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
        <p>W: Forward | S: Backward | A/D: Strafe</p>
        <p>R: Up | F: Down | Q/E: Roll</p>
        <p>SHIFT: Speed Up | CTRL: Slow Down</p>
      </div>
    </>
  );
} 