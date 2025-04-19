'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { spaceshipState, SpaceshipStateData } from '@/lib/supabase';
import { useGLTF } from '@react-three/drei';

// Preload the model to improve initial load performance
useGLTF.preload('/models/spaceship.glb');

// Convert from array to THREE.Vector3
const arrayToVector3 = (arr: [number, number, number]): THREE.Vector3 => 
  new THREE.Vector3(arr[0], arr[1], arr[2]);

// Calculate distance between two points
const calculateDistance = (a: THREE.Vector3, b: THREE.Vector3): number => a.distanceTo(b);

type SpaceshipProps = {
  onPositionUpdate?: (position: THREE.Vector3) => void;
};

export default function Spaceship({ onPositionUpdate }: SpaceshipProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [supabaseState, setSupabaseState] = useState<SpaceshipStateData | null>(null);
  
  // Current position and destination
  const currentPosition = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const destination = useRef<THREE.Vector3 | null>(null);
  
  // Direction the spaceship is facing
  const directionRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 1));
  
  // Movement speed (units per second)
  // Calculated for a 15-minute journey from origin to destination:
  // Distance = sqrt(7342.8² + (-6994.2)² + 5638.3²) = 11601.55 units
  // Speed = Distance / (15 minutes * 60 seconds) = 11601.55 / 900 = 12.8906 units/sec
  const MOVEMENT_SPEED = 12.8906;
  const ARRIVAL_THRESHOLD = 1.0;
  
  // Load the GLB model
  const { scene } = useGLTF('/models/spaceship.glb');
  // Create a clone of the scene to avoid modifying the cached original
  const model = scene.clone();
  
  // Function to notify the server when we reach the destination
  const notifyArrival = async (id: string, position: [number, number, number]) => {
    try {
      console.log('🚀 SPUTNIK: Notifying arrival at position:', position);
      
      const response = await fetch('/api/spaceship/arrival', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          position
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to notify server of arrival:', errorText);
      } else {
        console.log('🚀 SPUTNIK: Successfully notified server of arrival');
        
        // Update local state immediately rather than waiting for subscription
        if (supabaseState) {
          setSupabaseState({
            ...supabaseState,
            position: position,
            destination: null,
            velocity: [0, 0, 0]
          });
        }
      }
    } catch (error) {
      console.error('Error notifying arrival:', error);
    }
  };
  
  // Load initial state and subscribe to updates from Supabase
  useEffect(() => {
    let isMounted = true;
    
    console.log('🚀 SPUTNIK: Initializing spaceship and setting up subscription');
    
    // Get initial state
    const loadInitialState = async () => {
      if (!isMounted) return;
      
      try {
        console.log('🚀 SPUTNIK: Fetching initial state from Supabase');
        const state = await spaceshipState.getState();
        
        if (state && isMounted) {
          console.log('🚀 SPUTNIK: Received initial state:', state);
          setSupabaseState(state);
          
          // Set current position
          currentPosition.current = arrayToVector3(state.position);
          
          // Set destination if one exists
          if (state.destination) {
            destination.current = arrayToVector3(state.destination);
          }
        }
      } catch (error) {
        console.error('🚀 SPUTNIK ERROR: Error loading initial spaceship state:', error);
      }
    };
    
    loadInitialState();
    
    // Subscribe to state changes
    console.log('🚀 SPUTNIK: Setting up Supabase real-time subscription');
    const subscription = spaceshipState.subscribeToState((state) => {
      console.log('🚀 SPUTNIK: Subscription callback received state update:', state);
      if (isMounted) {
        setSupabaseState(state);
        
        // Only update position if we're not already moving to a destination
        if (!destination.current) {
          currentPosition.current = arrayToVector3(state.position);
        }
        
        // If destination is set and we're not already moving somewhere
        if (state.destination && !destination.current) {
          destination.current = arrayToVector3(state.destination);
        }
        
        // If destination is cleared externally
        if (!state.destination && destination.current) {
          destination.current = null;
        }
      }
    });
    
    return () => {
      console.log('🚀 SPUTNIK: Cleaning up subscription');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  // Update movement and visuals each frame
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Update mesh position to current position
    groupRef.current.position.copy(currentPosition.current);
    
    // If we have a destination, move toward it
    if (destination.current) {
      // Log current status every 30 frames to avoid console flood
      if (Math.random() < 0.03) {
        console.log('🚀 MOVEMENT: Current position:', 
          [currentPosition.current.x, currentPosition.current.y, currentPosition.current.z]);
        console.log('🚀 MOVEMENT: Moving toward:', 
          [destination.current.x, destination.current.y, destination.current.z]);
      }
      
      // Calculate direction to destination
      const moveDirection = new THREE.Vector3()
        .subVectors(destination.current, currentPosition.current)
        .normalize();
      
      // Calculate movement distance this frame
      const moveDistance = MOVEMENT_SPEED * delta;
      
      // Calculate distance to destination
      const distanceToDestination = calculateDistance(
        currentPosition.current,
        destination.current
      );
      
      // Smoothly face the direction of travel
      directionRef.current.lerp(moveDirection, 0.1);
      groupRef.current.lookAt(
        currentPosition.current.clone().add(directionRef.current)
      );
      
      // Check if we've reached the destination
      if (distanceToDestination <= ARRIVAL_THRESHOLD) {
        // We've arrived! Stop movement
        currentPosition.current.copy(destination.current);
        
        // Mark as arrived in the database via the API
        if (supabaseState) {
          notifyArrival(
            supabaseState.id, 
            [
              currentPosition.current.x,
              currentPosition.current.y,
              currentPosition.current.z
            ]
          );
        }
        
        destination.current = null;
      } else {
        // Move toward destination
        const movementThisFrame = Math.min(moveDistance, distanceToDestination);
        const movement = moveDirection.multiplyScalar(movementThisFrame);
        currentPosition.current.add(movement);
      }
    }
    
    // Notify parent component of position update
    if (onPositionUpdate) {
      onPositionUpdate(currentPosition.current);
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* GLB model of the spaceship */}
      <primitive 
        object={model} 
        scale={[1, 1, 1]} // Adjust scale as needed for your model
        rotation={[0, Math.PI/2, 0]} // May need to adjust rotation based on model orientation
        castShadow
      />
      
      {/* Add a point light to make the ship more visible */}
      <pointLight position={[0, 1, 0]} intensity={0.5} color={0x88aaff} distance={10} />
    </group>
  );
} 