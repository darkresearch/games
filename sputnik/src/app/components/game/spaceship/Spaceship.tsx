'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Vector3, PhysicsSystem } from './PhysicsSystem';
import { spaceshipAPI } from './api';
import { spaceshipState, SpaceshipStateData } from '@/lib/supabase';
import { useGLTF } from '@react-three/drei';

// Preload the model to improve initial load performance
useGLTF.preload('/models/spaceship.glb');

// Convert between PhysicsSystem Vector3 and THREE.Vector3
const toThreeVector = (v: Vector3): THREE.Vector3 => new THREE.Vector3(v.x, v.y, v.z);
// Uncomment if needed in the future
// const fromThreeVector = (v: THREE.Vector3): Vector3 => ({ x: v.x, y: v.y, z: v.z });

// Convert from array to Vector3
const arrayToVector3 = (arr: [number, number, number]): Vector3 => ({ 
  x: arr[0], 
  y: arr[1], 
  z: arr[2] 
});

type SpaceshipProps = {
  initialPosition?: Vector3;
  onPositionUpdate?: (position: Vector3) => void;
};

export default function Spaceship({ 
  initialPosition = { x: 0, y: 0, z: 0 },
  onPositionUpdate
}: SpaceshipProps) {
  const groupRef = useRef<THREE.Group>(null);
  const physicsRef = useRef<PhysicsSystem>(new PhysicsSystem(initialPosition));
  const lastUpdateTime = useRef<number>(Date.now());
  const [thrusterActive, setThrusterActive] = useState(false);
  const [supabaseState, setSupabaseState] = useState<SpaceshipStateData | null>(null);
  
  // Direction the spaceship is facing
  const directionRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 1));
  
  // Load the GLB model
  const { scene } = useGLTF('/models/spaceship.glb');
  // Create a clone of the scene to avoid modifying the cached original
  const model = scene.clone();
  
  // Load initial state and subscribe to updates from Supabase
  useEffect(() => {
    let isMounted = true;
    
    // Get initial state
    const loadInitialState = async () => {
      if (!isMounted) return;
      
      try {
        const state = await spaceshipState.getState();
        
        if (state && isMounted) {
          setSupabaseState(state);
          
          // Convert array format to Vector3 format
          const posVector = arrayToVector3(state.position);
          const velVector = arrayToVector3(state.velocity);
          
          // Update our physics system with the initial state
          physicsRef.current.setPosition(posVector);
          physicsRef.current.setVelocity(velVector);
          
          // Calculate direction from velocity if moving
          if (velVector.x !== 0 || velVector.y !== 0 || velVector.z !== 0) {
            directionRef.current.copy(toThreeVector(velVector).normalize());
          }
          
          // Update thruster visual effect
          const speed = Math.sqrt(
            velVector.x * velVector.x + 
            velVector.y * velVector.y + 
            velVector.z * velVector.z
          );
          setThrusterActive(speed > 10);
          
          lastUpdateTime.current = Date.now();
        }
      } catch (error) {
        console.error('Error loading initial spaceship state:', error);
      }
    };
    
    loadInitialState();
    
    // Subscribe to state changes
    const subscription = spaceshipState.subscribeToState((state) => {
      if (isMounted) {
        setSupabaseState(state);
        
        // Convert array format to Vector3 format
        const posVector = arrayToVector3(state.position);
        const velVector = arrayToVector3(state.velocity);
        
        // Update our physics system with the new state
        physicsRef.current.setPosition(posVector);
        physicsRef.current.setVelocity(velVector);
        
        // Calculate direction from velocity if moving
        if (velVector.x !== 0 || velVector.y !== 0 || velVector.z !== 0) {
          directionRef.current.copy(toThreeVector(velVector).normalize());
        }
        
        // Update thruster visual effect
        const speed = Math.sqrt(
          velVector.x * velVector.x + 
          velVector.y * velVector.y + 
          velVector.z * velVector.z
        );
        setThrusterActive(speed > 10);
        
        lastUpdateTime.current = Date.now();
      }
    });
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  // Fallback to our API polling if Supabase isn't set up or there's no state
  useEffect(() => {
    let isMounted = true;
    const pollInterval = 1000; // Poll every second as a fallback
    let timeoutId: NodeJS.Timeout;
    
    const pollBackend = async () => {
      if (!isMounted || supabaseState) return;
      
      try {
        const status = await spaceshipAPI.getStatus();
        
        if (status && isMounted) {
          // Update local physics state with data from API
          physicsRef.current.setPosition(status.position);
          physicsRef.current.setVelocity(status.velocity);
          
          // Calculate direction from velocity if moving
          if (status.velocity.x !== 0 || status.velocity.y !== 0 || status.velocity.z !== 0) {
            const velocity = toThreeVector(status.velocity).normalize();
            directionRef.current.copy(velocity);
          }
          
          // Update thruster visual effect
          const speed = physicsRef.current.getCurrentSpeed();
          setThrusterActive(speed > 10);
          
          lastUpdateTime.current = Date.now();
        }
      } catch (error) {
        console.error('Error polling spaceship status:', error);
      }
      
      // Continue polling if we still don't have Supabase data
      if (!supabaseState) {
        timeoutId = setTimeout(pollBackend, pollInterval);
      }
    };
    
    // Start polling if we don't have Supabase data
    if (!supabaseState) {
      pollBackend();
    }
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [supabaseState]);
  
  // Update physics and visuals each frame for smooth interpolation
  useFrame(() => {
    if (!groupRef.current) return;
    
    // Calculate delta time for physics update
    const now = Date.now();
    const deltaTime = (now - lastUpdateTime.current) / 1000; // Convert to seconds
    
    // Use physics system to interpolate movement between updates
    physicsRef.current.update(deltaTime);
    
    // Update mesh position
    const { position } = physicsRef.current;
    groupRef.current.position.set(position.x, position.y, position.z);
    
    // Update rotation to face direction of travel
    if (physicsRef.current.getCurrentSpeed() > 1) {
      const velocity = new THREE.Vector3(
        physicsRef.current.velocity.x,
        physicsRef.current.velocity.y,
        physicsRef.current.velocity.z
      ).normalize();
      
      // Smoothly rotate to align with velocity
      directionRef.current.lerp(velocity, 0.05);
      groupRef.current.lookAt(
        groupRef.current.position.clone().add(directionRef.current)
      );
    }
    
    // Notify parent component of position update
    if (onPositionUpdate) {
      onPositionUpdate(position);
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
      
      {/* Thruster effect (only visible when moving) */}
      {thrusterActive && (
        <mesh 
          position={[0, 0, -3]} // Adjust position based on your model's thruster location
          scale={[1, 1, 2]}
        >
          <coneGeometry args={[1, 2, 8]} />
          <meshBasicMaterial color={0x88aaff} transparent opacity={0.7} />
        </mesh>
      )}
      
      {/* Add a point light to make the ship more visible */}
      <pointLight position={[0, 1, 0]} intensity={0.5} color={0x88aaff} distance={10} />
    </group>
  );
} 