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
const connectedClients = new Set();

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

  // Set up Socket.io with improved configuration
  const io = new Server(server, {
    connectionStateRecovery: {
      // Longer recovery window
      maxDisconnectionDuration: 30 * 1000,
      skipMiddlewares: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
    transports: ['websocket', 'polling'],
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
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
          
          const position = await getSpaceshipPosition(pubClient);
          if (position && io.engine.clientsCount > 0) {
            io.emit('spaceship:position', position);
            lastBroadcastTime = now;
            
            // Log position occasionally
            if (Math.random() < 0.005) {
              console.log('Broadcasting position to', io.engine.clientsCount, 'clients:', position);
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
  
  // Connection handler with improvements
  io.on('connection', (socket) => {
    // Only log new connections
    if (!connectedClients.has(socket.id)) {
      connectedClients.add(socket.id);
      console.log('Client connected:', socket.id, '- Total clients:', io.engine.clientsCount);
    }
    
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
    
    socket.on('disconnect', (reason) => {
      connectedClients.delete(socket.id);
      console.log('Client disconnected:', socket.id, 'Reason:', reason, '- Remaining clients:', io.engine.clientsCount);
    });
    
    socket.on('error', (err) => {
      console.error('Socket error for client', socket.id, ':', err);
    });
  });

  server.listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
    console.log('> Socket.io server initialized');
  });
}); 