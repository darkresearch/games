import * as THREE from 'three';
import { Vector3Position } from '@/types';

// Sector size in world units
export const SECTOR_SIZE = 1000;

/**
 * Converts a position to sector coordinates
 */
export function positionToSector(position: Vector3Position): [number, number, number] {
  return [
    Math.floor(position.x / SECTOR_SIZE),
    Math.floor(position.y / SECTOR_SIZE),
    Math.floor(position.z / SECTOR_SIZE)
  ];
}

/**
 * Generates a sector ID from sector coordinates
 */
export function getSectorId(sectorCoords: [number, number, number]): string {
  return sectorCoords.join(',');
}

/**
 * Returns sector ID for a given position
 */
export function getSectorIdFromPosition(position: Vector3Position): string {
  return getSectorId(positionToSector(position));
}

/**
 * Returns all sector IDs that should be visible from current sector
 * This includes the current sector and all 26 adjacent sectors
 */
export function getVisibleSectors(currentSector: [number, number, number]): string[] {
  const sectors: string[] = [];
  const [x, y, z] = currentSector;
  
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        sectors.push(getSectorId([x + dx, y + dy, z + dz]));
      }
    }
  }
  
  return sectors;
}

/**
 * Returns all sector IDs that should be visible from a given position
 */
export function getVisibleSectorsFromPosition(position: Vector3Position): string[] {
  return getVisibleSectors(positionToSector(position));
}

/**
 * Checks if a position is in a different sector than the previous position
 */
export function hasCrossedSectorBoundary(
  prevPosition: Vector3Position,
  newPosition: Vector3Position
): boolean {
  const prevSector = positionToSector(prevPosition);
  const newSector = positionToSector(newPosition);
  
  return (
    prevSector[0] !== newSector[0] ||
    prevSector[1] !== newSector[1] ||
    prevSector[2] !== newSector[2]
  );
} 