import type { GameState } from "./game.js";

export interface ClientToServerEvents {
  "game:create": () => void;
  "game:join": (gameId: string) => void;
  "game:move": (position: number) => void;
  "game:leave": () => void;
}

export interface ServerToClientEvents {
  "game:created": (data: { gameId: string; yourSymbol: "X" | "O" }) => void;
  "game:joined": (data: { game: GameState; yourSymbol: "X" | "O" }) => void;
  "game:updated": (game: GameState) => void;
  "game:error": (message: string) => void;
  "game:playerLeft": (message: string) => void;
  "game:finished": (result: {
    winner: "X" | "O" | "draw";
    message: string;
  }) => void;
}

export interface SocketData {
  gameId?: string;
  playerId: string;
  playerSymbol?: "X" | "O";
}
