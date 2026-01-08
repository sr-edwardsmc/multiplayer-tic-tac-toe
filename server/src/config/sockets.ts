import type { Server as HttpServer } from "http";
import { Socket, Server as SocketServer } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../types/game.js";
import { GameManager } from "../GameManager.js";

function setupSocketIO(httpServer: HttpServer): SocketServer {
  const io = new SocketServer<
    ClientToServerEvents,
    ServerToClientEvents,
    {},
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  const gameManager = new GameManager();

  io.on("connection", (socket) => {
    console.log("Player connected: ", socket.id);

    socket.data.playerId = socket.id;

    socket.on("game:create", () => {
      const game = gameManager.createGame(socket.id);
      socket.data.gameId = game.id;

      socket.join(game.id);

      socket.emit("game:created", game.id);
      socket.emit("game:updated", game);

      console.log(`Game created: ${game.id} by ${socket.id}`);
    });

    socket.on("game:join", (gameId: string) => {
      const game = gameManager.joinGame(gameId, socket.id);

      if (!game) {
        socket.emit(
          "game:error",
          "Could not join the game, may be full or not exist anymore"
        );
        return;
      }

      socket.data.gameId = game?.id;

      socket.join(gameId);
      io.to(gameId).emit("game:updated", game);

      console.log(`Player ${socket.id} joined game: ${gameId}`);
    });

    socket.on("game:move", (position: number) => {
      const gameId = socket.data.gameId;

      if (!gameId) {
        socket.emit("game:error", "You are not in a game");
        return;
      }

      const game = gameManager.makeMove(gameId, socket.id, position);

      if (!game) {
        socket.emit("game:error", "Invalid Move");
        return;
      }

      io.to(gameId).emit("game:updated", game);

      console.log(`Move made in game ${gameId} at position ${position}`);
    });

    socket.on("game:leave", () => {
      handlePlayerLeaving(socket);
    });

    socket.on("disconnect", () => {
      console.log(`Player disconnected: ${socket.id}`);
      handlePlayerLeaving(socket);
    });

    function handlePlayerLeaving(socket: any) {
      const gameId = socket.data.gameId;

      if (!gameId) {
        return;
      }

      const success = gameManager.removePlayer(gameId, socket.id);

      if (success) {
        // Notify other player
        socket.to(gameId).emit("game:playerLeft", "Opponent has left the game");

        // Leave the room
        socket.leave(gameId);

        delete socket.data.gameId;

        console.log(`Player ${socket.id} left game: ${gameId}`);
      }
    }
  });

  return io;
}

export { setupSocketIO };
