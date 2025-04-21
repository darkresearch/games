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
  const [, setSupabaseState] = useState<SpaceshipStateData | null>(null);
  
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
        
        // If destination is set or cleared, update our reference
        if (state.destination && !destination.current) {
          destination.current = arrayToVector3(state.destination);
        } else if (!state.destination && destination.current) {
          destination.current = null;
        }
      }
    });
    
    // Initialize Socket.io connection
    try {
      console.log('🚀 SPUTNIK: Setting up Socket.io connection');
      // Only create a connection if we don't already have one
      if (!socketRef.current) {
        const socket = io({
          // Start with polling first, then try to upgrade to WebSocket
          transports: ['polling', 'websocket'],
          forceNew: true,
          // Prevent multiple reconnection attempts
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          // Longer timeout to prevent quick disconnects
          timeout: 10000
        });
        socketRef.current = socket;
        
        // Listen for position updates
        socket.on('spaceship:position', (position: Vector3Position) => {
          if (isMounted) {
            // Update our position from the server
            currentPosition.current.set(position.x, position.y, position.z);
            
            // Log occasionally
            if (Math.random() < 0.01) {
              console.log('🚀 SPUTNIK SOCKET: Position update:', position);
            }
            
            // Notify parent component
            if (onPositionUpdate) {
              onPositionUpdate(currentPosition.current);
            }
          }
        });
        
        socket.on('connect', () => {
          console.log('🚀 SPUTNIK SOCKET: Connected to server with ID:', socket.id, 'using transport:', socket.io.engine.transport.name);
          
          // Add safer event listener that works with TypeScript
          if (socket.io && socket.io.engine) {
            // @ts-expect-error - The engine type definitions are incomplete
            socket.io.engine.on('upgrade', (transport: any) => {
              console.log('🚀 SPUTNIK SOCKET: Transport upgraded to', transport.name);
            });
          }
        });
        
        socket.on('disconnect', (reason) => {
          console.log('🚀 SPUTNIK SOCKET: Disconnected from server:', reason);
        });
        
        socket.on('connect_error', (error) => {
          console.error('🚀 SPUTNIK SOCKET CONNECTION ERROR:', error.message);
        });
        
        socket.on('error', (error: Error) => {
          console.error('🚀 SPUTNIK SOCKET ERROR:', error);
        });
      }
    } catch (error) {
      console.error('🚀 SPUTNIK ERROR: Failed to connect to Socket.io:', error);
    }
    
    return () => {
      console.log('🚀 SPUTNIK: Cleaning up subscription and socket');
      isMounted = false;
      subscription.unsubscribe();
      
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [onPositionUpdate]);
  
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