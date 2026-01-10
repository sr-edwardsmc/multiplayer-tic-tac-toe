import type { GameState, Player } from "@tictactoe/shared";

interface GameProps {
  gameState: GameState;
  onMove: (position: number) => void;
  userSymbol: Player;
}

function Game({ gameState, onMove, userSymbol }: GameProps) {
  const isYourTurn = gameState.currentPlayer === userSymbol;
  const isGameFinished = gameState.status === "finished";

  const handleCellClick = (position: number) => {
    if (!isYourTurn || isGameFinished || gameState.board[position] !== null) {
      return;
    }

    onMove(position);
  };

  const isCellInWinningLine = (position: number) => {
    if (gameState.result?.winningLine) return false;
    return gameState.result?.winningLine?.includes(position);
  };

  return (
    <div className="game-board">
      <div className="player-info">
        <p>You are: {userSymbol}</p>
        <p>Current turn: {gameState.currentPlayer}</p>
        <p>Status: {isYourTurn ? "Your turn!" : "Opponent's turn"}</p>
      </div>

      <div className="board-grid">
        {gameState.board.map((cell, index) => (
          <button
            key={index}
            className={`cell ${isCellInWinningLine(index) ? "winning" : ""}`}
            onClick={() => handleCellClick(index)}
            disabled={!isYourTurn || isGameFinished || cell !== null}
          >
            {cell || ""}
          </button>
        ))}
      </div>

      {isGameFinished && gameState.result && (
        <div className="game-result">
          {gameState.result.winner === "draw"
            ? "It's a draw!"
            : `Player ${gameState.result.winner} wins!`}
        </div>
      )}
    </div>
  );
}

export default Game;
