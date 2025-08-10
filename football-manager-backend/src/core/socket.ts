// src/socket.ts
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | undefined;

/**
 * Initializes the Socket.IO server and stores the instance.
 * Call this once with your HTTP server before using getIo().
 */
export function initSocket(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: { origin: process.env.FRONTEND_URL || '*' }
  });

  // Example: join users to rooms by ID
  io.on('connection', (socket) => {
    socket.on('join', (userId: number) => {
      socket.join(`user-${userId}`);
    });
  });

  return io;
}

/**
 * Returns the initialized Socket.IO server instance.
 * Throws an error if initSocket() hasn’t been called yet.
 */
export function getIo(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Call initSocket(server) first.');
  }
  console.log('Socket.io instance retrieved');
  
  return io;
}
