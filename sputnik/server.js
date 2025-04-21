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
    // Allow all origins in development
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    // Set up path
    path: '/socket.io/'
  });
  
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
      
      // Setup position broadcasting
      const BROADCAST_INTERVAL = 50; // 20 updates per second
      
      const broadcastInterval = setInterval(async () => {
        try {
          // Get client count before any operations
          const clientCount = io.engine.clientsCount;
          
          // Only broadcast if clients are connected
          if (clientCount > 0) {
            const position = await getSpaceshipPosition(pubClient);
            if (position) {
              io.emit('spaceship:position', position);
              
              // Log position occasionally
              if (Math.random() < 0.001) {
                console.log(`Broadcasting position to ${clientCount} clients`);
              }
            }
          }
        } catch (error) {
          console.error('Error broadcasting position:', error);
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
    connectedClients.forEach((lastSeen, id) => {
      if (now - lastSeen > 2 * 60 * 1000) {
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
    connectedClients.set(socket.id, currentTime);
    
    console.log(`Client connected: ${socket.id} - Total clients: ${io.engine.clientsCount}`);
    
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
        connectedClients.set(socket.id, Date.now());
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

  server.listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
    console.log('> Socket.io server initialized (polling mode)');
  });
}); 