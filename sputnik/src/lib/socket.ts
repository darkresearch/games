import { io, Socket } from 'socket.io-client';

// Create a singleton Socket.io instance that can be shared across components
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    // Determine if we're in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In development, explicitly connect to localhost
    // In production, let it connect to the current host automatically
    const url = isProduction ? undefined : 'http://localhost:3000';
    
    // Create the socket instance only once
    socket = io(url, {
      // In production, allow both polling and websockets (secure)
      // In development, force polling which is more reliable
      transports: isProduction ? ['websocket', 'polling'] : ['polling'],
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 20000,
      // Ensure secure connections in production
      secure: isProduction,
      // Add exponential backoff for reconnections
      reconnectionDelayMax: 10000,
      // Add random factor to avoid all clients reconnecting simultaneously
      randomizationFactor: 0.5
    });
    
    // Add global listeners
    socket.on('connect', () => {
      console.log('🚀 SPUTNIK SOCKET: Connected to server with ID:', socket?.id);
    });
    
    socket.on('disconnect', (reason) => {
      console.log('🚀 SPUTNIK SOCKET: Disconnected from server:', reason);
    });
    
    socket.on('connect_error', (error) => {
      console.error('🚀 SPUTNIK SOCKET CONNECTION ERROR:', error.message);
      console.error('🚀 SPUTNIK SOCKET: Connection error details:', {
        // Safe properties that won't cause TypeScript errors
        transport: socket?.io?.engine?.transport?.name,
        environment: isProduction ? 'production' : 'development',
        // Add the URL that was used for the connection
        url
      });
    });
  }
  
  return socket;
};

// Clean up function to be called when the application unmounts
export const cleanupSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}; 