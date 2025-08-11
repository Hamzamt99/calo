// src/core/socket.ts
import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

export class SocketIO {
  private static io: SocketIOServer | null = null;

  static init(server: HttpServer): SocketIOServer {
    if (this.io) return this.io;

    this.io = new SocketIOServer(server, {
      cors: { origin: process.env.FRONTEND_URL ?? "*" },
    });

    this.io.on("connection", (socket) => {
      socket.on("join", (userId: number) => {
        socket.join(`user-${userId}`); 
      });
    });

    return this.io;
  }

  static get(): SocketIOServer {
    
    if (!this.io) {
      console.log('if this error appears that mean the socket didnt initialized yet no worries logout from your broken user and try again :)');
      throw new Error("Socket.IO not initialized. Call SocketIO.init(server) first.");
    }
    return this.io;
  }
}
