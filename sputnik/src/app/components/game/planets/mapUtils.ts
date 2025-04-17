import fs from 'fs';
import path from 'path';

export type PlanetType = 'fire' | 'water' | 'earth' | 'air';

export type PlanetConfig = {
  id: number;
  position: [number, number, number];
  size: number;
  type: PlanetType;
  rotationSpeed: number;
};

export type MapConfig = {
  planets: PlanetConfig[];
  universeRadius: number;
};

const MAP_CONFIG_PATH = path.join(process.cwd(), 'public', 'data', 'mapConfig.json');

/**
 * Saves a planetary map configuration to a JSON file
 * @param mapConfig The map configuration to save
 * @returns Promise that resolves when the file has been written
 */
export const saveMapConfig = async (mapConfig: MapConfig): Promise<void> => {
  try {
    // Make sure the directory exists
    const dir = path.dirname(MAP_CONFIG_PATH);
    await fs.promises.mkdir(dir, { recursive: true });

    // Write the map config to file
    await fs.promises.writeFile(
      MAP_CONFIG_PATH, 
      JSON.stringify(mapConfig, null, 2)
    );
    console.log('Map configuration saved successfully');
  } catch (error) {
    console.error('Error saving map configuration:', error);
    throw error;
  }
};

/**
 * Loads a map configuration from a JSON file
 * @returns Promise that resolves with the map configuration or null if none exists
 */
export const loadMapConfig = async (): Promise<MapConfig | null> => {
  try {
    // Check if file exists
    const exists = await fs.promises.access(MAP_CONFIG_PATH)
      .then(() => true)
      .catch(() => false);
    
    if (!exists) {
      console.log('No map configuration found');
      return null;
    }

    // Read and parse file
    const fileContent = await fs.promises.readFile(MAP_CONFIG_PATH, 'utf-8');
    return JSON.parse(fileContent) as MapConfig;
  } catch (error) {
    console.error('Error loading map configuration:', error);
    return null;
  }
}; 