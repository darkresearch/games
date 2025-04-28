'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useState, useEffect, useRef, useContext } from 'react';
import { FlyControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import StarField from './assets/StarField';
import PlanetarySystem from './planets/PlanetarySystem';
import { PlanetInfo } from './planets/SimplePlanet';
import Sputniks from './spaceship/Sputniks';
import { Vector3 } from './spaceship/PhysicsSystem';
import NavPanel from './panels/nav';
import HelpPanel from './panels/help';
import PlanetPanel from './panels/planet';
import SpaceshipPanel from './panels/spaceship';
import ChatPanel from './panels/chat';
import Image from 'next/image';
import * as THREE from 'three';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/app/components/auth';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { getPanelBaseStyles, mergeStyles, panelStyles, touchFriendlyStyles } from '@/lib/styles/responsive';
import React from 'react';

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
  setIsFullyInitialized,
  controlsRef,
  easeInOutCubic,
  userSputnikUuid
}: {
  isTransitioning: boolean;
  spaceshipPosition: Vector3;
  transitionProgress: number;
  setTransitionProgress: (progress: number) => void;
  setIsTransitioning: (transitioning: boolean) => void;
  setFollowSpaceship: (following: boolean) => void;
  setIsFullyInitialized: (initialized: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>;
  easeInOutCubic: (t: number) => number;
  userSputnikUuid: string;
}) {
  // Get reference to camera and scene
  const { camera, scene } = useThree();
  // Store the initial camera position and rotation when transition starts
  const startPosRef = useRef<THREE.Vector3 | null>(null);
  const startQuatRef = useRef<THREE.Quaternion | null>(null);

  // Default direction if we can't get actual thruster direction
  const defaultDirection = new THREE.Vector3(0, 0, -1);
  
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
    }
    
    // Use our stored start position
    const startPos = startPosRef.current || camera.position;
    
    // Find the spaceship in the scene to get its thruster direction
    const spaceship = scene.getObjectByName(`Spaceship-${userSputnikUuid}`);
    let thrusterDirection = defaultDirection;
    
    if (spaceship) {
      // @ts-expect-error - Access the custom property we added
      if (spaceship.thrusterDirection) {
        // @ts-expect-error - Access the custom property we added
        thrusterDirection = spaceship.thrusterDirection;
      }
    }
    
    // Distance behind the thrusters
    const cameraDistance = 15;
    
    // Calculate target position directly behind thrusters
    const targetPosition = new THREE.Vector3(
      spaceshipPosition.x + (thrusterDirection.x * cameraDistance),
      spaceshipPosition.y + (thrusterDirection.y * cameraDistance),
      spaceshipPosition.z + (thrusterDirection.z * cameraDistance)
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
      setIsFullyInitialized(true);
      
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
  userSputnikUuid
}: {
  isActive: boolean;
  spaceshipPosition: Vector3;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>;
  userSputnikUuid: string;
}) {
  const { camera, scene } = useThree();
  
  // Default direction if we can't get actual thruster direction
  const defaultDirection = new THREE.Vector3(0, 0, -1);
  
  useFrame(() => {
    if (!isActive || !controlsRef.current) return;
    
    // Disable controls while in follow mode
    controlsRef.current.enabled = false;
    
    // Find the spaceship in the scene to get its thruster direction
    const spaceship = scene.getObjectByName(`Spaceship-${userSputnikUuid}`);
    let thrusterDirection = defaultDirection;
    
    if (spaceship) {
      // @ts-expect-error - Access the custom property we added
      if (spaceship.thrusterDirection) {
        // @ts-expect-error - Access the custom property we added
        thrusterDirection = spaceship.thrusterDirection;
      }
    }
    
    // Distance behind the thrusters
    const cameraDistance = 15;
    
    // Position camera directly behind thrusters
    const cameraPosition = new THREE.Vector3(
      spaceshipPosition.x + (thrusterDirection.x * cameraDistance),
      spaceshipPosition.y + (thrusterDirection.y * cameraDistance),
      spaceshipPosition.z + (thrusterDirection.z * cameraDistance)
    );
    
    // Update camera position
    camera.position.copy(cameraPosition);
    
    // Make camera look at spaceship
    camera.lookAt(
      spaceshipPosition.x,
      spaceshipPosition.y,
      spaceshipPosition.z
    );
  });
  
  // Re-enable controls when component unmounts
  useEffect(() => {
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
function LogoPanel({ followSpaceship, handleFollowSpaceship }: { 
  followSpaceship: boolean; 
  handleFollowSpaceship: () => void;
}) {
  const { user, signOut } = useAuth();
  const [showButtons, setShowButtons] = useState(false);
  const isMobile = useIsMobile();
  
  // Choose style variant based on device
  const variant = isMobile ? 'mobile' : 'desktop';
  
  // Get responsive styles
  const containerStyles = mergeStyles(
    panelStyles.logo[variant]
  );
  
  // Adjust button styles for mobile
  const buttonStyle = {
    px: '2',
    py: '1',
    bg: followSpaceship ? '#1E3A8A' : '#131313',
    borderColor: followSpaceship ? 'blue.500' : 'gray.700',
    color: 'white',
    fontSize: isMobile ? '12px' : 'xs',
    whiteSpace: 'nowrap',
    rounded: 'md',
    hover: followSpaceship ? 'bg-blue-800' : 'bg-gray-800',
    transition: 'colors',
    textAlign: 'center',
    border: '1px solid',
    shadow: 'md',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 0 10px rgba(0,0,0,0.3)',
  };
  
  return (
    <div style={containerStyles} className="flex flex-col gap-2">
      {/* Profile picture that toggles buttons visibility */}
      <div 
        className="cursor-pointer hover:opacity-80 transition-opacity self-start"
        onClick={() => setShowButtons(!showButtons)}
        style={isMobile ? { padding: '4px' } : {}}
      >
        {user?.user_metadata?.avatar_url ? (
          <Image 
            src={user.user_metadata.avatar_url} 
            alt={user.user_metadata.name || 'User'} 
            width={isMobile ? 36 : 40} 
            height={isMobile ? 36 : 40} 
            className="rounded-full"
            priority
          />
        ) : (
          <Image 
            src="/logo.png" 
            alt="DARK Logo" 
            width={isMobile ? 36 : 40} 
            height={isMobile ? 18 : 20} 
            priority
          />
        )}
      </div>
      
      {/* Buttons that slide down */}
      <div 
        className={`flex flex-col gap-2 overflow-hidden transition-all duration-300 ease-in-out ${
          showButtons ? 'max-h-[120px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {/* Follow SPUTNIK Button */}
        <button 
          onClick={() => {
            handleFollowSpaceship();
            setShowButtons(false);
          }}
          className={`px-2 py-1 text-white text-xs whitespace-nowrap rounded-md transition-colors text-center border shadow-md ${
            followSpaceship 
              ? 'bg-[#1E3A8A] border-blue-500 hover:bg-blue-800' 
              : 'bg-[#131313] border-gray-700 hover:bg-gray-800'
          }`}
          style={mergeStyles(
            {
              backdropFilter: 'blur(10px)',
              boxShadow: '0 0 10px rgba(0,0,0,0.3)',
              fontSize: isMobile ? '12px' : 'inherit',
              minHeight: isMobile ? '44px' : 'auto',
            },
            isMobile ? touchFriendlyStyles : {}
          )}
        >
          {followSpaceship ? '👁️ Following' : 'Follow SPUTNIK'}
        </button>
        
        {/* Sign Out Button */}
        <button 
          onClick={signOut}
          className="px-2 py-1 bg-[#131313] text-white text-xs whitespace-nowrap rounded-md hover:bg-red-600 transition-colors text-center border border-gray-700 shadow-md"
          style={mergeStyles(
            {
              backdropFilter: 'blur(10px)',
              boxShadow: '0 0 10px rgba(0,0,0,0.3)',
              fontSize: isMobile ? '12px' : 'inherit',
              minHeight: isMobile ? '44px' : 'auto',
            },
            isMobile ? touchFriendlyStyles : {}
          )}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function GameContainer() {
  const [flightSpeed, setFlightSpeed] = useState(200);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0, z: 0 });
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetInfo | null>(null);
  const [rotationSpeed] = useState(0.2); // Base rotation speed
  const [spaceshipPosition, setSpaceshipPosition] = useState<Vector3>({ x: 0, y: 0, z: 0 });
  const [followSpaceship, setFollowSpaceship] = useState(true); // Follow spaceship by default
  const [isTransitioning, setIsTransitioning] = useState(false); // Track if camera is moving to spaceship
  const [transitionProgress, setTransitionProgress] = useState(0); // Progress of transition animation (0-1)
  const [isLoading, setIsLoading] = useState(true); // Track if initial state is loaded
  const [isFullyInitialized, setIsFullyInitialized] = useState(false); // Track if camera is positioned
  const [currentFuel, setCurrentFuel] = useState(100); // Track fuel level
  const { userSputnikUuid } = useAuth();
  // No fallback - the UUID must come from authentication
  const sputnikUuid = userSputnikUuid || "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  
  // Track which arrow keys are pressed and when they were pressed
  const keyStates = useRef({
    ArrowUp: { pressed: false, startTime: 0 },
    ArrowDown: { pressed: false, startTime: 0 },
    ArrowLeft: { pressed: false, startTime: 0 },
    ArrowRight: { pressed: false, startTime: 0 }
  });
  
  // Import the useIsMobile hook at the top of the component
  const isMobile = useIsMobile();
  
  // Handle speed control with keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Commenting out movement controls temporarily
      /*
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
      */
      
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
      // Commenting out movement controls temporarily
      /*
      // Reset arrow key state
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        keyStates.current[e.code as keyof typeof keyStates.current] = {
          pressed: false,
          startTime: 0
        };
      }
      */
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
          // Commenting out movement controls temporarily
          /*
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
          */
          
          // Call the original update method
          originalUpdate.call(controls, delta);
        };
      }
    }
  }, []); // No dependencies required as we only want to run this once
  
  // Handle spaceship position updates
  const handleSpaceshipPositionUpdate = (newPosition: Vector3) => {
    setSpaceshipPosition(newPosition);
    // Log position updates
    // if (Math.random() < 0.05) {
    //   console.log('🚀 SPUTNIK GameContainer: Updated position:', newPosition);
    // }
  };

  // Handle spaceship fuel updates
  const handleSpaceshipFuelUpdate = (newFuelLevel: number) => {
    setCurrentFuel(newFuelLevel);
    // Log fuel updates occasionally
    // if (Math.random() < 0.05) {
    //   console.log('🚀 SPUTNIK GameContainer: Updated fuel level:', newFuelLevel);
    // }
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
        controlsRef.current.enabled = false; // Disable controls 
      }
      // Force transition to complete
      setIsTransitioning(true);
      setTransitionProgress(1);
      
      // Ensure loading states are set correctly after brief delay
      const loadTimer = setTimeout(() => {
        setIsLoading(false);
        setIsFullyInitialized(true);
      }, 1000);
      
      return () => clearTimeout(loadTimer);
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

  // Adjust camera FOV and far plane based on device type
  const cameraFOV = isMobile ? 60 : 45; // Wider FOV on mobile for better visibility
  const cameraFar = 100000; // Far clipping plane

  return (
    <>
      <Canvas
        camera={{ 
          fov: cameraFOV,
          far: cameraFar, 
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
            setIsFullyInitialized={setIsFullyInitialized}
            controlsRef={controlsRef}
            easeInOutCubic={easeInOutCubic}
            userSputnikUuid={sputnikUuid}
          />
          
          {/* Control sensitivity based on device type */}
          <FlyControls
            ref={controlsRef}
            movementSpeed={0} // Set to 0 to disable movement
            rollSpeed={0} // Set to 0 to disable rotation
            dragToLook={true}
            autoForward={false}
          />
          
          {/* Star field with stars */}
          <StarField count={isMobile ? 15000 : 25000} radius={20000} />
          
          {/* Planetary system */}
          <PlanetarySystem 
            planetCount={69} 
            universeRadius={10000} 
            onPlanetClick={handlePlanetClick}
          />
          
          {/* AI-controlled spaceships */}
          <Sputniks 
            onUserSputnikPositionUpdate={handleSpaceshipPositionUpdate}
            onUserSputnikFuelUpdate={handleSpaceshipFuelUpdate}
            userSputnikUuid={sputnikUuid}
          />
          
          {/* Add post-processing effects - reduce on mobile for performance */}
          <EffectComposer>
            <Bloom 
              intensity={isMobile ? 0.6 : 0.8}
              luminanceThreshold={0.1}
              luminanceSmoothing={0.9}
            />
          </EffectComposer>
          
          {/* Camera follow component */}
          <CameraFollowSpaceship
            isActive={followSpaceship}
            spaceshipPosition={spaceshipPosition}
            controlsRef={controlsRef}
            userSputnikUuid={sputnikUuid}
          />
        </Suspense>
      </Canvas>
      
      {/* UI Panels - only show when fully initialized */}
      {isFullyInitialized && <NavPanel position={position} spaceshipPosition={spaceshipPosition} currentFuel={currentFuel} />}
      {/* <HelpPanel /> */}
      <PlanetPanel selectedPlanet={selectedPlanet} onClose={handleClosePlanetPanel} />
      <LogoPanel followSpaceship={followSpaceship} handleFollowSpaceship={handleFollowSpaceship} />
      <ChatPanel />
    </>
  );
} 