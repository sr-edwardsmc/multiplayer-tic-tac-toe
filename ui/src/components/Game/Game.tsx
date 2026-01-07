import { useState } from "react";
import type { BoardStatus } from "../../types/Game";
import Board from "../Board/Board";

function Game() {
  const [boardState, setBoardState] = useState<BoardStatus>(
    Array(9).fill(null)
  );
  const [isXNext, setIsXNext] = useState<boolean>(false);

  const calculateWinner = (squares: BoardStatus) => {
    const matches = [
      [0, 1, 2],
      [3, 4, 5], // Horizontal
      [6, 7, 8],
      // ------
      [0, 3, 6],
      [1, 4, 7], // Vertical
      [2, 5, 8],
      // ------
      [0, 4, 8], // Diagonal
      [6, 4, 2],
    ];

    for (let i = 0; i < matches.length; i++) {
      const [a, b, c] = matches[i];
      if (
        squares[a] &&
        squares[a] === squares[c] &&
        squares[b] &&
        squares[b] === squares[c]
      ) {
        return squares[a];
      }
    }
    return null;
  };

  const checkForTie = (): boolean => {
    const choices = boardState.filter((square) => square !== null);
    if (choices.length === 9 && !winner) return true;
    return false;
  };

  const handleCellClick = (selectedIndex: number) => {
    if (boardState[selectedIndex] || winner) return;

    const newBoard = [...boardState];
    newBoard[selectedIndex] = isXNext ? "X" : "O";
    setBoardState(newBoard);
    setIsXNext(!isXNext);
  };

  const handleRestartGame = () => {
    setBoardState(Array(9).fill(null));
  };

  const winner = calculateWinner(boardState);

  const status = winner
    ? `Winner is: ${winner}`
    : checkForTie()
    ? "TIE!"
    : `Next: ${isXNext ? "X" : "O"}`;

  return (
    <section className="game">
      <h2 className="game-status">{status}</h2>
      <section className="game-board">
        <Board squares={boardState} handleCellClick={handleCellClick} />
      </section>
      <section className="board-actions">
        <button onClick={handleRestartGame}>Restart Game</button>
      </section>
    </section>
  );
}

export default Game;
