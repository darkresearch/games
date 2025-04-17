import { useMemo } from 'react';
import SimplePlanet, { PlanetType } from './SimplePlanet';
import * as THREE from 'three';

type PlanetarySystemProps = {
  planetCount?: number;
  universeRadius?: number;
};

// Size classes for planets
const SIZE_CLASSES = [
  5,    // Super tiny
  10,   // Tiny
  15,   // Very small
  20,   // Small
  30,   // Medium-small
  40,   // Medium
  50,   // Medium-large
  75,   // Large
  100,  // Very large
  150   // Super massive
];

// Planet types
const PLANET_TYPES: PlanetType[] = ['fire', 'water', 'earth', 'air'];

// Helper function to check if a position is too close to existing planets
const isTooClose = (
  position: [number, number, number], 
  existingPlanets: Array<{ position: [number, number, number], size: number }>, 
  minDistance: number
): boolean => {
  return existingPlanets.some(planet => {
    const dx = planet.position[0] - position[0];
    const dy = planet.position[1] - position[1];
    const dz = planet.position[2] - position[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return distance < (minDistance + planet.size);
  });
};

// Generate a random position within the universe radius
const getRandomPosition = (radius: number): [number, number, number] => [
  (Math.random() - 0.5) * radius * 2,
  (Math.random() - 0.5) * radius * 2,
  (Math.random() - 0.5) * radius * 2
];

export default function PlanetarySystem({ 
  planetCount = 100, 
  universeRadius = 10000 
}: PlanetarySystemProps) {
  // Generate planets
  const planets = useMemo(() => {
    const generatedPlanets: Array<{
      id: number;
      position: [number, number, number];
      size: number;
      type: PlanetType;
      rotationSpeed: number;
    }> = [];
    
    // Minimum distance between planets (scaled based on universe size)
    const MIN_DISTANCE = universeRadius * 0.02;
    const MAX_ATTEMPTS = 100;
    
    for (let i = 0; i < planetCount; i++) {
      // Select a random size class
      const size = SIZE_CLASSES[Math.floor(Math.random() * SIZE_CLASSES.length)];
      
      // Select a random planet type
      const type = PLANET_TYPES[Math.floor(Math.random() * PLANET_TYPES.length)];
      
      // Try to find a valid position
      let position: [number, number, number];
      let attempts = 0;
      
      do {
        position = getRandomPosition(universeRadius);
        attempts++;
        
        if (attempts > MAX_ATTEMPTS) {
          console.log(`Couldn't find ideal position for planet ${i} after ${MAX_ATTEMPTS} attempts`);
          break;
        }
      } while (isTooClose(position, generatedPlanets, MIN_DISTANCE));
      
      // Add the planet to our collection
      generatedPlanets.push({
        id: i,
        position,
        size,
        type,
        rotationSpeed: 0.001 + Math.random() * 0.01 // Random rotation speed
      });
    }
    
    return generatedPlanets;
  }, [planetCount, universeRadius]);
  
  return (
    <group>

      {/* Render all planets */}
      {planets.map(planet => (
        <SimplePlanet 
          key={planet.id}
          position={planet.position}
          size={planet.size}
          type={planet.type}
          rotationSpeed={planet.rotationSpeed}
        />
      ))}
    </group>
  );
} 
