import { WorldCoords } from '@darkforest_eth/types';
import GameUIManager from '../../Backend/GameLogic/GameUIManager';
import Viewport from './Viewport';
import { SpaceshipRenderer, createSpaceshipRenderer } from '../Renderers/SpaceshipRenderer';

/**
 * SpaceshipManager provides a simple interface for managing and rendering
 * a Sputnik spaceship in the game world.
 */
export class SpaceshipManager {
  private static instance: SpaceshipManager | undefined;
  
  private gameUIManager: GameUIManager;
  private spaceshipRenderer: SpaceshipRenderer | null = null;
  private spaceshipCoords: WorldCoords;
  private initialized: boolean = false;
  
  private constructor(gameUIManager: GameUIManager, spaceshipCoords: WorldCoords) {
    this.gameUIManager = gameUIManager;
    this.spaceshipCoords = spaceshipCoords;
    
    // We'll initialize the renderer later after Viewport is ready
    this.initialized = false;
    
    // Set up event listeners but don't try to initialize renderer yet
    this.setupRenderHook();
  }
  
  /**
   * Get the singleton instance of SpaceshipManager or create one if it doesn't exist
   */
  public static getInstance(
    gameUIManager?: GameUIManager,
    spaceshipCoords?: WorldCoords
  ): SpaceshipManager | undefined {
    if (!SpaceshipManager.instance) {
      if (!gameUIManager || !spaceshipCoords) {
        console.error('Cannot initialize SpaceshipManager without gameUIManager and coordinates');
        return undefined;
      }
      
      SpaceshipManager.instance = new SpaceshipManager(gameUIManager, spaceshipCoords);
    }
    
    return SpaceshipManager.instance;
  }
  
  /**
   * Clean up resources when no longer needed
   */
  public static destroyInstance(): void {
    if (SpaceshipManager.instance) {
      SpaceshipManager.instance.destroy();
    }
    
    SpaceshipManager.instance = undefined;
  }
  
  /**
   * Initialize the spaceship renderer - only call this after Viewport is initialized
   */
  public initializeRenderer(): void {
    if (this.initialized) return;
    
    try {
      const gl = this.gameUIManager.getGlManager()?.gl;
      const viewport = Viewport.getInstance(); // This will throw if Viewport not initialized
      
      if (!gl) {
        console.error('WebGL context not available');
        return;
      }
      
      this.spaceshipRenderer = createSpaceshipRenderer(gl, viewport, this.spaceshipCoords);
      
      if (!this.spaceshipRenderer) {
        console.error('Could not create spaceship renderer');
      } else {
        this.initialized = true;
        console.log('Sputnik spaceship renderer initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize spaceship renderer:', error);
    }
  }
  
  /**
   * Set up the render hook to integrate with the game's rendering pipeline
   */
  private setupRenderHook(): void {
    // Add a hook to the game's rendering pipeline
    // This is a simplified approach - in practice you might need to use
    // the plugin system or modify the main renderer
    const canvas2dCtx = this.gameUIManager.get2dRenderer();
    if (canvas2dCtx) {
      // Save the original draw method
      const originalDrawMethod = this.gameUIManager.drawAllRunningPlugins.bind(this.gameUIManager);
      
      // Override the draw method to include our spaceship
      this.gameUIManager.drawAllRunningPlugins = (ctx) => {
        // Call the original method
        originalDrawMethod(ctx);
        
        // Try to initialize if not initialized yet
        if (!this.initialized) {
          try {
            this.initializeRenderer();
          } catch (error) {
            // Silently continue - we'll try again on next render
          }
        }
        
        // Then render our spaceship if we're initialized
        if (this.initialized) {
          this.render();
        }
      };
    }
  }
  
  /**
   * Update the spaceship's position
   */
  public updatePosition(coords: WorldCoords): void {
    this.spaceshipCoords = coords;
    
    if (this.spaceshipRenderer) {
      this.spaceshipRenderer.updatePosition(coords);
    }
  }
  
  /**
   * Get the current position of the spaceship
   */
  public getPosition(): WorldCoords {
    return this.spaceshipCoords;
  }
  
  /**
   * Check if the renderer is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Render the spaceship - called by the game's render loop
   */
  private render(): void {
    if (this.spaceshipRenderer) {
      this.spaceshipRenderer.flush();
    }
  }
  
  /**
   * Clean up resources
   */
  private destroy(): void {
    if (this.spaceshipRenderer) {
      this.spaceshipRenderer.destroy();
      this.spaceshipRenderer = null;
    }
    this.initialized = false;
  }
}

/**
 * Initialize the Sputnik spaceship at the given coordinates
 * but don't try to access Viewport yet
 */
export function initSputnikSpaceship(
  gameUIManager: GameUIManager,
  coords: WorldCoords
): SpaceshipManager | undefined {
  return SpaceshipManager.getInstance(gameUIManager, coords);
} 