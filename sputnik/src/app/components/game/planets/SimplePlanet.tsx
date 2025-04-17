import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Planet types
export type PlanetType = 'fire' | 'water' | 'earth' | 'air' | 'jupiter' | 'wif';

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
const createPlanetMaterial = (type: PlanetType, textures: Record<string, THREE.Texture>) => {
  switch (type) {
    case 'fire':
      return new THREE.MeshStandardMaterial({ 
        color: 0xffffff, // White base to show true texture color
        emissive: 0xff2200,
        emissiveIntensity: 0.3,
        roughness: 0.7,
        metalness: 0.3,
        map: textures.lava,
      });
    
    case 'water':
      return new THREE.MeshStandardMaterial({ 
        color: 0xffffff, // White base to show true texture color
        emissive: 0x0044aa,
        emissiveIntensity: 0.3,
        roughness: 0.2,
        metalness: 0.8,
        map: textures.water,
      });
    
    case 'earth':
      return new THREE.MeshStandardMaterial({ 
        color: 0xffffff, // White base to show true texture color
        emissive: 0x225533,
        emissiveIntensity: 0.3,
        roughness: 0.8,
        metalness: 0.2,
        map: textures.stone,
      });
    
    case 'air':
      return new THREE.MeshStandardMaterial({ 
        color: 0xffffff, // White base to show true texture color
        emissive: 0xccccff,
        emissiveIntensity: 0.3,
        roughness: 0.8,
        metalness: 0.3,
        map: textures.smoke,
      });
      
    case 'jupiter':
      return new THREE.MeshStandardMaterial({ 
        color: 0xffffff, // White base to show true texture color
        emissive: 0xbb5500,
        emissiveIntensity: 0.2,
        roughness: 0.5,
        metalness: 0.4,
        map: textures.jupiter,
      });
      
    case 'wif':
      return new THREE.MeshStandardMaterial({ 
        color: 0xffffff, // White base to show true texture color
        emissive: 0x7733aa,
        emissiveIntensity: 0.3,
        roughness: 0.6,
        metalness: 0.5,
        map: textures.wif,
      });
      
    default:
      return new THREE.MeshStandardMaterial({ color: 0xffffff });
  }
};

// Create a cloud material based on planet type
const createCloudMaterial = (type: PlanetType, cloudTexture: THREE.Texture) => {
  // Cloud colors that complement each planet type
  const cloudColors = {
    fire: 0xff8855,
    water: 0xaaddff,
    earth: 0xccffdd,
    air: 0xeeeeff,
    jupiter: 0xddbb99,
    wif: 0xddaaee
  };
  
  return new THREE.MeshStandardMaterial({
    color: cloudColors[type],
    map: cloudTexture,
    alphaMap: cloudTexture,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,  // Prevents z-fighting with the planet surface
  });
};

// Create a glowing outline material
const createGlowMaterial = (type: PlanetType) => {
  const glowColors = {
    fire: 0xff4400,
    water: 0x0088ff,
    earth: 0x55aa77,
    air: 0xaabbff,
    jupiter: 0xffaa44,
    wif: 0xcc77ee
  };
  
  return new THREE.MeshBasicMaterial({
    color: glowColors[type],
    transparent: true,
    opacity: 0,
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
  const cloudRef = useRef<THREE.Mesh>(null);
  
  // Load textures
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    
    // Load planet surface textures
    const lavaTexture = loader.load('/images/planets/lava-texture.jpg');
    const waterTexture = loader.load('/images/planets/water texture.jpg');
    const stoneTexture = loader.load('/images/planets/stone-texture.jpg');
    const smokeTexture = loader.load('/images/planets/smoke-texture.jpg');
    const jupiterTexture = loader.load('/images/planets/jupiter-texture.png');
    const wifTexture = loader.load('/images/planets/wif-texture.jpg');
    
    // Load cloud texture
    const cloudTexture = loader.load('/images/planets/cloud-texture.png');
    
    // Configure texture wrapping and repeating
    [lavaTexture, waterTexture, stoneTexture, smokeTexture, jupiterTexture, wifTexture, cloudTexture].forEach(texture => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    });
    
    return {
      lava: lavaTexture,
      water: waterTexture,
      stone: stoneTexture,
      smoke: smokeTexture,
      jupiter: jupiterTexture,
      wif: wifTexture,
      cloud: cloudTexture
    };
  }, []);
  
  // Create the material for this planet type
  const material = useRef(createPlanetMaterial(type, textures));
  const glowMaterial = useRef(createGlowMaterial(type));
  const cloudMaterial = useRef(createCloudMaterial(type, textures.cloud));
  
  // Handle click on planet
  const handleClick = (event: any) => {
    event.stopPropagation();
    const info: PlanetInfo = {
      id,
      position,
      size,
      type
    };
    console.log("Planet clicked:", info);
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
      
      // Rotate clouds slightly faster than the planet
      if (cloudRef.current) {
        cloudRef.current.rotation.y += rotationSpeed * 1.5;
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
      
      {/* Cloud layer */}
      
      
      {/* Glow effect */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 1.2, 16, 16]} />
        <primitive object={glowMaterial.current} attach="material" />
      </mesh>
    </group>
  );
} 

{/* <mesh ref={cloudRef}> */}
  // <sphereGeometry args={[size * 1.05, 24, 24]} /> {/* Slightly larger than planet */}
  // <primitive object={cloudMaterial.current} attach="material" />
// </mesh>