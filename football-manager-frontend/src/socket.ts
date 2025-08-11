// src/socket.ts
"use client";
import { io } from 'socket.io-client';

// connect to your API server (port 3001 if that’s where Express runs)
export const socket = io('http://localhost:3001', { autoConnect: false });
