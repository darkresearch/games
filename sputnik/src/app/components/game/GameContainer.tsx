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
import { SpaceshipStatus } from './spaceship/api';
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
  spaceshipPosition,
  transitionProgress,
  setTransitionProgress,
  setIsTransitioning,
  setFollowSpaceship,
  controlsRef,
  easeInOutCubic
}: {
  isTransitioning: boolean;
  spaceshipPosition: Vector3;
  transitionProgress: number;
  setTransitionProgress: (progress: number) => void;
  setIsTransitioning: (transitioning: boolean) => void;
  setFollowSpaceship: (following: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>;
  easeInOutCubic: (t: number) => number;
}) {
  // Get reference to camera
  const { camera } = useThree();
  // Store the initial camera position and rotation when transition starts
  const startPosRef = useRef<THREE.Vector3 | null>(null);
  const startQuatRef = useRef<THREE.Quaternion | null>(null);
  
  // Store the previous position to calculate direction
  const prevPositionRef = useRef<Vector3>({ ...spaceshipPosition });
  const directionRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 1));
  
  // Place camera behind spaceship immediately on component mount
  useEffect(() => {
    // Initial camera positioning (only once on mount)
    if (spaceshipPosition && camera) {
      // Set camera position behind spaceship
      camera.position.set(
        spaceshipPosition.x,
        spaceshipPosition.y, // Slightly above
        spaceshipPosition.z + 15 // Behind
      );
      
      // Make camera look at spaceship
      camera.lookAt(
        spaceshipPosition.x,
        spaceshipPosition.y,
        spaceshipPosition.z
      );
    }
  }, []);
  
  useFrame((state, delta) => {
    if (!isTransitioning) return;
    
    // Get controls
    const controls = controlsRef.current;
    
    // Initialize start position and rotation if not set
    if (!startPosRef.current && transitionProgress === 0) {
      // Store initial camera position and rotation
      startPosRef.current = camera.position.clone();
      startQuatRef.current = camera.quaternion.clone();
      
      // Disable controls during transition
      if (controls) {
        controls.enabled = false;
      }
      
      // Initialize direction based on movement if available, otherwise use z-axis
      if (prevPositionRef.current.x !== spaceshipPosition.x ||
          prevPositionRef.current.y !== spaceshipPosition.y ||
          prevPositionRef.current.z !== spaceshipPosition.z) {
        directionRef.current.set(
          spaceshipPosition.x - prevPositionRef.current.x,
          spaceshipPosition.y - prevPositionRef.current.y,
          spaceshipPosition.z - prevPositionRef.current.z
        ).normalize();
      }
      prevPositionRef.current = { ...spaceshipPosition };
    }
    
    // Use our stored start position
    const startPos = startPosRef.current || camera.position;
    
    // Calculate offset position based on direction of travel
    const offset = {
      x: -directionRef.current.x * 15,
      y: 0, // Directly behind, no vertical offset
      z: -directionRef.current.z * 15
    };
    
    // Calculate target position (behind and above the spaceship in direction of travel)
    const targetPosition = new THREE.Vector3(
      spaceshipPosition.x + offset.x,
      spaceshipPosition.y + offset.y,
      spaceshipPosition.z + offset.z
    );
    
    // Calculate target rotation (looking at spaceship)
    const lookTarget = new THREE.Vector3(
      spaceshipPosition.x,
      spaceshipPosition.y,
      spaceshipPosition.z
    );
    
    // Create a matrix to look at the target
    const lookMatrix = new THREE.Matrix4();
    lookMatrix.lookAt(targetPosition, lookTarget, new THREE.Vector3(0, 1, 0));
    const targetRotation = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);
    
    // Duration of transition in seconds
    const transitionDuration = 3;
    
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
      
      // Reset references for next transition
      startPosRef.current = null;
      startQuatRef.current = null;
    }
  });
  
  // Make sure to re-enable controls if component unmounts during transition
  useEffect(() => {
    // Capture the current value of controlsRef.current inside the effect
    const controls = controlsRef.current;
    
    return () => {
      if (isTransitioning && controls) {
        controls.enabled = true;
      }
    };
  }, [isTransitioning, controlsRef]);
  
  return null;
}

