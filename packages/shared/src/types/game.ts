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

export interface PlayerInfo {
  id: string;
  symbol: Player;
}
