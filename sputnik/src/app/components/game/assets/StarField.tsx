import { useMemo, useRef } from 'react';
import * as THREE from 'three';

// Create a simple point material that will look like a star
const starMaterial = new THREE.PointsMaterial({
  size: 5,
  sizeAttenuation: true,
  color: 0xffffff,
  transparent: true,
  opacity: 0.5,
  blending: THREE.AdditiveBlending, // Gives a glowing effect
  vertexColors: true  // Allow different star colors
});

type StarFieldProps = {
  count?: number;
  radius?: number;
};

const StarField = ({ 
  count = 10000, 
  radius = 5000 
}: StarFieldProps) => {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate all star positions and colors once
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    // Star colors from blue to yellow/white with enhanced brightness
    const colorOptions = [
      new THREE.Color(0x9bb0ff).multiplyScalar(1.5), // Blue-ish
      new THREE.Color(0xaabfff).multiplyScalar(1.5), // Light blue
      new THREE.Color(0xcad7ff).multiplyScalar(1.5), // Very light blue
      new THREE.Color(0xe4e8ff).multiplyScalar(1.5), // Almost white (blue tinge)
      new THREE.Color(0xecf0ff).multiplyScalar(1.5), // Almost white
      new THREE.Color(0xfff4e8).multiplyScalar(1.5), // Almost white (yellow tinge)
      new THREE.Color(0xfff8e8).multiplyScalar(1.5), // Very light yellow
      new THREE.Color(0xfff8d0).multiplyScalar(1.5), // Light yellow
      new THREE.Color(0xfff4c0).multiplyScalar(1.5)  // Yellow-ish
    ];
    
    for (let i = 0; i < count; i++) {
      // Generate random positions in sphere
      const theta = Math.random() * Math.PI * 2; // Azimuthal angle (around equator)
      const phi = Math.acos((Math.random() * 2) - 1); // Polar angle (from pole)
      const distance = Math.cbrt(Math.random()) * radius; // Cubic distribution for more realistic density
      
      // Convert spherical to cartesian coordinates
      positions[i * 3] = distance * Math.sin(phi) * Math.cos(theta);     // x
      positions[i * 3 + 1] = distance * Math.sin(phi) * Math.sin(theta); // y
      positions[i * 3 + 2] = distance * Math.cos(phi);                   // z
      
      // Assign random colors from our palette
      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return { positions, colors };
  }, [count, radius]);

  // Create the buffer geometry
  const geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [positions, colors]);
  
  return (
    <points ref={pointsRef} geometry={geometry} material={starMaterial} />
  );
};

export default StarField; 