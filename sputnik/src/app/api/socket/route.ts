import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { NextResponse } from 'next/server';
import { getInterpolator } from '../spaceship/interpolator';

// Define a custom type for our server that includes Socket.io
type ServerWithIO = {
  io?: Server;
};

// Global variables to maintain server instance
let io: Server;
let broadcastInterval: NodeJS.Timeout | null = null;
let redisEventsSubscriber: ReturnType<typeof createClient> | null = null;

export async function GET() {
  // Ensure we have server object
  if (io) {
    return NextResponse.json(
      { message: 'Socket server is running' },
      { status: 200 }
    );
  }

  try {
    // Set up Redis clients for adapter
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
    
    // Create a separate subscriber for Redis events
    redisEventsSubscriber = pubClient.duplicate();
    
    // Set up error handlers
    pubClient.on('error', (err) => {
      console.error('Redis Pub Client Error:', err);
    });
    
    subClient.on('error', (err) => {
      console.error('Redis Sub Client Error:', err);
    });
    
    redisEventsSubscriber.on('error', (err) => {
      console.error('Redis Events Subscriber Error:', err);
    });
    
    // Connect all clients
    await Promise.all([
      pubClient.connect().catch(err => {
        console.error('Failed to connect Redis pub client:', err);
        throw err;
      }), 
      subClient.connect().catch(err => {
        console.error('Failed to connect Redis sub client:', err);
        throw err;
      }),
      redisEventsSubscriber.connect().catch(err => {
        console.error('Failed to connect Redis events subscriber:', err);
        throw err;
      })
    ]);
    
    // Create Socket.io server
    const res = await tryToGetServerResponse();
    if (!res?.socket?.server) {
      return NextResponse.json(
        { error: 'Failed to get socket from response' },
        { status: 500 }
      );
    }
    
    // Check if server already has socket.io instance
    const serverWithIO = res.socket.server as unknown as ServerWithIO;
    if (serverWithIO.io) {
      io = serverWithIO.io;
      return NextResponse.json(
        { message: 'Socket server is already running' },
        { status: 200 }
      );
    }
    
    // Set up new Socket.io server with configuration for production
    io = new Server(res.socket.server as any, {
      connectionStateRecovery: {
        // the backup duration of the sessions and the packets
        maxDisconnectionDuration: 2 * 60 * 1000,
        // whether to skip middlewares upon successful recovery
        skipMiddlewares: true,
      },
      cors: {
        origin: process.env.NODE_ENV === 'development' ? '*' : ['https://sputnik.darkresearch.ai', /\.darkresearch\.ai$/],
        methods: ['GET', 'POST']
      },
      pingInterval: 25000,
      pingTimeout: 20000,
      transports: ['websocket', 'polling'],
    });
    
    // Store the io instance on the server
    serverWithIO.io = io;
    
    // Apply Redis adapter
    io.adapter(createAdapter(pubClient, subClient));
    
    // Get the interpolator instance to read positions from
    const interpolator = await getInterpolator();
    
    // Set up interval to broadcast position updates
    // Clear any existing interval first
    if (broadcastInterval) {
      clearInterval(broadcastInterval);
    }
    
    broadcastInterval = setInterval(async () => {
      try {
        const position = await interpolator.getCurrentPosition();
        if (position && io) {
          // Broadcast position to all connected clients
          io.emit('spaceship:position', position);
        }
      } catch (error) {
        console.error('Error broadcasting position:', error);
      }
    }, 50); // 20 updates per second
    
    // Subscribe to Redis events channel for refueling events
    await redisEventsSubscriber.subscribe('sputnik:events', (message) => {
      try {
        const event = JSON.parse(message);
        
        // Forward specific events to Socket.io clients
        if (event.type === 'refueling_start') {
          console.log('🚀 SOCKET: Broadcasting refueling_start event');
          io.emit('refueling_start', {
            planetId: event.planetId,
            planetType: event.planetType,
            timestamp: event.timestamp
          });
        } 
        else if (event.type === 'refueling_stop') {
          console.log('🚀 SOCKET: Broadcasting refueling_stop event');
          io.emit('refueling_stop', {
            reason: event.reason,
            timestamp: event.timestamp
          });
        }
        else if (event.type === 'fuel_depleted') {
          console.log('🚀 SOCKET: Broadcasting fuel_depleted event');
          io.emit('fuel_depleted', {
            position: event.position,
            timestamp: event.timestamp
          });
        }
        else if (event.type === 'arrival') {
          console.log('🚀 SOCKET: Broadcasting arrival event');
          io.emit('arrival', {
            position: event.position,
            timestamp: event.timestamp
          });
        }
      } catch (error) {
        console.error('Error processing Redis event:', error);
      }
    });
    
    // Connection handler
    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);
      
      // Try to send initial position immediately to new client
      interpolator.getCurrentPosition().then(position => {
        if (position) {
          socket.emit('spaceship:position', position);
        }
      }).catch(err => {
        console.error('Error sending initial position to new client:', err);
      });
      
      // Get current state including refueling status
      interpolator.getState().then(state => {
        if (state) {
          socket.emit('spaceship:state', state);
        }
      }).catch(err => {
        console.error('Error sending initial state to new client:', err);
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
      
      socket.on('error', (err) => {
        console.error('Socket error:', err);
      });
    });
    
    return NextResponse.json(
      { message: 'Socket server started successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error initializing socket server:', error);
    return NextResponse.json(
      { error: 'Failed to initialize socket server' },
      { status: 500 }
    );
  }
}

// Helper function to get server response
async function tryToGetServerResponse(): Promise<{socket: {server: Record<string, unknown>}}> {
  try {
    // This is a workaround since Next.js API routes don't provide direct access to res objects
    // with servers like in the Express world. This works in the app router for now.
    const res = {
      socket: {
        server: {
          io: null
        }
      }
    };
    
    return res;
  } catch (error) {
    console.error('Error creating server response object:', error);
    throw new Error('Failed to create server response object');
  }
} 