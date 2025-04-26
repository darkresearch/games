import { io, Socket } from 'socket.io-client';

// Create a singleton Socket.io instance that can be shared across components
let socket: Socket | null = null;
let registeredUuid: string | null = null;

// Allow passing a custom UUID for registration
export const getSocket = (customUuid?: string): Socket => {
  if (!socket) {
    // Determine if we're in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Get the current URL for automatic connection in prod
    let url = 'http://localhost:3000';
    
    if (isProduction && typeof window !== 'undefined') {
      // In production, use the same host but explicitly with http:// protocol
      const host = window.location.host;
      url = `${window.location.protocol}//${host}`;
      console.log(`🚀 SPUTNIK SOCKET: Production URL: ${url}`);
    }
    
    console.log(`🚀 SPUTNIK SOCKET: Creating connection to ${url}`);
    
    // Create the socket instance only once
    socket = io(url, {
      // Force polling only - never try WebSockets
      transports: ['polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 20000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      autoConnect: true
    });
    
    // Add global listeners
    socket.on('connect', () => {
      console.log('🚀 SPUTNIK SOCKET: Connected to server with ID:', socket?.id);
      
      // Use only the provided UUID
      if (customUuid) {
        console.log(`🚀 SPUTNIK SOCKET: Registering with UUID: ${customUuid}`);
        socket?.emit('register', { uuid: customUuid });
        registeredUuid = customUuid;
      } else {
        console.log('🚀 SPUTNIK SOCKET: No UUID provided, waiting for authentication');
      }
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
  } else if (customUuid && customUuid !== registeredUuid && socket.connected) {
    // If socket exists but we need to register with a different UUID
    console.log(`🚀 SPUTNIK SOCKET: Updating registration to UUID: ${customUuid}`);
    socket.emit('register', { uuid: customUuid });
    registeredUuid = customUuid;
  }
  
  return socket;
};

// Clean up function to be called when the application unmounts
export const cleanupSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    registeredUuid = null;
  }
}; 