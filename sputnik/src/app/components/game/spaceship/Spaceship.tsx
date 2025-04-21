'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { spaceshipState, SpaceshipStateData } from '@/lib/supabase';
import { useGLTF } from '@react-three/drei';
import { io, Socket } from 'socket.io-client';

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
  // We still need state for UI, but won't use realtime subscriptions
  const [supabaseState, setSupabaseState] = useState<SpaceshipStateData | null>(null);
  
  // Current position and destination reference
  const currentPosition = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const destination = useRef<THREE.Vector3 | null>(null);
  
  // Direction the spaceship is facing
  const directionRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 1));
  const socketRef = useRef<Socket | null>(null);
  
  // Load the GLB model
  const { scene } = useGLTF('/models/spaceship.glb');
  // Create a clone of the scene to avoid modifying the cached original
  const model = scene.clone();
  
  // Load initial state from Supabase (once only, no realtime subscription)
  useEffect(() => {
    let isMounted = true;
    
    console.log('🚀 SPUTNIK: Fetching initial state (no realtime subscription)');
    
    // Get initial state
    const loadInitialState = async () => {
      if (!isMounted) return;
      
      try {
        console.log('🚀 SPUTNIK: Fetching initial state from Supabase');
        const state = await spaceshipState.getState();
        
        if (state && isMounted) {
          console.log('🚀 SPUTNIK: Received initial state:', state);
          setSupabaseState(state);
          
          // Set current position as fallback before Socket.io connects
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
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Initialize Socket.io connection
  useEffect(() => {
    let isMounted = true;
    console.log('🚀 SPUTNIK: Initializing Socket.io connection (separate effect)');
    
    // Only create a connection if we don't already have one
    if (!socketRef.current) {
      try {
        console.log('🚀 SPUTNIK: Creating new Socket.io connection');
        
        // Configure with optimal settings
        const socket = io({
          // Force polling which is more reliable in development
          transports: ['polling'],
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          timeout: 20000
        });
        
        socketRef.current = socket;
        
        // Listen for position updates
        socket.on('spaceship:position', (position: Vector3Position) => {
          if (isMounted) {
            // Update our position from the server
            currentPosition.current.set(position.x, position.y, position.z);
            
            // Notify parent component
            if (onPositionUpdate) {
              onPositionUpdate(currentPosition.current);
            }
            
            // Log occasionally
            if (Math.random() < 0.002) {
              console.log('🚀 SPUTNIK SOCKET: Position update received');
            }
          }
        });
        
        socket.on('connect', () => {
          console.log('🚀 SPUTNIK SOCKET: Connected to server with ID:', socket.id);
        });
        
        socket.on('disconnect', (reason) => {
          console.log('🚀 SPUTNIK SOCKET: Disconnected from server:', reason);
        });
        
        socket.on('connect_error', (error) => {
          console.error('🚀 SPUTNIK SOCKET CONNECTION ERROR:', error.message);
        });
      } catch (error) {
        console.error('🚀 SPUTNIK ERROR: Failed to connect to Socket.io:', error);
      }
    }
    
    // Clean up function
    return () => {
      console.log('🚀 SPUTNIK: Cleaning up Socket.io connection');
      isMounted = false;
      
      if (socketRef.current) {
        // Remove all listeners before disconnecting
        socketRef.current.off('spaceship:position');
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        
        // Close connection
        socketRef.current.disconnect();
        socketRef.current = null;
        console.log('🚀 SPUTNIK: Socket.io connection closed and reference cleared');
      }
    };
  }, []); // Empty dependency array - this effect runs once
  
  // Update visuals each frame
  useFrame(() => {
    if (!groupRef.current) return;
    
    // Update mesh position to current position
    groupRef.current.position.copy(currentPosition.current);
    
    // If we have a destination, update ship orientation
    if (destination.current) {
      // Calculate direction to destination
      const moveDirection = new THREE.Vector3()
        .subVectors(destination.current, currentPosition.current)
        .normalize();
      
      // Smoothly face the direction of travel
      directionRef.current.lerp(moveDirection, 0.1);
      groupRef.current.lookAt(
        currentPosition.current.clone().add(directionRef.current)
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