import express, { Express } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "./types/game.js";

const app: Express = express();
const httpServer = createServer(app);

const socketServer = new SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents
>(httpServer, {
  cors: {
    origin: "*",
  },
});

socketServer.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
});
