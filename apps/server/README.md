# Tic Tac Toe Server

The Node.js backend server that manages game state and orchestrates real-time communication between players. Built with Express and Socket.IO, the server acts as the single source of truth for all game state.

## Overview

The server is a lightweight application with a focused responsibility: maintain accurate game state and broadcast updates to connected clients. It doesn't persist data to a database (games exist only while the server is running), making it ideal for a real-time game session.

The server handles:

- HTTP server setup with Express
- WebSocket connection management with Socket.IO
- Game creation and join logic
- Move validation and game rule enforcement
- Win condition detection
- Automatic cleanup when players disconnect

## Architecture

### Server Startup

The application initializes in `server.ts`:

1. Create an Express app
2. Configure CORS to allow requests from the frontend
3. Set up a health check endpoint for monitoring
4. Create an HTTP server (required for Socket.IO)
5. Initialize Socket.IO with the HTTP server
6. Listen on port 3000 (or environment variable PORT)

```typescript
const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
const io = setupSocketIO(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

CORS configuration allows requests from the frontend (default: localhost:5173) and is configurable via environment variables for different deployment environments.

### GameManager Class

The `GameManager` class is the core of game logic. It's instantiated once when the server starts and maintains an in-memory Map of active games.

**Game Storage:**

```typescript
private games: Map<string, GameState> = new Map();
```

Each game is keyed by its ID (a short alphanumeric string) and contains the complete game state.

**Core Methods:**

`createGame(playerId: string): GameState`

Creates a new game assigned to a player. The method:

1. Generates a unique game ID
2. Initializes the board as an array of 9 nulls
3. Sets the creator as player X
4. Marks the game as "waiting" for a second player
5. Stores the game in the Map
6. Returns the game object

The game ID is generated using a simple approach: if you need better collision resistance, replace with a UUID library.

`joinGame(gameId: string, playerId: string): GameState | null`

Adds a second player to an existing game. Returns null if:

- The game doesn't exist
- The game isn't in "waiting" status
- A player has already joined (game already has player O)

If successful:

1. Assigns the new player as player O
2. Marks the game as "playing"
3. Returns the updated game object

`makeMove(gameId: string, playerId: string, position: number): GameState | null`

Processes a player's move. Validates:

1. The game exists and is in "playing" state
2. It's the player's turn
3. The position is valid (0-8) and unoccupied

If validation passes:

1. Places the player's symbol on the board
2. Calls `getGameResult()` from the shared package to detect wins or draws
3. If game is finished, sets status and result
4. If game continues, switches the current player
5. Returns the updated game

`getGame(gameId: string): GameState | undefined`

Simple getter that retrieves a game by ID. Used to fetch current state when players need it.

`removePlayer(gameId: string, playerId: string): boolean`

Handles player disconnection. Removes the player from their game and:

1. If both players are gone, deletes the game entirely
2. If only one player remains, marks the game as "finished" (giving the other player a win)

### Socket.IO Integration

Socket events are configured in `config/sockets.ts`. This file sets up event handlers for all client messages and broadcasts updates back to clients.

**Client to Server Events:**

`game:create` - Player wants to create a new game

```typescript
socket.on("game:create", (callback) => {
  const gameState = gameManager.createGame(socket.id);
  socket.emit("game:created", {
    gameId: gameState.id,
    userSymbol: "X",
  });
});
```

The creator is always assigned as X. The callback pattern allows the client to respond with any additional data needed.

`game:join` - Player wants to join an existing game

```typescript
socket.on("game:join", ({ gameId }, callback) => {
  const gameState = gameManager.joinGame(gameId, socket.id);
  if (gameState) {
    socket.emit("game:joined", {
      game: gameState,
      userSymbol: "O",
    });
    // Broadcast to other player
    socket.broadcast.emit("game:updated", gameState);
  }
});
```

When successful, both players are notified (the joining player receives "game:joined", the waiting player receives "game:updated").

`game:move` - Player makes a move

```typescript
socket.on("game:move", ({ gameId, position }) => {
  const gameState = gameManager.makeMove(gameId, socket.id, position);
  if (gameState) {
    // Broadcast updated state to both players
    io.to(gameId).emit("game:updated", gameState);
  }
});
```

After a move, the updated state is broadcast to all sockets in the game's room (both players).

`disconnect` - Socket.IO event when player leaves

```typescript
socket.on("disconnect", () => {
  // Remove player from their game
  // Other player gets notified
});
```

### Room Management

Socket.IO rooms group sockets. When a game is created or joined, players are added to a room named after the game ID:

```typescript
socket.join(gameId);
```

This allows broadcasting to only the players in that game:

```typescript
io.to(gameId).emit("game:updated", gameState);
```

Without rooms, we'd need to track socket IDs manually, which is more complex.

## Data Flow

### Game Creation Flow

```
Client                          Server
  |-- game:create emit ----------->|
  |                               | Create game with gameManager
  |<----------- game:created ------|
  | (gameId, userSymbol=X)        |
