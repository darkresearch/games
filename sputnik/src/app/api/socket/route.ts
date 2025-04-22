import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { NextResponse } from 'next/server';
import { getInterpolator } from '../spaceship/interpolator';
import { RedisStreams, getSputnikUuid } from '@/lib/redis-streams';

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
    
    // Initialize Redis Streams
    const redisStreams = await RedisStreams.getInstance();
    
    // Track last IDs processed
    let lastPositionId = '0-0';
    let lastEventId = '0-0';
    
    // Clear any existing interval first
    if (broadcastInterval) {
      clearInterval(broadcastInterval);
    }
    
    // Set up interval to read from streams and broadcast
    broadcastInterval = setInterval(async () => {
      try {
        // Get active Sputniks
        const activeSputniks = await redisStreams.getActiveSputniks();
        
        // Read position updates from stream
        const positionUpdates = await redisStreams.readPositions(lastPositionId);
        
        if (positionUpdates.length > 0) {
          // Update last position ID
          lastPositionId = positionUpdates[positionUpdates.length - 1].id;
          
          // Group updates by Sputnik UUID
          const updatesByUuid: Record<string, any> = {};
          
          for (const update of positionUpdates) {
            const position = update.position;
            if (position && position.uuid) {
              updatesByUuid[position.uuid] = position;
            }
          }
          
          // Emit batch updates for all Sputniks
          io.emit('sputniks:positions', updatesByUuid);
          
          // Also emit individual updates for specific Sputnik rooms
          for (const uuid in updatesByUuid) {
            const position = updatesByUuid[uuid];
            
            // Broadcast to Sputnik-specific room
            io.to(`sputnik:${uuid}`).emit('spaceship:position', position.position);
            
            // If there's state info, broadcast that too
            if (position.fuel !== undefined) {
              io.to(`sputnik:${uuid}`).emit('spaceship:state', {
                destination: position.destination,
                velocity: position.velocity,
                fuel: position.fuel,
                isMoving: position.isMoving
              });
            }
          }
        }
        
        // Read events from stream
        const eventUpdates = await redisStreams.readEvents(lastEventId);
        
        if (eventUpdates.length > 0) {
          // Update last event ID
          lastEventId = eventUpdates[eventUpdates.length - 1].id;
          
          // Process and broadcast events
          for (const { event } of eventUpdates) {
            if (event.uuid) {
              if (event.type === 'arrival') {
                io.to(`sputnik:${event.uuid}`).emit('spaceship:state', {
                  destination: null,
                  velocity: [0, 0, 0],
                  fuel: event.fuel,
                  isMoving: false
                });
              } else if (event.type === 'fuel_update') {
                io.to(`sputnik:${event.uuid}`).emit('spaceship:state', {
                  fuel: event.fuel
                });
              }
              
              // Emit to general event channel with UUID
              io.emit('sputnik:event', {
                uuid: event.uuid,
                ...event
              });
            }
          }
        }
      } catch (error) {
        console.error('Error broadcasting from Redis Streams:', error);
      }
    }, 50); // 20 updates per second
    
    // Connection handler
    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);
      
      // Send list of active Sputniks
      (async () => {
        try {
          const activeSputniks = await redisStreams.getActiveSputniks();
          socket.emit('sputniks:list', activeSputniks);
        } catch (error) {
          console.error('Error sending Sputniks list:', error);
        }
      })();
      
      // Allow clients to subscribe to a specific Sputnik
      socket.on('subscribe', async (uuid: string) => {
        // Join the room for this Sputnik
        socket.join(`sputnik:${uuid}`);
        console.log(`Client ${socket.id} subscribed to Sputnik ${uuid}`);
        
        // Send initial state for this Sputnik
        try {
          const interpolator = await getInterpolator(uuid);
          const state = await interpolator.getState();
          
          if (state) {
            // Send initial position
            socket.emit('spaceship:position', state.position);
            
            // Send initial state
            socket.emit('spaceship:state', {
              destination: state.destination,
              velocity: state.velocity,
              fuel: state.fuel,
              isMoving: state.isMoving
            });
          }
        } catch (err) {
          console.error(`Error sending initial state for Sputnik ${uuid}:`, err);
        }
      });
      
      // Get the client's own Sputnik UUID
      socket.on('get_my_sputnik', () => {
        const uuid = getSputnikUuid();
        socket.emit('my_sputnik', { uuid });
        
        // Auto-subscribe to their own Sputnik
        socket.join(`sputnik:${uuid}`);
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