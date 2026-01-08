import { Server as SocketServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "@tictactoe/shared";
import { GameManager } from "../GameManager.js";

export function setupSocketIO(httpServer: HTTPServer) {
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

  setInterval(() => {
    gameManager.cleanupOldGames();
  }, 600000);

  io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);
    socket.data.playerId = socket.id;

    socket.on("game:create", () => {
      const game = gameManager.createGame(socket.id);
      socket.data.gameId = game.id;
      socket.data.playerSymbol = "X";

      socket.join(game.id);

      socket.emit("game:created", {
        gameId: game.id,
        yourSymbol: "X",
      });
      socket.emit("game:updated", game);

      console.log(`Game created: ${game.id}`);
    });

    socket.on("game:join", (gameId: string) => {
      const game = gameManager.joinGame(gameId, socket.id);

      if (!game) {
        socket.emit("game:error", "Could not join game");
        return;
      }

      socket.data.gameId = gameId;
      socket.data.playerSymbol = "O";

      socket.join(gameId);

      socket.emit("game:joined", {
        game,
        yourSymbol: "O",
      });

      io.to(gameId).emit("game:updated", game);
    });

    socket.on("game:move", (position: number) => {
      const gameId = socket.data.gameId;

      if (!gameId) {
        socket.emit("game:error", "Not in a game");
        return;
      }

      const game = gameManager.makeMove(gameId, socket.id, position);

      if (!game) {
        socket.emit("game:error", "Invalid move");
        return;
      }

      io.to(gameId).emit("game:updated", game);

      if (game.status === "finished" && game.result) {
        const winner = game.result.winner;
        const message =
          winner === "draw" ? "It's a draw!" : `Player ${winner} wins!`;

        io.to(gameId).emit("game:finished", {
          winner: winner as "X" | "O" | "draw",
          message,
        });
      }
    });

    socket.on("game:leave", () => handlePlayerLeaving(socket));
    socket.on("disconnect", () => handlePlayerLeaving(socket));

    function handlePlayerLeaving(socket: any) {
      const gameId = socket.data.gameId;
      if (!gameId) return;

      gameManager.removePlayer(gameId, socket.id);
      socket.to(gameId).emit("game:playerLeft", "Opponent left");
      socket.leave(gameId);
      delete socket.data.gameId;
    }
  });

  return io;
}
