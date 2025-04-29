/**
 * Sector Manager for handling spaceship sectors
 * 
 * This file handles:
 * - Tracking which spaceships are in which sectors
 * - Broadcasting sector-specific updates
 * - Managing sector transitions
 */

const SECTOR_SIZE = 1000; // Must match client-side value

/**
 * Converts a position to sector coordinates
 */
function positionToSector(position) {
  return [
    Math.floor(position.x / SECTOR_SIZE),
    Math.floor(position.y / SECTOR_SIZE),
    Math.floor(position.z / SECTOR_SIZE)
  ];
}

/**
 * Generates a sector ID from sector coordinates
 */
function getSectorId(sectorCoords) {
  return sectorCoords.join(',');
}

/**
 * Returns sector ID for a given position
 */
function getSectorIdFromPosition(position) {
  return getSectorId(positionToSector(position));
}

/**
 * SectorManager class to manage spaceship sectors
 */
class SectorManager {
  constructor(io, redisClient) {
    this.io = io;                       // Socket.io instance
    this.redis = redisClient;           // Redis client
    this.sectorSpaceships = new Map();  // Map of sector IDs to spaceship UUIDs
    this.spaceshipSectors = new Map();  // Map of spaceship UUIDs to sector IDs
    this.sectorSubscribers = new Map(); // Map of sector IDs to socket IDs
  }

  /**
   * Initialize the sector manager with existing data
   */
  async initialize() {
    try {
      // Get all spaceship data from Redis
      const spaceshipKeys = await this.redis.keys('spaceship:*:data');
      
      // Process each spaceship
      for (const key of spaceshipKeys) {
        const spaceshipData = JSON.parse(await this.redis.get(key));
        const uuid = key.split(':')[1];
        
        if (spaceshipData && spaceshipData.position) {
          // Calculate sector and update tracking
          const sectorId = getSectorIdFromPosition(spaceshipData.position);
          this.updateSpaceshipSector(uuid, sectorId);
          
          // Update Redis with sector info
          spaceshipData.sector = sectorId;
          await this.redis.set(key, JSON.stringify(spaceshipData));
        }
      }
      
      console.log(`🌌 SECTOR MANAGER: Initialized with ${this.sectorSpaceships.size} sectors`);
    } catch (error) {
      console.error('🌌 SECTOR MANAGER: Error initializing:', error);
    }
  }

  /**
   * Update a spaceship's sector
   */
  async updateSpaceshipSector(uuid, newSectorId) {
    const currentSectorId = this.spaceshipSectors.get(uuid);
    
    // If sector hasn't changed, do nothing
    if (currentSectorId === newSectorId) return false;
    
    // Remove from current sector if exists
    if (currentSectorId) {
      const sectorSpaceships = this.sectorSpaceships.get(currentSectorId) || new Set();
      sectorSpaceships.delete(uuid);
      
      if (sectorSpaceships.size === 0) {
        this.sectorSpaceships.delete(currentSectorId);
      } else {
        this.sectorSpaceships.set(currentSectorId, sectorSpaceships);
      }
      
      // Notify subscribers that spacecraft left the sector
      this.io.to(`sector:${currentSectorId}`).emit('sector:sputnik:leave', currentSectorId, uuid);
    }
    
    // Add to new sector
    const sectorSpaceships = this.sectorSpaceships.get(newSectorId) || new Set();
    sectorSpaceships.add(uuid);
    this.sectorSpaceships.set(newSectorId, sectorSpaceships);
    this.spaceshipSectors.set(uuid, newSectorId);
    
    // Update the Redis data with sector info
    try {
      const spaceshipData = JSON.parse(await this.redis.get(`spaceship:${uuid}:data`));
      if (spaceshipData) {
        spaceshipData.sector = newSectorId;
        await this.redis.set(`spaceship:${uuid}:data`, JSON.stringify(spaceshipData));
      }
    } catch (error) {
      console.error(`🌌 SECTOR MANAGER: Error updating Redis data for ${uuid}:`, error);
    }
    
    // Notify subscribers of the new sector about the spaceship
    this.broadcastSectorSpaceships(newSectorId);
    
    return true;
  }

