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
    
    // Set up error handlers
    pubClient.on('error', (err) => {
      console.error('Redis Pub Client Error:', err);
    });
    
    subClient.on('error', (err) => {
      console.error('Redis Sub Client Error:', err);
    });
    
    // Connect both clients
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
        origin: process.env.NODE_ENV === 'development' ? '*' : /\.yourdomain\.com$/,
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