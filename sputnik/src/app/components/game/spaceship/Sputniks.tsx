'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { Socket } from 'socket.io-client';
import { getSocket } from '@/lib/socket';
import { PhysicsSystem } from './PhysicsSystem';
import { Vector3Position, SputnikData, SectorSubscriptionState } from '@/types';
import { 
  positionToSector, 
  getSectorId, 
  getSectorIdFromPosition,
  getVisibleSectorsFromPosition, 
  hasCrossedSectorBoundary 
} from '@/lib/sectorUtils';

// Preload the model to improve initial load performance
useGLTF.preload('/models/spaceship.glb');

// Convert from array to THREE.Vector3
const arrayToVector3 = (arr: [number, number, number]): THREE.Vector3 => 
  new THREE.Vector3(arr[0], arr[1], arr[2]);

type SputniksProps = {
  onUserSputnikPositionUpdate?: (position: THREE.Vector3) => void;
  onUserSputnikFuelUpdate?: (fuel: number) => void;
  userSputnikUuid?: string;
};

export default function Sputniks({ 
  onUserSputnikPositionUpdate, 
  onUserSputnikFuelUpdate,
  userSputnikUuid: propUserSputnikUuid
}: SputniksProps) {
  const [activeSputniks, setActiveSputniks] = useState<string[]>([]);
  const [sputnikStates, setSputnikStates] = useState<Record<string, SputnikData>>({});
  const [sectorState, setSectorState] = useState<SectorSubscriptionState>({
    currentSector: '',
    visibleSectors: [],
    subscribedSectors: []
  });
  
  const socketRef = useRef<Socket | null>(null);
  const physicsSystemsRef = useRef<Record<string, PhysicsSystem>>({});
  const directionsRef = useRef<Record<string, THREE.Vector3>>({});
  
  // Use the UUID from props with no fallback
  const userSputnikUuid = propUserSputnikUuid || '';
  
  // Load the GLB model
  const { scene } = useGLTF('/models/spaceship.glb');
  
  // Calculate visible sputniks based on sector
  const visibleSputniks = useMemo(() => {
    if (!sectorState.visibleSectors.length) return activeSputniks;
    
    return activeSputniks.filter(uuid => {
      const sputnik = sputnikStates[uuid];
      // Always include user's own sputnik
      if (uuid === userSputnikUuid) return true;
      // Filter by sector if available
      if (sputnik && sputnik.sector) {
        return sectorState.visibleSectors.includes(sputnik.sector);
      }
      // Default to visible if no sector info yet
      return true;
    });
  }, [activeSputniks, sputnikStates, sectorState.visibleSectors, userSputnikUuid]);
  
  // Function to manage sector subscriptions
  const manageSectorSubscriptions = (position: Vector3Position) => {
    const newSectorId = getSectorIdFromPosition(position);
    const newVisibleSectors = getVisibleSectorsFromPosition(position);
    
    // If sector hasn't changed, do nothing
    if (newSectorId === sectorState.currentSector) return;
    
    // Calculate sectors to subscribe and unsubscribe
    const sectorsToSubscribe = newVisibleSectors.filter(
      sector => !sectorState.subscribedSectors.includes(sector)
    );
    const sectorsToUnsubscribe = sectorState.subscribedSectors.filter(
      sector => !newVisibleSectors.includes(sector)
    );
    
    // Update socket subscriptions
    const socket = socketRef.current;
    if (socket) {
      // Subscribe to new sectors
      sectorsToSubscribe.forEach(sector => {
        socket.emit('sector:subscribe', sector);
      });
      
      // Unsubscribe from sectors no longer visible
      sectorsToUnsubscribe.forEach(sector => {
        socket.emit('sector:unsubscribe', sector);
      });
    }
    
    // Update sector state
    setSectorState({
      currentSector: newSectorId,
      visibleSectors: newVisibleSectors,
      subscribedSectors: [
        ...sectorState.subscribedSectors.filter(s => !sectorsToUnsubscribe.includes(s)),
        ...sectorsToSubscribe
      ]
    });
    
    console.log(`🚀 SPUTNIKS: Changed sector to ${newSectorId}, visible: ${newVisibleSectors.length}`);
  };
  
  // Initialize Socket.io connection and fetch active sputniks
  useEffect(() => {
    let isMounted = true;
    console.log('🚀 SPUTNIKS: Setting up event listeners');
    
    // Use the shared socket instance with the user's UUID
    const socket = getSocket(userSputnikUuid);
    socketRef.current = socket;
    
    // Listen for sector-specific active sputniks broadcasts
    socket.on('sector:spaceships', (sectorId: string, sputnikUuids: string[]) => {
      if (isMounted) {
        console.log(`🚀 SPUTNIKS: Sector ${sectorId} has ${sputnikUuids.length} sputniks`);
        
        // Add these sputniks to our active list
        setActiveSputniks(prevActive => {
          const combined = Array.from(new Set([...prevActive, ...sputnikUuids]));
          return combined;
        });
        
        // Initialize systems for any new sputniks
        sputnikUuids.forEach(uuid => {
          if (physicsSystemsRef.current[uuid]) return;
          
          physicsSystemsRef.current[uuid] = new PhysicsSystem(
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: 0 },
            2000,
            0.1
          );
          directionsRef.current[uuid] = new THREE.Vector3(0, 0, 1);
          
          // Initialize state with sector info
          setSputnikStates(prev => ({
            ...prev,
            [uuid]: {
              uuid,
              position: { x: 0, y: 0, z: 0 },
              destination: null,
              velocity: null,
              fuel: 100,
              sector: sectorId
            }
          }));
        });
      }
    });
    
    // Listen for when sputniks leave visible sectors
    socket.on('sector:sputnik:leave', (sectorId: string, uuid: string) => {
      if (isMounted && uuid !== userSputnikUuid) {
        // Remove from active sputniks if not in any visible sector
        setActiveSputniks(prevActive => prevActive.filter(id => id !== uuid));
        
        // Clean up resources
        if (physicsSystemsRef.current[uuid]) {
          delete physicsSystemsRef.current[uuid];
        }
        if (directionsRef.current[uuid]) {
          delete directionsRef.current[uuid];
        }
        
        setSputnikStates(prev => {
          const newState = {...prev};
          delete newState[uuid];
          return newState;
        });
      }
    });
    
    // Clean up function
    return () => {
      console.log('🚀 SPUTNIKS: Removing event listeners');
      isMounted = false;
      
      if (socketRef.current) {
        // Remove listeners
        socket.off('sector:spaceships');
        socket.off('sector:sputnik:leave');
        
        // Unsubscribe from all sectors
        sectorState.subscribedSectors.forEach(sector => {
          socket.emit('sector:unsubscribe', sector);
        });
        
        socketRef.current = null;
      }
    };
  }, [userSputnikUuid, sectorState.subscribedSectors]);
  
  // Set up listeners for sputnik state and position updates
  useEffect(() => {
    if (activeSputniks.length === 0) return;
    
    let isMounted = true;
    const socket = getSocket(userSputnikUuid);
    
    activeSputniks.forEach(uuid => {
      // Listen for position updates
      socket.on(`spaceship:${uuid}:position`, (position: Vector3Position) => {
        if (isMounted) {
          // Calculate sector for this position
          const sectorId = getSectorIdFromPosition(position);
          
          // Update the physics system target position for smooth interpolation
          if (physicsSystemsRef.current[uuid]) {
            physicsSystemsRef.current[uuid].setPosition(position);
          }
          
          // Update state with new position and sector
          setSputnikStates(prev => {
            const sputnik = prev[uuid];
            if (!sputnik) return prev;
            
            // Check if the sputnik crossed a sector boundary
            const sectorChanged = sputnik.sector !== sectorId;
            
            return {
              ...prev,
              [uuid]: {
                ...sputnik,
                position,
                sector: sectorId
              }
            };
          });
          
          // If this is the user's sputnik, manage sector subscriptions
          if (uuid === userSputnikUuid) {
            manageSectorSubscriptions(position);
          }
        }
      });
      
      // Listen for state updates
      socket.on(`spaceship:${uuid}:state`, (state: any) => {
        if (isMounted) {
          setSputnikStates(prev => {
            const sputnik = prev[uuid];
            if (!sputnik) return prev;
            
            return {
              ...prev,
              [uuid]: {
                ...sputnik,
                destination: state.destination,
                velocity: state.velocity,
                fuel: state.fuel !== undefined ? state.fuel : sputnik.fuel
              }
            };
          });
          
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
  
  // When user's sputnik first loads or the UUID changes, subscribe to the initial sector
  useEffect(() => {
    if (!userSputnikUuid) return;
    
    // Get the socket
    const socket = socketRef.current;
    if (!socket) return;
    
    // Request current position for the user's sputnik
    socket.emit('getSpaceshipPosition', { uuid: userSputnikUuid });
    
    // Listen for the response
    socket.once(`spaceship:${userSputnikUuid}:position`, (position: Vector3Position) => {
      // When we get the position, immediately subscribe to the sectors
      manageSectorSubscriptions(position);
    });
    
  }, [userSputnikUuid]);
  
  // Update visuals each frame
  useFrame((state, delta) => {
    // Update each sputnik's position
    visibleSputniks.forEach(uuid => {
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
  
  // Display statistics in development
  useEffect(() => {
    const interval = setInterval(() => {
      console.log(`🚀 SPUTNIK STATS: Active=${activeSputniks.length}, Visible=${visibleSputniks.length}, Sectors=${sectorState.visibleSectors.length}`);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeSputniks.length, visibleSputniks.length, sectorState.visibleSectors.length]);
  
  // Render only visible sputniks
  return (
    <>
      {visibleSputniks.map(uuid => {
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