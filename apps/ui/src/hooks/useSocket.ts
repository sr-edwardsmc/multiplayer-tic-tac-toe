import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  GameState,
  Player,
} from "@tictactoe/shared";
import { useEffect, useRef, useState } from "react";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function UseSocket() {
  const socketRef = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [userSymbol, setUserSymbol] = useState<Player | null>(null);

  useEffect(() => {
    const socketInstance: TypedSocket = io("http://localhost:3000");

    socketInstance.on("connect", () => {
      console.log("Socket connected to server");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected from server");
    });

    socketInstance.on("game:created", (data) => {
      const { gameId, userSymbol } = data;
      setUserSymbol(userSymbol);
      console.log("Game successfully created: ", gameId);
    });

    socketInstance.on("game:joined", (data) => {
      const { game, userSymbol } = data;
      setGameState(game);
      setUserSymbol(userSymbol);
    });

    socketInstance.on("game:updated", (gameState) => {
      setGameState(gameState);
    });

    socketRef.current = socketInstance;

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const createGame = () => {
    socketRef.current?.emit("game:create");
  };

  const joinGame = (gameId: string) => {
    socketRef.current!.emit("game:join", gameId);
  };

  const makeMove = (position: number) => {
    socketRef.current?.emit("game:move", position);
  };

  const leaveGame = () => {
    socketRef.current?.emit("game:leave");
    setGameState(null);
    setUserSymbol(null);
  };

  return {
    socketRef,
    isConnected,
    gameState,
    userSymbol,
    createGame,
    joinGame,
    makeMove,
    leaveGame,
  };
}
