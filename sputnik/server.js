const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Track connected clients to avoid duplicate logging
const connectedClients = new Map();

// Track connection attempts for rate limiting
const connectionAttempts = new Map();
const MAX_CONNECTIONS_PER_MINUTE = 60;
const RATE_LIMIT_RESET_INTERVAL = 60000; // 1 minute

// Helper to get IP address from request
const getIpAddress = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.socket.remoteAddress || 
         'unknown';
};

// Helper function to get position from Redis
async function getSpaceshipPosition(redisClient) {
  try {
    const positionStr = await redisClient.hGet('sputnik:state', 'position');
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
    console.error('Error getting position from Redis:', error);
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
    // Using only polling for development to avoid WebSocket issues
    transports: ['polling'],
    connectTimeout: 30000,
    // More frequent pings for better connection status awareness
    pingTimeout: 30000,
    pingInterval: 15000,
    // Set up CORS properly for different environments
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? [/\.darkresearch\.ai$/, 'https://darkresearch.ai']
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
            // First broadcast position for more frequent updates
            const position = await getSpaceshipPosition(pubClient);
            if (position) {
              io.emit('spaceship:position', position);
            }
            
            // Also broadcast full state less frequently (every 5th update)
            if (Math.random() < 0.2) { // ~20% chance each time, so every ~5 updates
              // Get all spaceship state from Redis
              const state = await pubClient.hGetAll('sputnik:state');
              if (state && Object.keys(state).length > 0) {
                // Process state to parse JSON strings
                const parsedState = {
                  position: position ? [position.x, position.y, position.z] : JSON.parse(state.position || '[]'),
                  velocity: JSON.parse(state.velocity || '[0,0,0]'),
                  destination: state.destination && state.destination !== '' ? 
                    JSON.parse(state.destination) : null,
                  timestamp: parseInt(state.timestamp || Date.now().toString())
                };
                
                // Broadcast full state
                io.emit('spaceship:state', parsedState);
                
                // Log occasionally
                if (Math.random() < 0.01) {
                  console.log(`Broadcasting state to ${clientCount} clients`);
                }
              }
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
    
    // Try to send initial position immediately to new client
    (async () => {
      try {
        const position = await getSpaceshipPosition(pubClient);
        if (position) {
          socket.emit('spaceship:position', position);
        }
      } catch (error) {
        console.error('Error sending initial position to client:', error);
      }
    })();
    
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
      connectedClients.delete(socket.id);
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