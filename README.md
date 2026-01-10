# Multiplayer Real-Time Tic Tac Toe

A modern implementation of the classic tic-tac-toe game with real-time multiplayer capabilities. Built as a monorepo using TypeScript, React, and Node.js with WebSocket integration for instant game synchronization between players.

## Project Overview

This is a full-stack multiplayer game designed to demonstrate modern web development practices. Two players can connect to the same game session in real-time, and every move is instantly reflected for both participants. The application uses a client-server architecture with WebSocket communication to maintain synchronized game state across distributed clients.

The project showcases how to structure a scalable TypeScript-based monorepo, share types and utilities across applications, and build a responsive real-time user interface with proper state management.

## Project Structure

The monorepo is organized using pnpm workspaces, which allows us to manage multiple packages with shared dependencies and common tooling. This approach keeps the codebase organized while enabling code reuse across the client and server applications.

```
tic-tac-toe-2026/
├── apps/
│   ├── server/          # Node.js/Express WebSocket server
│   └── ui/              # React frontend application
├── packages/
│   └── shared/          # Shared types, constants, and utilities
├── pnpm-workspace.yaml  # Workspace configuration
└── tsconfig.base.json   # Base TypeScript configuration
```

### Why pnpm Workspaces?

We chose pnpm workspaces over traditional npm/yarn approaches for several reasons. First, pnpm provides efficient disk space usage through a content-addressable file system. Second, workspaces allow us to declare internal dependencies clearly using the `workspace:*` protocol, which prevents version mismatches between packages. Finally, the structure enforces logical separation of concerns while maintaining type safety across the entire project.

## Technology Stack

**Frontend:**

- React 19 with TypeScript
- Vite for fast development and optimized builds
- Socket.IO Client for real-time WebSocket communication
- Custom CSS with a futuristic dark mode aesthetic

**Backend:**

- Express 5 for HTTP server and REST endpoints
- Socket.IO for WebSocket server implementation
- TypeScript for type safety
- CORS enabled for cross-origin requests

**Shared:**

- TypeScript type definitions for game state and events
- Game logic utilities (win detection, move validation)
- Constants and type exports used by both client and server

## Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm 8 or higher (see package.json for exact version)

### Installation

```bash
# Install dependencies across all workspaces
pnpm install

# Run development servers for both frontend and backend
pnpm dev

# In separate terminals:
pnpm --filter @tictactoe/server dev
pnpm --filter tic-tac-toe-2026 dev
```

### Building for Production

```bash
pnpm build
```

Each package has its own build configuration. The server generates JavaScript output in the `dist` directory, while the UI creates an optimized bundle in `dist`.

---

## Frontend Architecture (UI)

The React application is built with a component-driven architecture that keeps the game logic separate from UI rendering. The application maintains local state for user input and delegates game state management to a custom WebSocket hook.

### Component Structure

The UI is organized around two primary components:

**App.tsx** - Root component that manages lobby and game flow. Handles user authentication (socket connection), game creation/joining, and conditional rendering between the lobby screen and active game. It also manages the connection status indicator and passes game callbacks to child components.

**Game/Game.tsx** - Game board component that renders the 3x3 grid and handles move submissions. Receives the current game state and user symbol as props, then calls the appropriate move handler when a cell is clicked. Includes validation to prevent invalid moves (clicking occupied cells or playing out of turn).

**Board/Board.tsx** - Placeholder component for potential future expansion, such as separate board visualization logic.

### State Management with useSocket Hook

The core of the UI's real-time functionality lives in `hooks/useSocket.ts`. This custom hook abstracts all Socket.IO communication away from React components, making the code more testable and reusable.

The hook maintains three pieces of state:

- `isConnected` - Boolean flag for socket connection status
- `gameState` - The current game object with board, players, and turn information
- `userSymbol` - The player's assigned symbol (X or O)

When the component mounts, the hook establishes a WebSocket connection to the backend server. It then sets up event listeners for:

- `game:created` - Fired when the player creates a new game
- `game:joined` - Fired when the player successfully joins an existing game
- `game:updated` - Fired whenever any player makes a move, synchronizing state
- `game:left` - Fired when the opposing player leaves

The hook exposes simple methods (`createGame`, `joinGame`, `makeMove`, `leaveGame`) that emit events to the server. The server responds with updated state, which the hook captures and stores in React state.

### Real-Time Communication Flow

When a player clicks a cell to make a move, the following happens:

1. React component calls `makeMove(position)`
2. Hook emits `game:move` to the server with game ID and position
3. Server validates the move and updates its internal game state
4. Server broadcasts `game:updated` to both players with new state
5. Hook receives `game:updated` and updates React state
6. Component re-renders with new board position

This event-driven architecture ensures both clients stay synchronized without needing to poll for updates.

### Styling and Design

The UI features a futuristic dark mode design with red and yellow accent colors. The application uses a single CSS file (`App.css`) that applies a cohesive visual system across all components. The design emphasizes visual feedback through glowing effects, color transitions, and scale animations to create an engaging user experience.

---

## Backend Architecture (Server)

