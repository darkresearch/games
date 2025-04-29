const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const { SectorManager, getSectorIdFromPosition } = require('./src/server/sectorManager');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Track connected clients to avoid duplicate logging
const connectedClients = new Map();

// Track connection attempts for rate limiting
const connectionAttempts = new Map();
const MAX_CONNECTIONS_PER_MINUTE = 60;
const RATE_LIMIT_RESET_INTERVAL = 60000; // 1 minute

// Global reference to the sector manager
let sectorManager = null;

// Helper to get IP address from request
const getIpAddress = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.socket.remoteAddress || 
         'unknown';
};

// Helper function to get position from Redis
async function getSpaceshipPosition(redisClient, uuid) {
  try {
    const positionStr = await redisClient.hGet(`sputnik:${uuid}:state`, 'position');
    if (positionStr) {
      const position = JSON.parse(positionStr);
      return {
        x: position[0],
        y: position[1],
        z: position[2]
      };
    }
    return null;
  } catch (error) {
    console.error(`Error getting position for Sputnik ${uuid} from Redis:`, error);
    return null;
  }
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Set up Socket.io with simplified configuration focused on polling
  const io = new Server(server, {
    // Force polling only - don't attempt WebSocket
    transports: ['polling'],
    connectTimeout: 30000,
    // More frequent pings for better connection status awareness
    pingTimeout: 30000,
    pingInterval: 15000,
    // Set up CORS properly for different environments
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? '*'
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Set up path
    path: '/socket.io/'
  });
  
  // Set up rate limiting middleware
  io.use((socket, next) => {
    const ip = getIpAddress(socket.request);
    
    // Initialize or increment connection counter for this IP
    if (!connectionAttempts.has(ip)) {
      connectionAttempts.set(ip, 1);
    } else {
      connectionAttempts.set(ip, connectionAttempts.get(ip) + 1);
    }
    
    // Check if IP has exceeded rate limit
    if (connectionAttempts.get(ip) > MAX_CONNECTIONS_PER_MINUTE) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return next(new Error('Too many connection attempts. Please try again later.'));
    }
    
    // Add the IP to the socket data for tracking
    socket.data.ip = ip;
    
    next();
  });
  
  // Reset connection counters periodically
  setInterval(() => {
    connectionAttempts.clear();
  }, RATE_LIMIT_RESET_INTERVAL);
  
  // Connect to Redis
  console.log('Connecting to Redis...');
  const pubClient = createClient({ 
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        // Exponential backoff with max 10 second delay
        return Math.min(retries * 100, 10000);
      }
    }
  });
  const subClient = pubClient.duplicate();
  
  // Set up error handlers
  pubClient.on('error', (err) => {
    console.error('Redis Pub Client Error:', err);
  });
  
  subClient.on('error', (err) => {
    console.error('Redis Sub Client Error:', err);
  });
  
  // Run async setup
  (async () => {
    try {
      await Promise.all([
        pubClient.connect().catch(err => {
          console.error('Failed to connect Redis pub client:', err);
          throw err;
        }), 
        subClient.connect().catch(err => {
          console.error('Failed to connect Redis sub client:', err);
          throw err;
        })
      ]);
      
      console.log('Connected to Redis, setting up adapter');
      io.adapter(createAdapter(pubClient, subClient));
      
      // Initialize the sector manager
      console.log('Initializing Sector Manager...');
      sectorManager = new SectorManager(io, pubClient);
      await sectorManager.initialize();
      console.log('Sector Manager initialized');
      
      // Setup position broadcasting with rate limiting
      let lastBroadcastTime = 0;
      const BROADCAST_INTERVAL = 50; // 20 updates per second
      const MIN_BROADCAST_INTERVAL = 30; // Minimum ms between broadcasts
      
      const broadcastInterval = setInterval(async () => {
        try {
          // Rate limit broadcasts
          const now = Date.now();
          if (now - lastBroadcastTime < MIN_BROADCAST_INTERVAL) {
            return;
          }
          
          // Get client count before any operations
          const clientCount = io.engine.clientsCount;
          
          // Only broadcast if clients are connected
          if (clientCount > 0) {
            // Get all active spaceship UUIDs from Redis
            const spaceshipKeys = await pubClient.keys('sputnik:*:state');
            const uuids = spaceshipKeys.map(key => {
              const match = key.match(/sputnik:(.+):state/);
              return match ? match[1] : null;
            }).filter(uuid => uuid);
            
            // We're removing the global broadcast to avoid sending ALL spaceships to EVERY client
            // Instead, we'll rely on sector-specific messages only
            
            // Broadcast position for each spaceship (now sector-aware)
            for (const uuid of uuids) {
              const position = await getSpaceshipPosition(pubClient, uuid);
              if (position) {
                // Process sector updates for this position
                if (sectorManager) {
                  const sectorChanged = await sectorManager.processPositionUpdate(uuid, position);
                  
                  // If sector changed, it will be handled by the sector manager
                  // otherwise, send position update to the sector subscribers
                  if (!sectorChanged) {
                    const sectorId = sectorManager.spaceshipSectors.get(uuid);
                    if (sectorId) {
                      // Emit position only to subscribers of this sector
                      io.to(`sector:${sectorId}`).emit(`spaceship:${uuid}:position`, position);
                    } else {
                      // Fallback to global broadcast if sector is unknown
                      io.emit(`spaceship:${uuid}:position`, position);
                    }
                  }
                } else {
                  // Fallback to global broadcast if sector manager isn't available
                  io.emit(`spaceship:${uuid}:position`, position);
                }
              }
              
              // Also broadcast full state less frequently (every 5th update)
              if (Math.random() < 0.2) { // ~20% chance each time, so every ~5 updates
                // Get spaceship state from Redis
                const state = await pubClient.hGetAll(`sputnik:${uuid}:state`);
                if (state && Object.keys(state).length > 0) {
                  // Process state to parse JSON strings
                  const parsedState = {
                    position: position ? [position.x, position.y, position.z] : JSON.parse(state.position || '[]'),
                    velocity: JSON.parse(state.velocity || '[0,0,0]'),
                    destination: state.destination && state.destination !== '' ? 
                      JSON.parse(state.destination) : null,
                    timestamp: parseInt(state.timestamp || Date.now().toString()),
                    fuel: state.fuel ? parseFloat(state.fuel) : 100,
                    uuid: uuid  // Include the UUID in the state object
                  };
                  
                  // Get the sector for this spaceship
                  let sectorId = null;
                  if (sectorManager) {
                    sectorId = sectorManager.spaceshipSectors.get(uuid);
                  }
                  
                  if (sectorId) {
                    // Emit state only to subscribers of this sector
                    io.to(`sector:${sectorId}`).emit(`spaceship:${uuid}:state`, parsedState);
                  } else {
                    // Fallback to global broadcast
                    io.emit(`spaceship:${uuid}:state`, parsedState);
                  }
                }
              }
            }
            
            // Log occasionally with sector stats
            if (Math.random() < 0.01) {
              const stats = sectorManager ? sectorManager.getStats() : { totalSectors: 0, totalTrackedSpaceships: 0 };
              console.log(`Broadcasting state for ${uuids.length} spaceships across ${stats.totalSectors} sectors`);
            }
            
            lastBroadcastTime = now;
          }
        } catch (error) {
          console.error('Error broadcasting data:', error);
        }
      }, BROADCAST_INTERVAL);
      
      console.log('Position broadcasting initialized');
    } catch (error) {
      console.error('Redis setup failed:', error);
    }
  })();
  
  // Clean up stale clients periodically
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    
    // Remove clients that haven't pinged in 2 minutes
    connectedClients.forEach((clientData, id) => {
      if (now - clientData.lastSeen > 2 * 60 * 1000) {
        connectedClients.delete(id);
        cleanedCount++;
      }
    });
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} stale client entries`);
    }
  }, 60000);
  
  // Connection handler with better tracking
  io.on('connection', (socket) => {
    const currentTime = Date.now();
    const ip = socket.data.ip || getIpAddress(socket.request);
    connectedClients.set(socket.id, { lastSeen: currentTime, ip });
    
    // Store the spaceship UUID for this socket
    let spaceshipUuid = null;
    
    console.log(`Client connected: ${socket.id} - IP: ${ip} - Total clients: ${io.engine.clientsCount}`);
    console.log(`Connection details: Transport=${socket.conn.transport.name}, Headers=${JSON.stringify(socket.handshake.headers['user-agent'])}`);
    
    // Set up rate limiting for messages
    const messageTimestamps = [];
    const MAX_MESSAGES_PER_MINUTE = 120; // Allow 2 messages per second on average
    
    // Track message timestamps for rate limiting
    socket.use((event, next) => {
      const now = Date.now();
      
      // Add current timestamp
      messageTimestamps.push(now);
      
      // Remove timestamps older than 1 minute
      while (messageTimestamps.length > 0 && messageTimestamps[0] < now - 60000) {
        messageTimestamps.shift();
      }
      
      // Check if too many messages have been sent
      if (messageTimestamps.length > MAX_MESSAGES_PER_MINUTE) {
        console.warn(`Message rate limit exceeded for socket: ${socket.id}, IP: ${ip}`);
        return next(new Error('Message rate limit exceeded. Please slow down.'));
      }
      
      next();
    });
    
    // Handle client registration with UUID
    socket.on('register', async (data) => {
      if (data && data.uuid) {
        spaceshipUuid = data.uuid;
        // Update client data with UUID
        const clientData = connectedClients.get(socket.id);
        if (clientData) {
          connectedClients.set(socket.id, {
            ...clientData,
            uuid: spaceshipUuid
          });
        }
        
        console.log(`Client ${socket.id} registered as spaceship ${spaceshipUuid}`);
        
        try {
          // Check if this Sputnik already exists in Redis
          const exists = await pubClient.exists(`sputnik:${spaceshipUuid}:state`);
          
          // Initialize the sputnik state in Redis if it doesn't exist
          if (!exists) {
            console.log(`Initializing new sputnik ${spaceshipUuid} in Redis`);
            
            // Add to active sputniks set
            await pubClient.sAdd('sputniks:active', spaceshipUuid);
            
            // Generate random starting position across the entire universe (radius of 10000)
            const universeRadius = 10000;
            const randomPosition = [
              Math.random() * 2 * universeRadius - universeRadius,  // Range: -10000 to 10000
              Math.random() * 2 * universeRadius - universeRadius,  // Range: -10000 to 10000
              Math.random() * 2 * universeRadius - universeRadius   // Range: -10000 to 10000
            ];
            
            // Create initial state
            const initialState = {
              position: JSON.stringify(randomPosition),
              velocity: JSON.stringify([0, 0, 0]),
              destination: '',
              timestamp: Date.now().toString(),
              fuel: '100'
            };
            
            // Save initial state to Redis
            await pubClient.hSet(`sputnik:${spaceshipUuid}:state`, initialState);
            console.log(`New sputnik ${spaceshipUuid} initialized with position:`, randomPosition);
            
            // Initialize sector for this new sputnik
            if (sectorManager) {
              await sectorManager.processPositionUpdate(spaceshipUuid, {
                x: randomPosition[0],
                y: randomPosition[1],
                z: randomPosition[2]
              });
            }
          }
          
          // Send initial position for this spaceship
          const position = await getSpaceshipPosition(pubClient, spaceshipUuid);
          if (position) {
            socket.emit(`spaceship:${spaceshipUuid}:position`, position);
            
            // If sector manager exists, suggest initial sectors to subscribe to
            if (sectorManager) {
              // Get the sector for this position
              const sectorId = sectorManager.spaceshipSectors.get(spaceshipUuid);
              if (sectorId) {
                // Notify the client of its current sector
                socket.emit('sector:current', sectorId);
              }
            }
          }
        } catch (error) {
          console.error(`Error initializing or retrieving sputnik ${spaceshipUuid}:`, error);
        }
      } else {
        console.warn(`Client ${socket.id} attempted to register without a UUID`);
        socket.emit('error', { message: 'UUID is required for registration' });
      }
    });
    
    // Handle client requests for specific spaceship data
    socket.on('getSpaceshipPosition', async (data) => {
      if (data && data.uuid) {
        try {
          const position = await getSpaceshipPosition(pubClient, data.uuid);
          if (position) {
            socket.emit(`spaceship:${data.uuid}:position`, position);
          } else {
            socket.emit('error', { message: `No position data found for spaceship ${data.uuid}` });
          }
        } catch (error) {
          console.error(`Error retrieving position for spaceship ${data.uuid}:`, error);
          socket.emit('error', { message: 'Failed to retrieve spaceship position' });
        }
      } else {
        socket.emit('error', { message: 'UUID is required to get spaceship position' });
      }
    });
    
    // Handle sector subscription
    socket.on('sector:subscribe', (sectorId) => {
      if (sectorManager) {
        sectorManager.subscribeSector(socket, sectorId);
      } else {
        console.warn(`Sector subscribe request from ${socket.id} but sector manager not initialized`);
      }
    });
    
    // Handle sector unsubscription
    socket.on('sector:unsubscribe', (sectorId) => {
      if (sectorManager) {
        sectorManager.unsubscribeSector(socket, sectorId);
      }
    });
    
    // Add a new socket event handler for sector stats
    socket.on('sector:stats', () => {
      if (sectorManager) {
        const stats = sectorManager.getStats();
        socket.emit('sector:stats:result', stats);
      } else {
        socket.emit('sector:stats:result', { error: 'Sector manager not initialized' });
      }
    });
    
    // Update last seen time on ping events
    socket.conn.on('packet', (packet) => {
      if (packet.type === 'ping') {
        const clientData = connectedClients.get(socket.id);
        if (clientData) {
          // Update only the lastSeen timestamp
          connectedClients.set(socket.id, {
            ...clientData,
            lastSeen: Date.now()
          });
        }
      }
    });
    
    socket.on('disconnect', (reason) => {
      // Get the UUID associated with this socket
      const clientData = connectedClients.get(socket.id);
      const clientUuid = clientData?.uuid;
      
      // Clean up client data
      connectedClients.delete(socket.id);
      
      // Clean up sector subscriptions
      if (sectorManager) {
        sectorManager.handleSocketDisconnect(socket);
        
        // If this socket had a spaceship, notify other clients in the same sector
        if (clientUuid) {
          const sectorId = sectorManager.spaceshipSectors.get(clientUuid);
          if (sectorId) {
            // Notify others that this spaceship is gone
            io.to(`sector:${sectorId}`).emit('sector:sputnik:leave', sectorId, clientUuid);
          }
        }
      }
      
      console.log(`Client disconnected: ${socket.id} - Reason: ${reason} - Clients: ${io.engine.clientsCount}`);
    });
    
    socket.on('error', (err) => {
      console.error(`Socket error for ${socket.id}:`, err);
    });
  });

  // Ensure clean shutdown
  const shutdown = () => {
    console.log('Shutting down server...');
    clearInterval(broadcastInterval);
    clearInterval(cleanupInterval);
    io.close();
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  server.listen(3000, '0.0.0.0', () => {
    console.log('> Ready on http://0.0.0.0:3000');
    console.log('> Socket.io server initialized (polling mode)');
  });
}); 