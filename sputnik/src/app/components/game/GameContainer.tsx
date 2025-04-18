'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useState, useEffect, useRef } from 'react';
import { FlyControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import StarField from './assets/StarField';
import PlanetarySystem from './planets/PlanetarySystem';
import { PlanetInfo } from './planets/SimplePlanet';
import Spaceship from './spaceship/Spaceship';
import { Vector3 } from './spaceship/PhysicsSystem';
import { spaceshipAPI, SpaceshipStatus, TARGET_PLANET_ID } from './spaceship/api';
import NavPanel from './panels/nav';
import HelpPanel from './panels/help';
import PlanetPanel from './panels/planet';
import SpaceshipPanel from './panels/spaceship';
import Image from 'next/image';
import { spaceshipState } from '@/lib/supabase';
import * as THREE from 'three';

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

// Camera transition animation component
function CameraTransition({
  isTransitioning,
  spaceshipStatus,
  transitionProgress,
  setTransitionProgress,
  setIsTransitioning,
  setFollowSpaceship,
  setAutoForward,
  controlsRef,
  easeInOutCubic
}: {
  isTransitioning: boolean;
  spaceshipStatus: SpaceshipStatus | null;
  transitionProgress: number;
  setTransitionProgress: (progress: number) => void;
  setIsTransitioning: (transitioning: boolean) => void;
  setFollowSpaceship: (following: boolean) => void;
  setAutoForward: (auto: boolean) => void;
  controlsRef: React.RefObject<any>;
  easeInOutCubic: (t: number) => number;
}) {
  // Get reference to camera
  const { camera } = useThree();
  // Store the initial camera position and rotation when transition starts
  const startPosRef = useRef<THREE.Vector3 | null>(null);
  const startQuatRef = useRef<THREE.Quaternion | null>(null);
  
  useFrame((state, delta) => {
    if (!isTransitioning || !spaceshipStatus) return;
    
    // Get controls
    const controls = controlsRef.current as any;
    
    // Initialize start position and rotation if not set
    if (!startPosRef.current && transitionProgress === 0) {
      // Store initial camera position and rotation
      startPosRef.current = camera.position.clone();
      startQuatRef.current = camera.quaternion.clone();
      
      // Disable controls during transition
      if (controls) {
        controls.enabled = false;
      }
    }
    
    // Use our stored start position
    const startPos = startPosRef.current || camera.position;
    
    // Calculate target position (slightly behind and above the spaceship)
    const targetPosition = new THREE.Vector3(
      spaceshipStatus.position.x,
      spaceshipStatus.position.y + 5, // Above
      spaceshipStatus.position.z - 15  // Behind
    );
    
    // Calculate target rotation (looking at spaceship)
    const targetQuaternion = new THREE.Quaternion();
    const lookTarget = new THREE.Vector3(
      spaceshipStatus.position.x,
      spaceshipStatus.position.y,
      spaceshipStatus.position.z
    );
    
    // Create a matrix to look at the target
    const lookMatrix = new THREE.Matrix4();
    lookMatrix.lookAt(targetPosition, lookTarget, new THREE.Vector3(0, 1, 0));
    const targetRotation = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);
    
    // Duration of transition in seconds
    const transitionDuration = 1.5;
    
    // Update transition progress
    const newProgress = Math.min(transitionProgress + (delta / transitionDuration), 1);
    setTransitionProgress(newProgress);
    
    // Smoothly interpolate between start and target positions using easing
    const t = easeInOutCubic(newProgress);
    
    // Interpolate position
    const newX = startPos.x + (targetPosition.x - startPos.x) * t;
    const newY = startPos.y + (targetPosition.y - startPos.y) * t;
    const newZ = startPos.z + (targetPosition.z - startPos.z) * t;
    camera.position.set(newX, newY, newZ);
    
    // Interpolate rotation (if we have a start quaternion)
    if (startQuatRef.current) {
      camera.quaternion.slerpQuaternions(startQuatRef.current, targetRotation, t);
    }
    
    // If transition is complete, switch to normal follow mode
    if (newProgress >= 1) {
      setIsTransitioning(false);
      setFollowSpaceship(true);
      setAutoForward(false);
      
      // Reset references for next transition
      startPosRef.current = null;
      startQuatRef.current = null;
      
      // Re-enable controls after transition
      if (controls) {
        controls.enabled = true;
      }
    }
  });
  
  // Make sure to re-enable controls if component unmounts during transition
  useEffect(() => {
    return () => {
      if (isTransitioning && controlsRef.current) {
        const controls = controlsRef.current as any;
        if (controls) {
          controls.enabled = true;
        }
      }
    };
  }, [isTransitioning, controlsRef]);
  
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
  const [flightSpeed, setFlightSpeed] = useState(200);
  const [position, setPosition] = useState<Position>({ x: 0, y: 5, z: 10 });
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetInfo | null>(null);
  const [autoForward, setAutoForward] = useState(true); // Start with autoForward enabled
  const [rotationSpeed] = useState(0.2); // Base rotation speed
  const [spaceshipStatus, setSpaceshipStatus] = useState<SpaceshipStatus | null>(null);
  const [spaceshipPosition, setSpaceshipPosition] = useState<Vector3>({ x: 0, y: 0, z: 0 });
  const [followSpaceship, setFollowSpaceship] = useState(false); // Track if camera should follow spaceship
  const [isTransitioning, setIsTransitioning] = useState(false); // Track if camera is moving to spaceship
  const [transitionProgress, setTransitionProgress] = useState(0); // Progress of transition animation (0-1)
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
      // Disable autoForward, followSpaceship and transitions when any movement key is pressed
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        setAutoForward(false);
        setFollowSpaceship(false);
        setIsTransitioning(false);
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
  
  // Use Supabase real-time subscription instead of polling
  useEffect(() => {
    // Initial state fetch
    const fetchInitialState = async () => {
      try {
        const initialState = await spaceshipState.getState();
        if (initialState) {
          // Convert Supabase state format to SpaceshipStatus format
          const status: SpaceshipStatus = {
            position: {
              x: initialState.position[0],
              y: initialState.position[1],
              z: initialState.position[2]
            },
            velocity: {
              x: initialState.velocity[0],
              y: initialState.velocity[1],
              z: initialState.velocity[2]
            },
            rotation: {
              x: initialState.rotation[0],
              y: initialState.rotation[1],
              z: initialState.rotation[2]
            },
            fuel: initialState.fuel
          };
          setSpaceshipStatus(status);
        }
      } catch (error) {
        console.error('Error fetching initial spaceship state:', error);
      }
    };

    fetchInitialState();

    // Set up real-time subscription
    const subscription = spaceshipState.subscribeToState((newState) => {
      // Convert Supabase state format to SpaceshipStatus format
      const status: SpaceshipStatus = {
        position: {
          x: newState.position[0],
          y: newState.position[1],
          z: newState.position[2]
        },
        velocity: {
          x: newState.velocity[0],
          y: newState.velocity[1],
          z: newState.velocity[2]
        },
        rotation: {
          x: newState.rotation[0],
          y: newState.rotation[1],
          z: newState.rotation[2]
        },
        fuel: newState.fuel
      };
      setSpaceshipStatus(status);
    });

    return () => {
      // Clean up subscription on unmount
      subscription.unsubscribe();
    };
  }, []);
  
  // Handle spaceship position updates
  const handleSpaceshipPositionUpdate = (newPosition: Vector3) => {
    setSpaceshipPosition(newPosition);
  };

  // Toggle follow spaceship mode
  const handleFollowSpaceship = () => {
    if (followSpaceship) {
      // If already following, just turn it off
      setFollowSpaceship(false);
      return;
    }
    
    if (!spaceshipStatus) return;
    
    // Simply start the transition - we'll capture the exact camera position in the component
    setTransitionProgress(0);
    setIsTransitioning(true);
    // We'll set followSpaceship to true when the transition is complete
  };
  
  // Easing function for smoother animation
  const easeInOutCubic = (t: number) => {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  
  // Regular camera follow logic (once transition is complete)
  useEffect(() => {
    if (isTransitioning || !followSpaceship || !controlsRef.current || !spaceshipStatus) return;
    
    // Position camera slightly behind and above the spaceship
    const controls = controlsRef.current as any;
    if (controls && controls.object) {
      // Disable controls while we're in follow mode
      controls.enabled = false;
      
      const offset = { x: 0, y: 5, z: -15 }; // Adjust these values to change camera position relative to ship
      controls.object.position.x = spaceshipStatus.position.x + offset.x;
      controls.object.position.y = spaceshipStatus.position.y + offset.y;
      controls.object.position.z = spaceshipStatus.position.z + offset.z;
      
      // Make camera look at spaceship
      const target = new THREE.Vector3(
        spaceshipStatus.position.x,
        spaceshipStatus.position.y,
        spaceshipStatus.position.z
      );
      controls.object.lookAt(target);
    }
    
    // Re-enable controls when exiting follow mode
    return () => {
      if (controlsRef.current) {
        const controls = controlsRef.current as any;
        if (controls) {
          controls.enabled = true;
        }
      }
    };
  }, [followSpaceship, spaceshipStatus, isTransitioning]);

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
          
          {/* Add the camera transition component */}
          <CameraTransition
            isTransitioning={isTransitioning}
            spaceshipStatus={spaceshipStatus}
            transitionProgress={transitionProgress}
            setTransitionProgress={setTransitionProgress}
            setIsTransitioning={setIsTransitioning}
            setFollowSpaceship={setFollowSpaceship}
            setAutoForward={setAutoForward}
            controlsRef={controlsRef}
            easeInOutCubic={easeInOutCubic}
          />
          
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
          
          {/* AI-controlled spaceship */}
          <Spaceship 
            initialPosition={spaceshipPosition}
            onPositionUpdate={handleSpaceshipPositionUpdate}
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
      <SpaceshipPanel 
        status={spaceshipStatus} 
        onFollowSpaceship={handleFollowSpaceship} 
        isFollowing={followSpaceship}
      />
      <LogoPanel />
    </>
  );
} 