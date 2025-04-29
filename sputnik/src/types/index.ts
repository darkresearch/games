// Vector3 type for socket communication
export type Vector3Position = {
  x: number;
  y: number;
  z: number;
};

// Sputnik data including sector information
export type SputnikData = {
  uuid: string;
  position: Vector3Position;
  destination: [number, number, number] | null;
  velocity: [number, number, number] | null;
  fuel: number;
  sector?: string; // Sector ID where this sputnik is located
};

// Type for visible sectors tracking
export type SectorSubscriptionState = {
  currentSector: string;
  visibleSectors: string[];
  subscribedSectors: string[];
}; 