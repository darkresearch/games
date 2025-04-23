import { useRef, useMemo, useState, useEffect } from 'react';
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
        color: 0xffffff, 
        emissive: 0xff3300,
        emissiveIntensity: 5.0, // Increased even more
        emissiveMap: textures.lava, // Use texture for emission pattern
        roughness: 0.3,
        metalness: 0.6,
        map: textures.lava,
        displacementMap: textures.lava, // Add displacement for lava effect
        displacementScale: 0.2, // Small displacement for lava bubbles
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
// const createCloudMaterial = (type: PlanetType, cloudTexture: THREE.Texture) => {
//   // Cloud colors that complement each planet type
//   const cloudColors = {
//     fire: 0xff8855,
//     water: 0xaaddff,
//     earth: 0xccffdd,
//     air: 0xeeeeff,
//     jupiter: 0xddbb99,
//     wif: 0xddaaee
//   };
  
//   return new THREE.MeshStandardMaterial({
//     color: cloudColors[type],
//     map: cloudTexture,
//     alphaMap: cloudTexture,
//     transparent: true,
//     opacity: 0.8,
//     depthWrite: false,  // Prevents z-fighting with the planet surface
//   });
// };

// Create a glowing outline material
const createGlowMaterial = (type: PlanetType) => {
  const glowColors = {
    fire: new THREE.Color(0xff5500).multiplyScalar(3), // Super bright
    water: 0x0088ff,
    earth: 0x55aa77,
    air: 0xaabbff,
    jupiter: 0xffaa44,
    wif: 0xcc77ee
  };
  
  return new THREE.MeshBasicMaterial({
    color: glowColors[type],
    transparent: true,
    opacity: type === 'fire' ? 0.7 : 0,
    side: THREE.BackSide,
    blending: type === 'fire' ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
};

// Lava particles class
class LavaParticles {
  particles: THREE.Points;
  particleCount: number;
  particleSystem: THREE.BufferGeometry;
  positions: Float32Array;
  velocities: Float32Array;
  lifetimes: Float32Array;
  maxLifetimes: Float32Array;
  sizes: Float32Array;
  colors: Float32Array;
  planetSize: number;
  smallParticles: THREE.Points | null = null;

  constructor(planetSize: number) {
    this.planetSize = planetSize;
    this.particleCount = 800; // Increased from 300
    
    // Create geometry
    this.particleSystem = new THREE.BufferGeometry();
    
    // Create arrays for attributes
    this.positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.lifetimes = new Float32Array(this.particleCount);
    this.maxLifetimes = new Float32Array(this.particleCount);
    this.sizes = new Float32Array(this.particleCount);
    this.colors = new Float32Array(this.particleCount * 3); // RGB colors
    
    // Initialize particles
    for (let i = 0; i < this.particleCount; i++) {
      this.initParticle(i);
    }
    
    // Add attributes to geometry
    this.particleSystem.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.particleSystem.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    this.particleSystem.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    
    // Create material with custom vertex and fragment shaders for higher quality
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pointTexture: { value: this.createParticleTexture() }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        
        void main() {
          gl_FragColor = vec4(vColor, 1.0) * texture2D(pointTexture, gl_PointCoord);
          
          // Apply soft edge fadeout
          float dist = length(gl_PointCoord - vec2(0.5, 0.5));
          gl_FragColor.a *= smoothstep(0.5, 0.3, dist);
          
          // Enhance brightness at the center
          gl_FragColor.rgb *= 1.0 + 0.5 * (1.0 - dist * 2.0);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    });
    
    // Create points
    this.particles = new THREE.Points(this.particleSystem, particleMaterial);
    
    // Create a secondary system for smaller particles (background embers)
    this.createSmallParticles();
  }

  createSmallParticles() {
    const smallParticleCount = 400;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(smallParticleCount * 3);
    const sizes = new Float32Array(smallParticleCount);
    const colors = new Float32Array(smallParticleCount * 3);
    
    for (let i = 0; i < smallParticleCount; i++) {
      // Generate random position in a smaller sphere around the planet
      const radius = this.planetSize * (1.2 + Math.random() * 0.8); // Reduced from (1.5 + Math.random() * 2.0)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Smaller sizes for background particles
      sizes[i] = this.planetSize * 0.01 * (0.5 + Math.random() * 0.5);
      
      // Ember colors: from bright yellow to deep red
      const t = Math.random();
      colors[i * 3] = 1.0;  // R: always high
      colors[i * 3 + 1] = 0.3 + t * 0.5;  // G: medium to high
      colors[i * 3 + 2] = 0.05 + t * 0.1;  // B: low
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: this.planetSize * 0.02,
      map: this.createParticleTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });
    
    this.smallParticles = new THREE.Points(geometry, material);
  }

  createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; // Increased from 32 for higher resolution
    canvas.height = 128;
    
    const context = canvas.getContext('2d');
    if (!context) return new THREE.Texture();
    
    // Create a more detailed particle texture
    // First clear the canvas with transparency
    context.clearRect(0, 0, 128, 128);
    
    // Draw a soft, detailed circular gradient
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,220,100,0.9)');
    gradient.addColorStop(0.4, 'rgba(255,105,25,0.8)');
    gradient.addColorStop(0.6, 'rgba(200,40,20,0.5)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    
    // Add some noise/detail to the particle for realism
    context.globalCompositeOperation = 'overlay';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 128;
      const y = Math.random() * 128;
      const radius = 2 + Math.random() * 5;
      
      const gradientDetail = context.createRadialGradient(x, y, 0, x, y, radius);
      gradientDetail.addColorStop(0, 'rgba(255,255,255,0.3)');
      gradientDetail.addColorStop(1, 'rgba(255,255,255,0)');
      
      context.fillStyle = gradientDetail;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  initParticle(index: number) {
    // Generate more realistic starting positions - concentrate near lava cracks/hotspots
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    // Slightly randomize the radius to create a layer of particles just above surface
    const radius = this.planetSize * (1 + Math.random() * 0.05);
    
    // Convert to Cartesian coordinates
    this.positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
    this.positions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    this.positions[index * 3 + 2] = radius * Math.cos(phi);
    
    // More dynamic velocities with reduced speed
    // Base velocity (direction away from planet center)
    const speed = 0.005 + Math.random() * 0.02; // Reduced from (0.01 + Math.random() * 0.04)
    this.velocities[index * 3] = this.positions[index * 3] * speed;
    this.velocities[index * 3 + 1] = this.positions[index * 3 + 1] * speed + 0.005; // Reduced upward bias
    this.velocities[index * 3 + 2] = this.positions[index * 3 + 2] * speed;
    
    // Add some random variation to create swirling effect (reduced)
    this.velocities[index * 3] += (Math.random() - 0.5) * 0.005;
    this.velocities[index * 3 + 1] += (Math.random() - 0.5) * 0.005;
    this.velocities[index * 3 + 2] += (Math.random() - 0.5) * 0.005;
    
    // Shorter lifetimes so particles don't travel as far
    this.maxLifetimes[index] = 1.0 + Math.random() * 2.0; // Reduced from (1.5 + Math.random() * 3.5)
    this.lifetimes[index] = Math.random() * this.maxLifetimes[index] * 0.8;
    
    // Size variation based on velocity (faster particles are larger)
    const speedFactor = Math.sqrt(
      this.velocities[index * 3] ** 2 + 
      this.velocities[index * 3 + 1] ** 2 + 
      this.velocities[index * 3 + 2] ** 2
    ) * 10;
    this.sizes[index] = (0.4 + Math.random() * 0.6 + speedFactor) * this.planetSize * 0.06;
    
    // Color variation - from white/yellow at start to deep red/orange
    // Create a natural color gradient for lava particles
    const temperatureFactor = Math.random(); // 0 = cooler, 1 = hotter
    // Hotter particles are more yellow/white, cooler particles are more red
    this.colors[index * 3] = 1.0; // Red always high
    this.colors[index * 3 + 1] = 0.3 + temperatureFactor * 0.7; // Green varies (yellow component)
    this.colors[index * 3 + 2] = temperatureFactor * 0.5; // Blue lowest (a bit of blue for the hottest particles)
  }

  update(deltaTime: number, elapsedTime: number) {
    const positions = this.particleSystem.attributes.position.array as Float32Array;
    const sizes = this.particleSystem.attributes.size.array as Float32Array;
    const colors = this.particleSystem.attributes.color.array as Float32Array;
    
    // Update material time uniform for shader animations
    if (this.particles.material instanceof THREE.ShaderMaterial) {
      this.particles.material.uniforms.time.value = elapsedTime;
    }
    
    // Add some global motion to small particles
    if (this.smallParticles) {
      this.smallParticles.rotation.y += deltaTime * 0.05;
      this.smallParticles.position.y = Math.sin(elapsedTime * 0.2) * this.planetSize * 0.05;
    }
    
    for (let i = 0; i < this.particleCount; i++) {
      // Update lifetime
      this.lifetimes[i] += deltaTime;
      
      if (this.lifetimes[i] >= this.maxLifetimes[i]) {
        // Reset particle
        this.initParticle(i);
        this.lifetimes[i] = 0;
      } else {
        // Calculate life percentage
        const lifeRatio = this.lifetimes[i] / this.maxLifetimes[i];
        
        // Apply physics - add a "gravity" effect to make particles arc
        this.velocities[i * 3 + 1] -= 0.003 * deltaTime; // Slight downward acceleration over time
        
        // Add some noise/turbulence to velocity for more natural movement
        const turbulence = 0.001;
        this.velocities[i * 3] += (Math.random() - 0.5) * turbulence;
        this.velocities[i * 3 + 1] += (Math.random() - 0.5) * turbulence;
        this.velocities[i * 3 + 2] += (Math.random() - 0.5) * turbulence;
        
        // Update position with velocity
        positions[i * 3] += this.velocities[i * 3] * deltaTime;
        positions[i * 3 + 1] += this.velocities[i * 3 + 1] * deltaTime;
        positions[i * 3 + 2] += this.velocities[i * 3 + 2] * deltaTime;
        
        // Size fades out over lifetime with a more natural curve
        sizes[i] = this.sizes[i] * (1 - Math.pow(lifeRatio, 2));
        
        // Color changes over lifetime (cooling effect)
        // Particles get more red and less yellow as they age
        colors[i * 3] = 1.0; // Red channel stays strong
        colors[i * 3 + 1] = Math.max(0.1, colors[i * 3 + 1] - 0.01 * deltaTime); // Green decreases
        colors[i * 3 + 2] = Math.max(0.0, colors[i * 3 + 2] - 0.01 * deltaTime); // Blue decreases
      }
    }
    
    this.particleSystem.attributes.position.needsUpdate = true;
    this.particleSystem.attributes.size.needsUpdate = true;
    this.particleSystem.attributes.color.needsUpdate = true;
  }

  getMesh() {
    return this.particles;
  }
  
  getSmallParticlesMesh() {
    return this.smallParticles || new THREE.Object3D(); // Return empty object if smallParticles is null
  }
}

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
  const pointLightRef = useRef<THREE.PointLight>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const [glowPulse, setGlowPulse] = useState(0);
  const [time, setTime] = useState(0);
  const lavaParticlesRef = useRef<LavaParticles | null>(null);
  
  // Load textures
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    
    // Load planet surface textures
    const lavaTexture = loader.load('/images/planets/lava-texture.jpg');
    const waterTexture = loader.load('/images/planets/water-texture.jpg');
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
  
  // Handle click on planet
  const handleClick = (event: React.MouseEvent) => {
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
  
  // Initialize the particle system
  useEffect(() => {
    if (type === 'fire') {
      lavaParticlesRef.current = new LavaParticles(size);
    }
  }, [size, type]);
  
  // Rotation and glow animation
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const deltaTime = Math.min(0.1, clock.getDelta()); // Clamped delta time
    
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed;
      
      // For fire planets, animate the texture and displacement
      if (type === 'fire' && material.current instanceof THREE.MeshStandardMaterial) {
        // Animate texture offset for lava flow effect
        if (material.current.map) {
          material.current.map.offset.x = Math.sin(elapsed * 0.1) * 0.05;
          material.current.map.offset.y = Math.cos(elapsed * 0.05) * 0.05;
        }
        
        // Animate displacement scale for bubbling effect
        material.current.displacementScale = 0.1 + Math.sin(elapsed * 2) * 0.05;
      }
      
      // Rotate glow with the planet
      if (glowRef.current) {
        glowRef.current.rotation.y = meshRef.current.rotation.y;
        
        // Add pulsing effect for fire planets
        if (type === 'fire') {
          const pulse = Math.sin(elapsed * 2) * 0.2 + 0.9;
          
          // Apply the pulse to the glow scale
          glowRef.current.scale.set(1 + pulse * 0.2, 1 + pulse * 0.2, 1 + pulse * 0.2);
          
          // Also pulse the opacity
          if (glowRef.current.material instanceof THREE.MeshBasicMaterial) {
            glowRef.current.material.opacity = 0.8 * pulse;
          }
          
          // Pulse the point light intensity
          if (pointLightRef.current) {
            pointLightRef.current.intensity = 3 + pulse * 2;
            
            // Move light slightly for flickering effect
            pointLightRef.current.position.set(
              Math.sin(elapsed * 5) * size * 0.1,
              Math.cos(elapsed * 4) * size * 0.1,
              Math.sin(elapsed * 6) * size * 0.1
            );
          }
        }
      }
    }
    
    // Update particle system
    if (type === 'fire' && lavaParticlesRef.current) {
      lavaParticlesRef.current.update(deltaTime, elapsed);
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
        <sphereGeometry args={[size, 64, 64]} />
        <primitive object={material.current} attach="material" />
      </mesh>
      
      {/* Glow effect - only for non-fire planets */}
      {type !== 'fire' && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[size * 1.5, 32, 32]} />
          <primitive object={glowMaterial.current} attach="material" />
        </mesh>
      )}
      
      {/* Point light for fire planets */}
      {type === 'fire' && (
        <>
          <pointLight
            ref={pointLightRef}
            color={0xff4400}
            intensity={4}
            distance={size * 25}
            decay={1.5}
          />
          {/* Secondary smaller lights for more dramatic effect */}
          <pointLight
            color={0xff8800}
            intensity={2}
            distance={size * 10}
            position={[size * 0.8, 0, 0]}
          />
          <pointLight
            color={0xff2200}
            intensity={2}
            distance={size * 10}
            position={[-size * 0.7, size * 0.3, 0]}
          />
        </>
      )}
      
      {/* Lava particle system */}
      {type === 'fire' && lavaParticlesRef.current && (
        <>
          <primitive object={lavaParticlesRef.current.getMesh()} />
          <primitive object={lavaParticlesRef.current.getSmallParticlesMesh()} />
        </>
      )}
    </group>
  );
} 

{/* <mesh ref={cloudRef}> */}
  // <sphereGeometry args={[size * 1.05, 24, 24]} /> {/* Slightly larger than planet */}
  // <primitive object={cloudMaterial.current} attach="material" />
// </mesh>