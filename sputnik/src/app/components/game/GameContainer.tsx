'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useState, useEffect, useRef } from 'react';
import { FlyControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import StarField from './assets/StarField';
import PlanetarySystem from './planets/PlanetarySystem';
import { PlanetInfo } from './planets/SimplePlanet';
import NavPanel from './panels/nav';
import HelpPanel from './panels/help';
import PlanetPanel from './panels/planet';
import Image from 'next/image';

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

// Logo component
function LogoPanel() {
  return (
    <div className="absolute top-[27px] left-[28px] z-10">
      <Image 
        src="/logo.png" 
        alt="DARK Logo" 
        width={40} 
        height={20} 
        priority
      />
    </div>
  );
}

export default function GameContainer() {
  const [flightSpeed, setFlightSpeed] = useState(800);
  const [position, setPosition] = useState<Position>({ x: 0, y: 5, z: 10 });
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetInfo | null>(null);
  const [autoForward, setAutoForward] = useState(true); // Start with autoForward enabled
  const [rotationSpeed] = useState(0.2); // Base rotation speed
  const controlsRef = useRef(null);
  
  // Track which arrow keys are pressed and when they were pressed
  const keyStates = useRef({
    ArrowUp: { pressed: false, startTime: 0 },
    ArrowDown: { pressed: false, startTime: 0 },
    ArrowLeft: { pressed: false, startTime: 0 },
    ArrowRight: { pressed: false, startTime: 0 }
  });
  
  // Handle speed control with keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable autoForward when any movement key is pressed
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        setAutoForward(false);
      }
      
      // Track arrow key state for acceleration
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && !keyStates.current[e.code as keyof typeof keyStates.current].pressed) {
        keyStates.current[e.code as keyof typeof keyStates.current] = {
          pressed: true,
          startTime: Date.now()
        };
      }
      
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
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Reset arrow key state
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        keyStates.current[e.code as keyof typeof keyStates.current] = {
          pressed: false,
          startTime: 0
        };
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Handle planet click
  const handlePlanetClick = (planetInfo: PlanetInfo) => {
    setSelectedPlanet(planetInfo);
  };
  
  // Handle closing the planet panel
  const handleClosePlanetPanel = () => {
    setSelectedPlanet(null);
  };

  // Create a smoother camera control setup with acceleration
  useEffect(() => {
    if (controlsRef.current) {
      // Apply custom acceleration to the controls
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const controls = controlsRef.current as any;
      if (controls.domElement && !controls._smoothSetup) {
        controls._smoothSetup = true;
        
        // Override the default update method to add custom acceleration
        const originalUpdate = controls.update;
        controls.update = (delta: number) => {
          // Calculate acceleration based on how long keys have been pressed
          const currentTime = Date.now();
          const BASE_ROTATION = 0.2;
          const MAX_ROTATION = 1.0;
          const ACCELERATION_TIME = 1000; // Time in ms to reach max speed
          
          const calculateRotationSpeed = (keyCode: string): number => {
            const keyState = keyStates.current[keyCode as keyof typeof keyStates.current];
            if (!keyState.pressed) return 0;
            
            const heldTime = currentTime - keyState.startTime;
            const accelerationFactor = Math.min(heldTime / ACCELERATION_TIME, 1);
            return BASE_ROTATION + (MAX_ROTATION - BASE_ROTATION) * accelerationFactor;
          };
          
          // Apply dynamic rotation speed to the appropriate axes
          if (controls.moveState) {
            // Up/Down controls (pitch)
            const upAcceleration = calculateRotationSpeed('ArrowUp');
            const downAcceleration = calculateRotationSpeed('ArrowDown');
            if (upAcceleration > 0) {
              controls.moveState.pitchUp = upAcceleration;
            }
            if (downAcceleration > 0) {
              controls.moveState.pitchDown = downAcceleration;
            }
            
            // Left/Right controls (yaw)
            const leftAcceleration = calculateRotationSpeed('ArrowLeft');
            const rightAcceleration = calculateRotationSpeed('ArrowRight');
            if (leftAcceleration > 0) {
              controls.moveState.yawLeft = leftAcceleration;
            }
            if (rightAcceleration > 0) {
              controls.moveState.yawRight = rightAcceleration;
            }
            
            // Update rotation quaternion with current state
            controls.updateRotationVector();
          }
          
          // Call the original update method
          originalUpdate.call(controls, delta);
        };
      }
    }
  }, []); // No dependencies required as we only want to run this once
  
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
            rollSpeed={rotationSpeed} // Base rotation speed
            dragToLook={true}
            autoForward={autoForward}
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
      <NavPanel position={position} />
      <HelpPanel />
      <PlanetPanel selectedPlanet={selectedPlanet} onClose={handleClosePlanetPanel} />
      <LogoPanel />
    </>
  );
} 