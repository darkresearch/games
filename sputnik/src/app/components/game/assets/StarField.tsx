import { useMemo, useRef } from 'react';
import * as THREE from 'three';

// Create a point material that will look like a star
const starMaterial = new THREE.PointsMaterial({
  size: 1,
  sizeAttenuation: true, // Important: this makes stars appear larger when closer
  color: 0xffffff,
  transparent: true,
  opacity: 1,
  blending: THREE.AdditiveBlending, // Gives a glowing effect
  vertexColors: true  // Allow different star colors
});

type StarFieldProps = {
  count?: number;
  radius?: number;
};

export const StarField = ({ 
  count = 10000, 
  radius = 1000
}: StarFieldProps) => {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate all star positions and colors once
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    // Star colors from blue to yellow/white
    const colorOptions = [
      new THREE.Color(0x9bb0ff), // Blue-ish
      new THREE.Color(0xaabfff), // Light blue
      new THREE.Color(0xcad7ff), // Very light blue
      new THREE.Color(0xe4e8ff), // Almost white (blue tinge)
      new THREE.Color(0xecf0ff), // Almost white
      new THREE.Color(0xfff4e8), // Almost white (yellow tinge)
      new THREE.Color(0xfff8e8), // Very light yellow
      new THREE.Color(0xfff8d0), // Light yellow
      new THREE.Color(0xfff4c0)  // Yellow-ish
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