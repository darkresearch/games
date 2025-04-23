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

type SputnikData = {
  uuid: string;
  position: Vector3Position;
  destination: [number, number, number] | null;
  velocity: [number, number, number] | null;
  fuel: number;
};

type SputniksProps = {
  onUserSputnikPositionUpdate?: (position: THREE.Vector3) => void;
  onUserSputnikFuelUpdate?: (fuel: number) => void;
};

export default function Sputniks({ onUserSputnikPositionUpdate, onUserSputnikFuelUpdate }: SputniksProps) {
  const [activeSputniks, setActiveSputniks] = useState<string[]>([]);
  const [sputnikStates, setSputnikStates] = useState<Record<string, SputnikData>>({});
  const socketRef = useRef<Socket | null>(null);
  const physicsSystemsRef = useRef<Record<string, PhysicsSystem>>({});
  const directionsRef = useRef<Record<string, THREE.Vector3>>({});
  
  // User's sputnik UUID from environment variable
  const userSputnikUuid = process.env.NEXT_PUBLIC_SPUTNIK_UUID || '';
  
  // Load the GLB model
  const { scene } = useGLTF('/models/spaceship.glb');
  
  // Initialize Socket.io connection and fetch active sputniks
  useEffect(() => {
    let isMounted = true;
    console.log('🚀 SPUTNIKS: Setting up event listeners');
    
    // Use the shared socket instance
    const socket = getSocket();
    socketRef.current = socket;
    
    // Listen for active sputniks broadcasts
    socket.on('spaceships:active', (result: string[]) => {
      if (isMounted) {
        // console.log('🚀 SPUTNIKS: Active sputniks:', result);
        setActiveSputniks(result);
        
        // Initialize physics systems for each sputnik
        result.forEach(uuid => {
          // Skip if we already have a physics system for this UUID
          if (physicsSystemsRef.current[uuid]) return;
          
          physicsSystemsRef.current[uuid] = new PhysicsSystem(
            { x: 0, y: 0, z: 0 },  // Initial position
            { x: 0, y: 0, z: 0 },  // Initial velocity
            2000,                  // Max speed
            0.1                    // Interpolation factor
          );
          directionsRef.current[uuid] = new THREE.Vector3(0, 0, 1);
          
          // Initialize state
          setSputnikStates(prev => ({
            ...prev,
            [uuid]: {
              uuid,
              position: { x: 0, y: 0, z: 0 },
              destination: null,
              velocity: null,
              fuel: 100
            }
          }));
        });
      }
    });
    
    // Clean up function
    return () => {
      console.log('🚀 SPUTNIKS: Removing event listeners');
      isMounted = false;
      
      if (socketRef.current) {
        // Remove listeners
        socket.off('spaceships:active');
        // We don't need to disconnect the shared socket
        socketRef.current = null;
      }
    };
  }, []);
  
  // Set up listeners for sputnik state and position updates
  useEffect(() => {
    if (activeSputniks.length === 0) return;
    
    let isMounted = true;
    const socket = getSocket();
    
    activeSputniks.forEach(uuid => {
      // Listen for position updates
      socket.on(`spaceship:${uuid}:position`, (position: Vector3Position) => {
        if (isMounted) {
          // Update the physics system target position for smooth interpolation
          if (physicsSystemsRef.current[uuid]) {
            physicsSystemsRef.current[uuid].setPosition(position);
          }
          
          // Update state
          setSputnikStates(prev => ({
            ...prev,
            [uuid]: {
              ...prev[uuid],
              position
            }
          }));
          
          // Log occasionally
          if (Math.random() < 0.001) {
            console.log(`🚀 SPUTNIKS SOCKET: Position update received for ${uuid}`);
          }
        }
      });
      
      // Listen for state updates
      socket.on(`spaceship:${uuid}:state`, (state: any) => {
        if (isMounted) {
          setSputnikStates(prev => ({
            ...prev,
            [uuid]: {
              ...prev[uuid],
              destination: state.destination,
              velocity: state.velocity,
              fuel: state.fuel !== undefined ? state.fuel : prev[uuid]?.fuel
            }
          }));
          
          // Update velocity in physics system if provided
          if (state.velocity && physicsSystemsRef.current[uuid]) {
            physicsSystemsRef.current[uuid].setVelocity({
              x: state.velocity[0],
              y: state.velocity[1],
              z: state.velocity[2]
            });
          }
          
          // Pass fuel updates to parent component for user's sputnik
          if (uuid === userSputnikUuid && state.fuel !== undefined && onUserSputnikFuelUpdate) {
            onUserSputnikFuelUpdate(state.fuel);
          }
        }
      });
    });
    
    // Clean up function
    return () => {
      isMounted = false;
      
      activeSputniks.forEach(uuid => {
        socket.off(`spaceship:${uuid}:position`);
        socket.off(`spaceship:${uuid}:state`);
      });
    };
  }, [activeSputniks, onUserSputnikFuelUpdate, userSputnikUuid]);
  
  // Update visuals each frame
  useFrame((state, delta) => {
    // Update each sputnik's position
    activeSputniks.forEach(uuid => {
      const physicsSystem = physicsSystemsRef.current[uuid];
      if (!physicsSystem) return;
      
      // Update the physics simulation to interpolate position
      physicsSystem.update(delta);
      
      // Get the interpolated position
      const interpolatedPosition = physicsSystem.position;
      
      // If this is the user's sputnik, notify parent component with the interpolated position
      if (uuid === userSputnikUuid && onUserSputnikPositionUpdate) {
        const interpolatedThreeVector = new THREE.Vector3(
          interpolatedPosition.x,
          interpolatedPosition.y, 
          interpolatedPosition.z
        );
        onUserSputnikPositionUpdate(interpolatedThreeVector);
      }
    });
  });

//   console.log('🚀 SPUTNIKS: Active sputniks:', activeSputniks);
  
  // Render all sputniks
  return (
    <>
      {activeSputniks.map(uuid => {
        const physicsSystem = physicsSystemsRef.current[uuid];
        const direction = directionsRef.current[uuid];
        const sputnikData = sputnikStates[uuid];
        
        if (!physicsSystem || !direction || !sputnikData) return null;
        
        // Clone the model for each sputnik
        const model = scene.clone();
        
        // Get the interpolated position
        const interpolatedPosition = physicsSystem.position;
        
        // Calculate direction to destination
        let newDirection = direction.clone();
        if (sputnikData.destination) {
          newDirection = new THREE.Vector3()
            .subVectors(
              new THREE.Vector3(
                sputnikData.destination[0],
                sputnikData.destination[1],
                sputnikData.destination[2]
              ),
              new THREE.Vector3(
                interpolatedPosition.x,
                interpolatedPosition.y,
                interpolatedPosition.z
              )
            )
            .normalize();
          
          // Update direction ref
          directionsRef.current[uuid].lerp(newDirection, 0.1);
        }
        
        // Calculate thruster direction (opposite to facing direction)
        const thrusterDirection = directionsRef.current[uuid].clone().multiplyScalar(-1);
        
        return (
          <group 
            key={uuid}
            name={`Spaceship-${uuid}`}
            position={[interpolatedPosition.x, interpolatedPosition.y, interpolatedPosition.z]}
            // Look in the direction of travel
            lookAt={[
              interpolatedPosition.x + directionsRef.current[uuid].x,
              interpolatedPosition.y + directionsRef.current[uuid].y,
              interpolatedPosition.z + directionsRef.current[uuid].z
            ]}
            // @ts-expect-error - Adding custom property
            thrusterDirection={thrusterDirection}
          >
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
      })}
    </>
  );
} 