The server is a lightweight Express application that manages game state and orchestrates real-time communication between connected players. Rather than using a complex state management library, the server maintains game state in memory using a simple Map structure, which is sufficient for this application's scope.

### Server Setup

The server starts by configuring Express with CORS (Cross-Origin Resource Sharing) to allow requests from the frontend. A health check endpoint at `/health` returns the server status for monitoring. The HTTP server is then wrapped with Socket.IO to enable WebSocket communication.

### Game Manager Class

The core game logic resides in `GameManager.ts`, which is a class responsible for:

- Creating new games with unique IDs
- Managing player joins and ensuring only two players per game
- Processing move validation and turn management
- Detecting win conditions using shared utility functions
- Cleaning up games when both players disconnect

The GameManager maintains a Map of active games, keyed by game ID. Each game object contains the board state, current player, player assignments, game status, and result information.

### Game Flow and Validation

When a player attempts to make a move, the GameManager validates:

1. The game exists and is in playing state
2. The move is from the player whose turn it is
3. The position is valid (0-8) and not already occupied

After a valid move, the GameManager:

1. Updates the board at the specified position
2. Uses shared utility functions to check for a winner or draw
3. Sets game status to "finished" if the game is over
4. Switches the current player if the game continues

### Socket.IO Integration

Socket events are configured in `config/sockets.ts`. The server listens for:

- `game:create` - Initializes a new game and assigns the creator as player X
- `game:join` - Adds a second player to an existing game
- `game:move` - Processes a player's move and updates all connected clients
- `game:leave` - Handles player disconnection and cleanup

When events are received, the GameManager processes them and the server broadcasts the updated game state to both players via the `game:updated` event.

### Type Safety Across Events

The Socket.IO implementation uses TypeScript generic types to ensure type safety for events. The server types its Socket as `Socket<ServerToClientEvents, ClientToServerEvents>`, which is defined in the shared package. This prevents runtime errors from misnamed events or incorrect data shapes.

### Scalability Considerations

The current implementation stores games in memory, which means they're lost if the server restarts and don't scale to multiple server instances. For production, this could be extended with Redis for distributed state management or a database like PostgreSQL. The architecture is designed to make these changes straightforward—the GameManager interface could remain the same while swapping the storage backend.

---

## Shared Package

The `packages/shared` directory exports types, constants, and utilities used by both the client and server. This prevents duplication and ensures both applications use the same definitions.

### Types

The shared package defines critical types:

- `GameState` - Complete game object with board, players, status
- `Board` - Array type for the 3x3 game board
- `Player` - Union type for X or O
- `ServerToClientEvents` - Socket event types sent from server to client
- `ClientToServerEvents` - Socket event types sent from client to server

### Utilities

The `utils/validations.ts` exports game logic functions:

- `getGameResult()` - Analyzes the board and returns winner/draw status and winning line
- `isValidPosition()` - Validates move positions (0-8)

These utilities are imported and used on the server to maintain consistent game rules, and can be imported on the client for optimistic UI updates if needed.

### Constants

Game constants like board size and player symbols are defined once and imported everywhere, reducing the risk of inconsistencies.

---

## Development Workflow

### Running in Development

The monorepo root provides convenient scripts:

```bash
# Run all development servers in parallel
pnpm dev

# Run specific workspace
pnpm --filter @tictactoe/server dev
pnpm --filter tic-tac-toe-2026 dev

# Type check across all packages
pnpm type-check

# Lint all packages
pnpm lint
```

The frontend runs on `http://localhost:5173` (Vite default) and the server on `http://localhost:3000` by default.

### Making Changes

Since packages are linked via the workspace, changes to the shared package are immediately reflected in other packages without rebuilding. This accelerates development. TypeScript's strict mode helps catch type mismatches before runtime.

### Testing Your Changes

When developing new features:

1. Start both servers: `pnpm dev`
2. Open the frontend in a browser
3. Open a second browser tab or window (also on localhost:5173)
4. Create a game in one tab and join in the other
5. Play and verify the real-time synchronization works

---

## Design Decisions

### TypeScript

Every file in this project is TypeScript. While JavaScript might be faster to write initially, TypeScript prevents entire categories of bugs and makes refactoring safer. In a real-time game where state synchronization is critical, type safety significantly reduces bugs.

### Socket.IO over Raw WebSockets

Socket.IO adds automatic reconnection logic, fallback transport mechanisms, and room/namespace support over raw WebSockets. For a production application, these features are worth the slight additional overhead.

### In-Memory Game State

The current approach keeps games in memory. This is fine for a prototype but would need to change for production. The GameManager class is designed so the storage layer could be swapped without changing the public API.

### Single CSS File

Rather than component-scoped styles, the application uses a single CSS file. This makes it easier to maintain a cohesive design system and ensures consistent spacing, colors, and animations across components. For larger applications, a CSS-in-JS solution or Tailwind might be preferable.

---

## Future Enhancements

Potential improvements for future versions:

- Game history and replay functionality
- Player ratings and leaderboard
- Different game variants (larger boards, different rules)
- Spectator mode for watching other players
- Persistent storage for games and player data
- Authentication and user accounts
- Mobile app version using React Native

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.
