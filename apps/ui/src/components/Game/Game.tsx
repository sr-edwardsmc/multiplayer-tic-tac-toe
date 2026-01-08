import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

import type { BoardStatus } from "../../types/Game";
import Board from "../Board/Board";

const socket: Socket = io("http://localhost:3000");

function Game() {
  const [gameId, setGameId] = useState<string | null>();
  const [boardState, setBoardState] = useState<BoardStatus>(
    Array(9).fill(null)
  );
  const [gameStatus, setGameStatus] = useState<string>("");

  useEffect(() => {
    socket.on("game:created", (gameId: string) => {
      setGameId(gameId);
    });
  }, []);

  const handleCreateGame = () => {
    socket.emit("game:create");
  };

  const handleCellClick = (selectedIndex: number) => {};

  const handleRestartGame = () => {
    setBoardState(Array(9).fill(null));
  };

  return (
    <section className="game">
      {gameId && <h2 className="game-status">{gameStatus}</h2>}
      {!gameId && <button onClick={handleCreateGame}>Create new game</button>}
      {gameId && (
        <>
          <section className="game-board">
            <Board squares={boardState} handleCellClick={handleCellClick} />
          </section>
          <section className="board-actions">
            <button onClick={handleRestartGame}>Restart Game</button>
          </section>
        </>
      )}
    </section>
  );
}

export default Game;