// Camera follow component that continuously updates in the render loop
function CameraFollowSpaceship({
  isActive,
  spaceshipPosition,
  controlsRef,
}: {
  isActive: boolean;
  spaceshipPosition: Vector3;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>;
}) {
  const { camera } = useThree();
  
  // Store the previous position to calculate direction
  const prevPositionRef = useRef<Vector3>({ ...spaceshipPosition });
  // Direction vector
  const directionRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 1));
  
  useFrame(() => {
    if (!isActive || !controlsRef.current) return;
    
    // Calculate direction of travel
    if (
      prevPositionRef.current.x !== spaceshipPosition.x ||
      prevPositionRef.current.y !== spaceshipPosition.y ||
      prevPositionRef.current.z !== spaceshipPosition.z
    ) {
      // Only calculate direction if the ship is actually moving
      const moveDistance = Math.sqrt(
        Math.pow(spaceshipPosition.x - prevPositionRef.current.x, 2) +
        Math.pow(spaceshipPosition.y - prevPositionRef.current.y, 2) +
        Math.pow(spaceshipPosition.z - prevPositionRef.current.z, 2)
      );
      
      if (moveDistance > 0.01) {
        const newDirection = new THREE.Vector3(
          spaceshipPosition.x - prevPositionRef.current.x,
          spaceshipPosition.y - prevPositionRef.current.y,
          spaceshipPosition.z - prevPositionRef.current.z
        ).normalize();
        
        // Smoothly interpolate direction change to avoid sudden camera jumps
        directionRef.current.lerp(newDirection, 0.1);
      }
      
      // Update previous position
      prevPositionRef.current = { ...spaceshipPosition };
    }
    
    // Capture controls
    const controls = controlsRef.current;
    
    // Disable controls while in follow mode
    controls.enabled = false;
    
    // Calculate offset position based on direction of travel
    // We'll position the camera 15 units directly behind the spaceship
    const offset = {
      x: -directionRef.current.x * 15,
      y: 0, // Directly behind, no vertical offset
      z: -directionRef.current.z * 15
    };
    
    camera.position.set(
      spaceshipPosition.x + offset.x,
      spaceshipPosition.y + offset.y,
      spaceshipPosition.z + offset.z
    );
    
    // Make camera look at spaceship
    const target = new THREE.Vector3(
      spaceshipPosition.x,
      spaceshipPosition.y,
      spaceshipPosition.z
    );
    camera.lookAt(target);
  });
  
  // Re-enable controls when component unmounts
  useEffect(() => {
    // Capture the current value of controlsRef.current inside the effect
    const controls = controlsRef.current;
    
    return () => {
      if (controls) {
        controls.enabled = true;
      }
    };
  }, [controlsRef]);
  
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
  const [position, setPosition] = useState<Position>({ x: 0, y: 0, z: 0 });
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetInfo | null>(null);
  const [rotationSpeed] = useState(0.2); // Base rotation speed
  const [spaceshipStatus, setSpaceshipStatus] = useState<SpaceshipStatus | null>(null);
  const [spaceshipPosition, setSpaceshipPosition] = useState<Vector3>({ x: 0, y: 0, z: 0 });
  const [followSpaceship, setFollowSpaceship] = useState(true); // Follow spaceship by default
  const [isTransitioning, setIsTransitioning] = useState(false); // Track if camera is moving to spaceship
  const [transitionProgress, setTransitionProgress] = useState(0); // Progress of transition animation (0-1)
  const [isLoading, setIsLoading] = useState(true); // Track if initial state is loaded
  const [isFullyInitialized, setIsFullyInitialized] = useState(false); // Track if camera is positioned
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  
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
      // Disable followSpaceship and transitions when any movement key is pressed
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
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
      const controls = controlsRef.current;
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
      // Record start time to ensure minimum loading screen duration
      const startTime = Date.now();
      
      try {
        setIsLoading(true);
        const initialState = await spaceshipState.getState();
        console.log('Initial state:', initialState);
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
          
          // Update spaceshipPosition for camera tracking
          setSpaceshipPosition({
            x: initialState.position[0],
            y: initialState.position[1],
            z: initialState.position[2]
          });
          
          // Also manually update the position for nav display
          // Set position to be 15 units behind the spaceship in Z direction
          setPosition({
            x: initialState.position[0],
            y: initialState.position[1],
            z: initialState.position[2] - 15
          });
          
          // Calculate how long we've been loading
          const elapsedTime = Date.now() - startTime;
          // Ensure loading screen shows for at least 1000ms (1 seconds)
          const remainingTime = Math.max(0, 1000 - elapsedTime);
          
          // First hide the loading screen after minimum time
          setTimeout(() => {
            setIsLoading(false);
            
            // Wait a bit to ensure camera is positioned before starting position tracking
            setTimeout(() => {
              setIsFullyInitialized(true);
            }, 500);
          }, remainingTime);
        } else {
          // Calculate minimum loading time
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, 1000 - elapsedTime);
          
          setTimeout(() => {
            setIsLoading(false);
            setTimeout(() => {
              setIsFullyInitialized(true);
            }, 500);
          }, remainingTime);
        }
      } catch (error) {
        console.error('Error fetching initial spaceship state:', error);
        
        // Calculate minimum loading time
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);
        
        setTimeout(() => {
          setIsLoading(false);
          setTimeout(() => {
            setIsFullyInitialized(true);
          }, 500);
        }, remainingTime);
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
    // Log position updates
    if (Math.random() < 0.05) {
      console.log('🚀 SPUTNIK GameContainer: Updated position:', newPosition);
    }
  };

  // Toggle follow spaceship mode
  const handleFollowSpaceship = () => {
    if (followSpaceship) {
      // If already following, just turn it off
      setFollowSpaceship(false);
      return;
    }
    
    // Start the transition
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

  // Effect to position camera behind spaceship immediately on first render
  useEffect(() => {
    // We need a brief timeout to ensure controls are initialized
    const timer = setTimeout(() => {
      // Set initial camera position behind Sputnik
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
      // Force transition to complete
      setIsTransitioning(true);
      setTransitionProgress(1);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  // Render loading state if still loading data
  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#131313',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        zIndex: 1000
      }}>
        <div style={{ marginBottom: '16px' }}>
          <Image 
            src="/logo.png" 
            alt="DARK Logo" 
            width={60} 
            height={30} 
            priority
          />
        </div>
        <h2 style={{ 
          color: '#63B3ED', 
          fontSize: '24px', 
          fontWeight: '600',
          margin: '0 0 16px 0'
        }}>
          SPUTNIK
        </h2>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            borderRadius: '50%', 
            background: '#63B3ED',
            margin: '0 12px 0 0',
            animation: 'pulse 1.5s infinite'
          }} />
          <p>Initializing navigation system...</p>
        </div>
        <style jsx>{`
          @keyframes pulse {
            0% {
              opacity: 0.2;
              transform: scale(0.95);
            }
            50% {
              opacity: 1;
              transform: scale(1.05);
            }
            100% {
              opacity: 0.2;
              transform: scale(0.95);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Canvas
        camera={{ 
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
          {isFullyInitialized && <CameraPositionTracker setPosition={setPosition} />}
          
          {/* Add the camera transition component */}
          <CameraTransition
            isTransitioning={isTransitioning}
            spaceshipPosition={spaceshipPosition}
            transitionProgress={transitionProgress}
            setTransitionProgress={setTransitionProgress}
            setIsTransitioning={setIsTransitioning}
            setFollowSpaceship={setFollowSpaceship}
            controlsRef={controlsRef}
            easeInOutCubic={easeInOutCubic}
          />
          
          <FlyControls
            ref={controlsRef}
            movementSpeed={flightSpeed}
            rollSpeed={rotationSpeed} // Base rotation speed
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
          
          {/* AI-controlled spaceship */}
          <Spaceship 
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
          
          {/* Camera follow component */}
          <CameraFollowSpaceship
            isActive={followSpaceship}
            spaceshipPosition={spaceshipPosition}
            controlsRef={controlsRef}
          />
        </Suspense>
      </Canvas>
      
      {/* UI Panels - only show when fully initialized */}
      {isFullyInitialized && <NavPanel position={position} />}
      <HelpPanel />
      <PlanetPanel selectedPlanet={selectedPlanet} onClose={handleClosePlanetPanel} />
      <SpaceshipPanel 
        status={spaceshipStatus} 
        onFollowSpaceship={handleFollowSpaceship} 
        isFollowing={followSpaceship}
        currentPosition={spaceshipPosition}
      />
      <LogoPanel />
    </>
  );
} 