import type { Board, GameState } from "@tictactoe/shared";
import { getGameResult, isValidPosition } from "@tictactoe/shared/utils";

export class GameManager {
  private games: Map<string, GameState> = new Map();

  createGame(playerId: string): GameState {
    const gameId = this.generateGameId();
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

  joinGame(gameId: string, playerId: string): GameState | null {
    const game = this.games.get(gameId);

    if (!game || game.status !== "waiting" || game.players.O !== null) {
      return null;
    }

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

    if (!game || game.status !== "playing") {
      return null;
    }

    if (game.players[game.currentPlayer] !== playerId) {
      return null;
    }

    if (!isValidPosition(position) || game.board[position] !== null) {
      return null;
    }

    // Make the move
    game.board[position] = game.currentPlayer;

    // Check game result using shared utility
    const result = getGameResult(game.board);

    if (result.winner !== null || result.isDraw) {
      game.status = "finished";
      game.result = {
        winner: result.winner,
        winningLine: result.line,
      };
    } else {
      // Switch player
      game.currentPlayer = game.currentPlayer === "X" ? "O" : "X";
    }

    return game;
  }

  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  removePlayer(gameId: string, playerId: string): boolean {
    const game = this.games.get(gameId);

    if (!game) {
      return false;
    }

    if (game.players.X === playerId) {
      game.players.X = null;
    } else if (game.players.O === playerId) {
      game.players.O = null;
    }

    if (!game.players.X && !game.players.O) {
      this.games.delete(gameId);
    } else if (game.status === "playing") {
      game.status = "finished";
      game.result = {
        winner: game.players.X ? "X" : "O",
        winningLine: null,
      };
    }

    return true;
  }

  private generateGameId(): string {
    return Math.random().toString(36).substring(2, 9).toUpperCase();
  }

  cleanupOldGames(maxAge: number = 3600000): void {
    const now = new Date().getTime();

    for (const [gameId, game] of this.games.entries()) {
      const age = now - game.createdAt.getTime();
      if (age > maxAge) {
        this.games.delete(gameId);
      }
    }
  }
}
