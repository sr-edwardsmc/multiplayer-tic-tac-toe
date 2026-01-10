import { useState } from "react";
import "./App.css";
import Game from "./components/Game/Game";
import { UseSocket } from "./hooks/useSocket";

function App() {
  const {
    createGame,
    gameState,
    isConnected,
    joinGame,
    leaveGame,
    makeMove,
    userSymbol,
  } = UseSocket();

  const [gameIdInput, setGameIdInput] = useState<string>("");

  const handleCreateGame = () => {
    createGame();
  };

  const handleJoinGame = () => {
    const cleanInput = gameIdInput.trim();
    if (cleanInput) {
      joinGame(cleanInput);
    }
  };

  const handleLeaveGame = () => {
    leaveGame();
    setGameIdInput("");
  };

  return (
    <main>
      <section className="game-app">
        <h1>Multiplayer-Realtime Tic Tac Toe</h1>
        <div className="connection-status">
          {isConnected ? (
            <span className="connected">🟢 Connected</span>
          ) : (
            <span className="disconnected">🔴 Disconnected</span>
          )}
        </div>
        {/* {error && <div className="error-message">⚠️ {error}</div>} */}
        {!gameState && (
          <div className="lobby">
            <h2>Game Lobby</h2>

            <div className="lobby-section">
              <button
                onClick={handleCreateGame}
                disabled={!isConnected}
                className="create-game-btn"
              >
                Create New Game
              </button>
            </div>

            <div className="lobby-section">
              <h3>Or Join Existing Game</h3>
              <input
                type="text"
                placeholder="Enter Game ID"
                value={gameIdInput}
                onChange={(e) => setGameIdInput(e.target.value.toUpperCase())}
                disabled={!isConnected}
                className="game-id-input"
              />
              <button
                onClick={handleJoinGame}
                disabled={!isConnected || !gameIdInput.trim()}
                className="join-game-btn"
              >
                Join Game
              </button>
            </div>
          </div>
        )}

        {gameState && userSymbol && (
          <div className="game-container">
            <div className="game-header">
              <h2>Game ID: {gameState.id}</h2>
              <button onClick={handleLeaveGame} className="leave-game-btn">
                Leave Game
              </button>
            </div>

            <Game
              gameState={gameState}
              userSymbol={userSymbol}
              onMove={makeMove}
            />

            <div className="game-info-panel">
              {gameState.status === "waiting" && (
                <p className="waiting-message">
                  Waiting for opponent... Share game ID:{" "}
                  <strong>{gameState.id}</strong>
                </p>
              )}

              {gameState.status === "playing" && (
                <p className="playing-message">
                  {gameState.currentPlayer === userSymbol
                    ? "Your turn!"
                    : "Opponent's turn..."}
                </p>
              )}

              {gameState.status === "finished" && gameState.result && (
                <div className="game-finished">
                  {gameState.result.winner === "draw" ? (
                    <p className="draw-message">It's a draw!</p>
                  ) : gameState.result.winner === userSymbol ? (
                    <p className="win-message">You won!</p>
                  ) : (
                    <p className="lose-message">You lost!</p>
                  )}
                  <button onClick={handleLeaveGame} className="new-game-btn">
                    Start New Game
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
