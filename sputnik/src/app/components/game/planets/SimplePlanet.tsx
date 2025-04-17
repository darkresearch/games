import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Planet types
export type PlanetType = 'fire' | 'water' | 'earth' | 'air';

export type PlanetInfo = {
  id: number;
  position: [number, number, number];
  size: number;
  type: PlanetType;
};

type SimplePlanetProps = {
  position: [number, number, number];
  size: number;
  type: PlanetType;
  rotationSpeed?: number;
  id: number;
  onPlanetClick: (info: PlanetInfo) => void;
};

// Materials for each planet type with enhanced visibility at distance
const createPlanetMaterial = (type: PlanetType) => {
  switch (type) {
    case 'fire':
      return new THREE.MeshStandardMaterial({ 
        color: 0xff5500, 
        emissive: 0xff2200,
        emissiveIntensity: 1.2,
        roughness: 0.7,
        metalness: 0.3,
      });
    
    case 'water':
      return new THREE.MeshStandardMaterial({ 
        color: 0x0066ff, 
        emissive: 0x0044aa,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.9
      });
    
    case 'earth':
      return new THREE.MeshStandardMaterial({ 
        color: 0x338855, 
        emissive: 0x225533,
        emissiveIntensity: 0.6,
        roughness: 0.8,
        metalness: 0.2
      });
    
    case 'air':
      return new THREE.MeshStandardMaterial({ 
        color: 0xddddff, 
        emissive: 0xccccff,
        emissiveIntensity: 0.9,
        roughness: 0.3,
        metalness: 0.3,
        transparent: true,
        opacity: 0.8
      });
      
    default:
      return new THREE.MeshStandardMaterial({ color: 0xffffff });
  }
};

// Create a glowing outline material
const createGlowMaterial = (type: PlanetType) => {
  const glowColors = {
    fire: 0xff4400,
    water: 0x0088ff,
    earth: 0x55aa77,
    air: 0xaabbff
  };
  
  return new THREE.MeshBasicMaterial({
    color: glowColors[type],
    transparent: true,
    opacity: 0.5,
    side: THREE.BackSide
  });
};

export default function SimplePlanet({ 
  position, 
  size, 
  type, 
  rotationSpeed = 0.005,
  id,
  onPlanetClick
}: SimplePlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  // Create the material for this planet type
  const material = useRef(createPlanetMaterial(type));
  const glowMaterial = useRef(createGlowMaterial(type));
  
  // Handle click on planet
  const handleClick = (event: any) => {
    event.stopPropagation();
    const info: PlanetInfo = {
      id,
      position,
      size,
      type
    };
    onPlanetClick(info);
  };
  
  // Rotation animation
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed;
      
      // Rotate glow with the planet
      if (glowRef.current) {
        glowRef.current.rotation.y = meshRef.current.rotation.y;
      }
    }
  });

  return (
    <group position={position}>
      {/* Main planet */}
      <mesh 
        ref={meshRef} 
        castShadow 
        receiveShadow
        onClick={handleClick}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <primitive object={material.current} attach="material" />
      </mesh>
      
      {/* Glow effect */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 1.2, 16, 16]} />
        <primitive object={glowMaterial.current} attach="material" />
      </mesh>
    </group>
  );
} 