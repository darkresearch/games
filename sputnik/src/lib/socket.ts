import { io, Socket } from 'socket.io-client';

// Create a singleton Socket.io instance that can be shared across components
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    // Create the socket instance only once
    socket = io({
      transports: ['polling'], // Force polling for development reliability
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 20000
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