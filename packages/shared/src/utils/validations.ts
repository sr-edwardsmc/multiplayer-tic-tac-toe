import type { Board } from "../types/game.js";
import { WINNING_LINES } from "../constants/game.js";

export function isValidPosition(position: number): boolean {
  return position >= 0 && position <= 8;
}

export function isCellEmpty(board: Board, position: number): boolean {
  return board[position] === null;
}

export function checkWinner(board: Board): {
  winner: "X" | "O" | null;
  line: number[] | null;
} {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const cellA = board[a];
    const cellB = board[b];
    const cellC = board[c];

    if (cellA && cellA === cellB && cellA === cellC) {
      return { winner: cellA as "X" | "O", line: [...line] };
    }
  }

  return { winner: null, line: null };
}

export function checkDraw(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

export function getGameResult(board: Board) {
  const { winner, line } = checkWinner(board);

  if (winner) {
    return { winner, line, isDraw: false };
  }

  const isDraw = checkDraw(board);

  if (isDraw) {
    return { winner: "draw" as const, line: null, isDraw: true };
  }

  return { winner: null, line: null, isDraw: false };
}
