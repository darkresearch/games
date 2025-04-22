'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';
import { PhysicsSystem } from './PhysicsSystem';

// Vector3 type for socket communication
type Vector3Position = {
  x: number;
  y: number;
  z: number;
};

// Preload the model to improve initial load performance
useGLTF.preload('/models/spaceship.glb');

// Convert from array to THREE.Vector3
const arrayToVector3 = (arr: [number, number, number]): THREE.Vector3 => 
  new THREE.Vector3(arr[0], arr[1], arr[2]);

type SpaceshipProps = {
  onPositionUpdate?: (position: THREE.Vector3) => void;
};

export default function Spaceship({ onPositionUpdate }: SpaceshipProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Current position and destination reference
  const currentPosition = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const destination = useRef<THREE.Vector3 | null>(null);
  
  // Add physics system for smooth interpolation
  const physicsSystem = useRef(new PhysicsSystem(
    { x: 0, y: 0, z: 0 },  // Initial position
    { x: 0, y: 0, z: 0 },  // Initial velocity
    2000,                  // Max speed
    0.1                    // Interpolation factor
  ));
  
  // Direction the spaceship is facing
  const directionRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 1));
  const socketRef = useRef<Socket | null>(null);
  
  // Load the GLB model
  const { scene } = useGLTF('/models/spaceship.glb');
  // Create a clone of the scene to avoid modifying the cached original
  const model = scene.clone();
  
  // Initialize Socket.io connection
  useEffect(() => {
    let isMounted = true;
    console.log('🚀 SPUTNIK: Setting up event listeners');
    
    // Use the shared socket instance
    const socket = getSocket();
    socketRef.current = socket;
    
    // Listen for position updates
    socket.on('spaceship:position', (position: Vector3Position) => {
      if (isMounted) {
        // Update the physics system target position for smooth interpolation
        physicsSystem.current.setPosition(position);
        
        // Keep original update for compatibility
        currentPosition.current.set(position.x, position.y, position.z);
        
        // Log occasionally
        if (Math.random() < 0.002) {
          console.log('🚀 SPUTNIK SOCKET: Position update received');
        }
      }
    });
    
    // Listen for state updates to get destination
    socket.on('spaceship:state', (state: any) => {
      if (isMounted) {
        // Update destination if provided
        if (state.destination) {
          destination.current = new THREE.Vector3(
            state.destination[0],
            state.destination[1],
            state.destination[2]
          );
        } else {
          destination.current = null;
        }
        
        // Update velocity in physics system if provided
        if (state.velocity) {
          physicsSystem.current.setVelocity({
            x: state.velocity[0],
            y: state.velocity[1],
            z: state.velocity[2]
          });
        }
      }
    });
    
    // Clean up function
    return () => {
      console.log('🚀 SPUTNIK: Removing event listeners');
      isMounted = false;
      
      if (socketRef.current) {
        // Remove just our component's listeners without disconnecting the shared socket
        socket.off('spaceship:position');
        socket.off('spaceship:state');
        socketRef.current = null;
      }
    };
  }, [onPositionUpdate]);
  
  // Update visuals each frame
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Update the physics simulation to interpolate position
    physicsSystem.current.update(delta);
    
    // Get the interpolated position
    const interpolatedPosition = physicsSystem.current.position;
    
    // Update mesh position to interpolated position
    groupRef.current.position.set(
      interpolatedPosition.x,
      interpolatedPosition.y,
      interpolatedPosition.z
    );
    
    // Notify parent component with the interpolated position
    // This will make camera follow the smooth visual position
    if (onPositionUpdate) {
      const interpolatedThreeVector = new THREE.Vector3(
        interpolatedPosition.x,
        interpolatedPosition.y, 
        interpolatedPosition.z
      );
      onPositionUpdate(interpolatedThreeVector);
    }
    
    // If we have a destination, update ship orientation
    if (destination.current) {
      // Calculate direction to destination using interpolated position
      const moveDirection = new THREE.Vector3()
        .subVectors(destination.current, new THREE.Vector3(
          interpolatedPosition.x,
          interpolatedPosition.y,
          interpolatedPosition.z
        ))
        .normalize();
      
      // Smoothly face the direction of travel
      directionRef.current.lerp(moveDirection, 0.1);
      groupRef.current.lookAt(
        new THREE.Vector3(
          interpolatedPosition.x,
          interpolatedPosition.y,
          interpolatedPosition.z
        ).add(directionRef.current)
      );
    }
    
    // Expose the orientation as a property on the group for external access
    if (groupRef.current) {
      // Add a backward vector property that points directly from the thruster
      // Since the model is rotated [0, Math.PI/2, 0], we need to account for this
      // The thruster direction is opposite to the facing direction
      const thrusterDirection = directionRef.current.clone().multiplyScalar(-1);
      // @ts-expect-error - Adding custom property
      groupRef.current.thrusterDirection = thrusterDirection;
    }
  });
  
  return (
    <group ref={groupRef} name="Spaceship">
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