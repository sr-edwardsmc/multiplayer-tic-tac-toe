import { Board, GameResult, GameState, Player } from "./types/game.js";

export class GameManager {
  private games: Map<string, GameState> = new Map();

  constructor() {}

  createGame(playerId: string): GameState {
    const gameId: string = this.generateGameId();

    const game: GameState = {
      id: gameId,
      board: Array(9).fill(null) as Board,
      currentPlayer: "X",
      players: {
        X: playerId,
        O: null,
      },
      result: null,
      status: "waiting",
      createdAt: new Date(),
    };

    this.games.set(gameId, game);
    return game;
  }

  joinGame(gameId: string, playerId: Player): GameState | null {
    const game = this.games.get(gameId);

    if (!game) return null;

    if (game.status !== "waiting") return null;

    if (game.players.O !== null) return null;

    game.players.O = playerId;
    game.status = "playing";

    return game;
  }

  makeMove(
    gameId: string,
    playerId: string,
    position: number
  ): GameState | null {
    const game = this.games.get(gameId);

    if (!game) return null;

    if (game.status !== "playing") return null;

    if (game.players[game.currentPlayer] !== playerId) return null;

    if (position < 0 || position > 8) return null;

    if (game.board[position] !== null) return null;

    // Make the move
    game.board[position] = game.currentPlayer;

    const gameResult = this.checkGameResult(game.board);

    if (gameResult.winner !== null || gameResult.winner === "draw") {
      game.status = "finished";
      game.result = gameResult;
    } else {
      game.currentPlayer = game.currentPlayer === "X" ? "X" : "O";
    }

    return game;
  }

  removePlayer(gameId: string, playerId: string): boolean {
    const game = this.games.get(gameId);

    if (!game) return false;

    if (game.players.X === playerId) {
      game.players.X = null;
    } else {
      game.players.O = null;
    }

    if (!game.players.X && !game.players.O) {
      this.games.delete(gameId);
    } else if (game.status === "playing") {
      game.status = "finished";
      const remainingPlayer = game.players.X || game.players.O;
      game.result = {
        winner: remainingPlayer === "X" ? "X" : "O",
        winningLine: null,
      };
    }

    return true;
  }

  private checkGameResult(board: Board): GameResult {
    const winningLines = [
      [0, 1, 2], // Rows
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6], // Columns
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8], // Diagonals
      [2, 4, 6],
    ];

    for (const line of winningLines) {
      const [a, b, c] = line;
      const cellA = board[a];
      const cellB = board[b];
      const cellC = board[c];

      if (cellA && cellA === cellB && cellA === cellC) {
        return {
          winner: cellA as Player,
          winningLine: line,
        };
      }
    }

    // Check Draw
    if (board.every((cell) => cell !== null)) {
      return {
        winner: "draw",
        winningLine: null,
      };
    }

    // Game continues
    return {
      winner: null,
      winningLine: null,
    };
  }

  private generateGameId(): string {
    return Math.random().toString(36).substring(2, 9).toUpperCase();
  }
}
