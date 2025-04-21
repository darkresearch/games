const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

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

  // Set up Socket.io
  const io = new Server(server);
  
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
      const broadcastInterval = setInterval(async () => {
        try {
          const position = await getSpaceshipPosition(pubClient);
          if (position) {
            io.emit('spaceship:position', position);
            
            // Log position occasionally to avoid console spam
            if (Math.random() < 0.01) {
              console.log('Broadcasting position:', position);
            }
          }
        } catch (error) {
          console.error('Error broadcasting position:', error);
        }
      }, 50); // 20 times per second
      
      console.log('Position broadcasting initialized');
    } catch (error) {
      console.error('Redis setup failed:', error);
    }
  })();
  
  // Connection handler
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Try to send initial position immediately to new client
    (async () => {
      try {
        const position = await getSpaceshipPosition(pubClient);
        if (position) {
          socket.emit('spaceship:position', position);
          console.log('Sent initial position to client:', socket.id);
        }
      } catch (error) {
        console.error('Error sending initial position to client:', error);
      }
    })();
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
    
    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  });

  server.listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
    console.log('> Socket.io server initialized');
  });
}); 