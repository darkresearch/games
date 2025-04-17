import { useMemo, useEffect, useState } from 'react';
import SimplePlanet, { PlanetType, PlanetInfo } from './SimplePlanet';
import * as THREE from 'three';
import { MapConfig, PlanetConfig } from './mapUtils';

type PlanetarySystemProps = {
  planetCount?: number;
  universeRadius?: number;
  onPlanetClick?: (planetInfo: PlanetInfo) => void;
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
  250,  // Very large
  500   // Super massive
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
  universeRadius = 10000,
  onPlanetClick
}: PlanetarySystemProps) {
  const [loadedPlanets, setLoadedPlanets] = useState<PlanetConfig[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Attempt to load existing map on component mount
  useEffect(() => {
    const loadMap = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/map');
        
        if (response.ok) {
          const mapConfig: MapConfig = await response.json();
          console.log('Loaded existing map configuration:', mapConfig);
          setLoadedPlanets(mapConfig.planets);
        } else {
          console.log('No existing map found, will generate a new one');
          setLoadedPlanets(null);
        }
      } catch (error) {
        console.error('Error loading map:', error);
        setLoadedPlanets(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadMap();
  }, []);

  // Save the generated map
  const saveMap = async (planets: PlanetConfig[]) => {
    try {
      const mapConfig: MapConfig = {
        planets,
        universeRadius
      };
      
      const response = await fetch('/api/map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mapConfig),
      });
      
      if (response.ok) {
        console.log('Map configuration saved successfully');
      } else {
        console.error('Failed to save map configuration:', await response.json());
      }
    } catch (error) {
      console.error('Error saving map configuration:', error);
    }
  };

  // Generate planets
  const planets = useMemo(() => {
    // If we're still loading or have loaded planets, don't generate new ones
    if (isLoading) {
      return [];
    }
    
    // If we have loaded planets, use those
    if (loadedPlanets && loadedPlanets.length > 0) {
      console.log('Using loaded planet configuration');
      return loadedPlanets;
    }
    
    // Otherwise generate new planets
    console.log('Generating new planets');
    const generatedPlanets: PlanetConfig[] = [];
    
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
    
    // Save the newly generated planets
    saveMap(generatedPlanets);
    
    return generatedPlanets;
  }, [planetCount, universeRadius, loadedPlanets, isLoading]);
  
  // Handle planet clicks
  const handlePlanetClick = (info: PlanetInfo) => {
    if (onPlanetClick) {
      onPlanetClick(info);
    }
  };
  
  // Don't render anything while loading
  if (isLoading) {
    return null;
  }
  
  return (
    <group>
      {/* Ambient light for general illumination */}
      <ambientLight intensity={0.5} />
      
      {/* Directional lights from different angles */}
      <directionalLight position={[5000, 5000, 5000]} intensity={1.0} />
      <directionalLight position={[-5000, -5000, 5000]} intensity={0.4} />
      <directionalLight position={[0, 5000, -5000]} intensity={0.3} />
      
      {/* Hemisphere light for more natural ambient lighting */}
      <hemisphereLight args={[0x3284ff, 0xffc87f, 0.6]} />
      
      {/* Render all planets */}
      {planets.map(planet => (
        <SimplePlanet 
          key={planet.id}
          id={planet.id}
          position={planet.position}
          size={planet.size}
          type={planet.type}
          rotationSpeed={planet.rotationSpeed}
          onPlanetClick={handlePlanetClick}
        />
      ))}
    </group>
  );
} 
