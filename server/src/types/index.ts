export interface ClientToServerEvents {
  joinRoom: (roomId: string) => void;
  makeMove: (roomId: string, position: number) => void;
}

export interface ServerToClientEvents {
  roomJoined: (roomId: string) => void;
  moveMade: (position: number, player: "X" | "O") => void;
  gameOver: (winner: "X" | "O" | "draw") => void;
}