  /**
   * Process a position update for a spaceship
   */
  async processPositionUpdate(uuid, position) {
    const sectorId = getSectorIdFromPosition(position);
    return await this.updateSpaceshipSector(uuid, sectorId);
  }

  /**
   * Handle a socket subscribing to a sector
   */
  subscribeSector(socket, sectorId) {
    // Join the room for this sector
    socket.join(`sector:${sectorId}`);
    
    // Track subscribers
    const subscribers = this.sectorSubscribers.get(sectorId) || new Set();
    subscribers.add(socket.id);
    this.sectorSubscribers.set(sectorId, subscribers);
    
    // Send current spaceships in this sector to the subscriber
    this.sendSectorSpaceships(socket, sectorId);
    
    console.log(`🌌 SECTOR MANAGER: Socket ${socket.id} subscribed to sector ${sectorId}`);
  }

  /**
   * Handle a socket unsubscribing from a sector
   */
  unsubscribeSector(socket, sectorId) {
    // Leave the room for this sector
    socket.leave(`sector:${sectorId}`);
    
    // Update subscriber tracking
    const subscribers = this.sectorSubscribers.get(sectorId);
    if (subscribers) {
      subscribers.delete(socket.id);
      
      if (subscribers.size === 0) {
        this.sectorSubscribers.delete(sectorId);
      } else {
        this.sectorSubscribers.set(sectorId, subscribers);
      }
    }
    
    console.log(`🌌 SECTOR MANAGER: Socket ${socket.id} unsubscribed from sector ${sectorId}`);
  }

  /**
   * Send the list of spaceships in a sector to a specific socket
   */
  sendSectorSpaceships(socket, sectorId) {
    const spaceships = Array.from(this.sectorSpaceships.get(sectorId) || []);
    socket.emit('sector:spaceships', sectorId, spaceships);
    
    // Send detailed data for each spaceship in this sector
    // This ensures the client has complete information about all spaceships
    spaceships.forEach(uuid => {
      // Emit position events for each spaceship to the new subscriber
      this.redis.get(`spaceship:${uuid}:data`).then(data => {
        if (data) {
          const spaceshipData = JSON.parse(data);
          if (spaceshipData.position) {
            socket.emit(`spaceship:${uuid}:position`, spaceshipData.position);
          }
        }
      }).catch(err => {
        console.error(`Error fetching data for spaceship ${uuid}:`, err);
      });
    });
  }

  /**
   * Broadcast the list of spaceships in a sector to all subscribers
   */
  broadcastSectorSpaceships(sectorId) {
    const spaceships = Array.from(this.sectorSpaceships.get(sectorId) || []);
    this.io.to(`sector:${sectorId}`).emit('sector:spaceships', sectorId, spaceships);
  }

  /**
   * Clean up when a socket disconnects
   */
  handleSocketDisconnect(socket) {
    // Find and remove socket from all sector subscribers
    for (const [sectorId, subscribers] of this.sectorSubscribers.entries()) {
      if (subscribers.has(socket.id)) {
        subscribers.delete(socket.id);
        
        if (subscribers.size === 0) {
          this.sectorSubscribers.delete(sectorId);
        } else {
          this.sectorSubscribers.set(sectorId, subscribers);
        }
      }
    }
  }

  /**
   * Get statistics about sectors
   */
  getStats() {
    return {
      totalSectors: this.sectorSpaceships.size,
      totalTrackedSpaceships: this.spaceshipSectors.size,
      sectorPopulations: Array.from(this.sectorSpaceships.entries()).map(
        ([id, ships]) => ({ id, count: ships.size })
      ).sort((a, b) => b.count - a.count)
    };
  }
}

module.exports = {
  SectorManager,
  positionToSector,
  getSectorId,
  getSectorIdFromPosition
}; 