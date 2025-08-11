// src/server.ts
import http from "http";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { database } from "./config/database";
import routes from "./routes";
import { SocketIO } from "./core/socket";

dotenv.config();

export const startServer = async () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use("/api", routes);

  // Create a single HTTP server for both Express + Socket.IO
  const server = http.createServer(app);

  // Initialize Socket.IO on the same server
  SocketIO.init(server);

  try {
    await database.authenticate();
    console.log("DB connected");

    const PORT = Number(process.env.PORT) || 3001;
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("DB connection error", err);
    process.exit(1);
  }
};
