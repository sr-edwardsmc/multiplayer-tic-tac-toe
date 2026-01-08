export type Cell = "X" | "O" | null;

export type Board = [Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell];

export type Player = "X" | "O";

export type GameStatus = "waiting" | "playing" | "finished";

export interface GameResult {
  winner: Player | "draw" | null;
  winningLine: number[] | null;
}

export interface GameState {
  id: string;
  board: Board;
  currentPlayer: Player;
  players: {
    X: string | null;
    O: string | null;
  };
  status: GameStatus;
  result: GameResult | null;
  createdAt: Date;
}

export interface ServerToClientEvents {
  "game:created": (gameId: string) => void;
  "game:joined": (game: GameState) => void;
  "game:updated": (game: GameState) => void;
  "game:error": (message: string) => void;
  "game:playerLeft": (message: string) => void;
}

export interface ClientToServerEvents {
  "game:create": () => void;
  "game:join": (gameId: string) => void;
  "game:move": (position: number) => void;
  "game:leave": () => void;
}

export interface SocketData {
  playerId: string;
  gameId?: string;
}