```

### Move Flow

```
Client 1                     Server                    Client 2
  |-- game:move emit -------->|
  |                           | Validate & update
  |                           |-- game:updated ------->|
  |<------ game:updated ------| (both players notified)|
```

Both players receive the updated state immediately after a move.

### Disconnect Flow

```
Client                          Server
  |                            |
  | (disconnect event)         |
  |<----------- disconnect ---|
  |                            | Remove player from game
  |                            | If opponent exists:
  |                            |<-- notify opponent
```

## Game State Model

The server maintains this structure for each game:

```typescript
interface GameState {
  id: string; // Unique game ID
  board: Board; // 9-element array (null or "X" or "O")
  currentPlayer: Player; // "X" or "O"
  players: {
    X: string; // Player X's socket ID
    O: string | null; // Player O's socket ID (null if waiting)
  };
  result: {
    winner: Player | "draw" | null;
    winningLine: number[] | undefined;
  } | null; // null if game in progress
  status: "waiting" | "playing" | "finished";
  createdAt: Date; // For potential stats/logging
}
```

The board array uses indices 0-8 representing:

```
0 | 1 | 2
---------
3 | 4 | 5
---------
6 | 7 | 8
```

## Validation and Rules

### Move Validation

Before a move is allowed, the server checks:

1. **Game exists:** Is there an active game with this ID?
2. **Game is playing:** Game status must be "playing", not "waiting" or "finished"
3. **Player's turn:** Does the requesting player control the current player?
4. **Valid position:** Is the position between 0-8?
5. **Cell empty:** Is the cell unoccupied (null)?

If any check fails, the move is rejected and the client is not sent an update. The client will notice when the server doesn't respond.

### Win Detection

Win detection is delegated to `getGameResult()` in the shared package. The function checks:

1. All three rows for three of the same symbol
2. All three columns for three of the same symbol
3. Both diagonals for three of the same symbol
4. All nine cells filled (draw condition)

It returns the winner (if any), the winning line indices, and whether it's a draw.

## Development

### Running the Server

```bash
# Start with hot reload (watches for file changes)
pnpm dev

# Or in the server directory:
pnpm --filter @tictactoe/server dev
```

The dev script uses `tsx watch` for fast TypeScript execution with live reload.

### Building

```bash
# Compile TypeScript to JavaScript
pnpm build

# Check types without emitting
pnpm type-check
```

### Testing Connections

Use WebSocket client tools to test:

```bash
# Using websocat (install via brew or similar)
websocat ws://localhost:3000/socket.io/

# Or use the provided frontend UI
# Open http://localhost:5173 in two browser tabs
```

## Environment Configuration

The server respects these environment variables:

```bash
PORT=3000                          # HTTP/WS server port
CLIENT_URL=http://localhost:5173   # Allowed CORS origin
NODE_ENV=production                # (not currently used)
```

For local development, defaults are fine. For production deployment, set CORS origin to your actual client URL.

## Performance Characteristics

### Memory Usage

Each game object is roughly 200 bytes (varies by payload size). With 1000 concurrent games, that's about 200KB, which is negligible.

### Latency

Game updates are broadcast immediately after validation. Network latency is the dominant factor (typically 10-100ms for local connections).

### Scalability Limits

The current implementation has these limitations:

1. **Single Server:** All games must fit in one server's memory
2. **No Persistence:** Games vanish if the server restarts
3. **No Backup:** If the server crashes mid-game, players lose their game

For production:

- Use a database (PostgreSQL, MongoDB) for game storage
- Use Redis for fast, real-time state
- Run multiple server instances behind a load balancer
- Use Socket.IO's Redis adapter for multi-instance socket broadcasting

These changes wouldn't alter the public interface of GameManager or the Socket.IO event structure.

## Error Handling

The current implementation has minimal error handling because:

1. Game operations rarely fail (validation prevents it)
2. Network errors are handled at the Socket.IO level
3. The consequence of silent failures is acceptable (client reloads)

For production, consider:

1. Logging move rejections to debug invalid client behavior
2. Notifying clients of specific error reasons
3. Metrics on game duration, win rates, etc.

## Future Enhancements

- Database persistence for game history
- Player authentication and accounts
- ELO rating system
- Matchmaking queue
- Spectator mode
- Game replays
- Anti-cheat measures
- Rate limiting to prevent abuse
