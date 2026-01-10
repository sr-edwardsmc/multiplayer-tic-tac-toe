# Tic Tac Toe UI

The React frontend application for the real-time multiplayer tic-tac-toe game. This is a client-side rendering application built with Vite for fast development and optimized production builds.

## Overview

The UI is a single-page application that connects to the backend server via WebSocket. Players interact with the application to create new games, join existing ones, and play in real-time against opponents. The application automatically syncs game state across all connected clients.

## Architecture

### Component Hierarchy

The application follows a simple component tree:

```
App (root component)
├── Connection Status Display
├── Lobby (conditional)
│   ├── Create Game Button
│   └── Join Game Input & Button
└── Game (conditional)
    ├── Player Info
    └── Board Grid
        └── Cell Buttons
```

This keeps the component structure shallow and easy to understand. Each component has a single responsibility.

### State Management Strategy

Rather than a centralized state manager like Redux, this application uses React's built-in hooks and a custom `useSocket` hook. The main rationale: for a single-feature application, Redux introduces unnecessary complexity.

The `useSocket` hook maintains the core application state:

```typescript
interface SocketState {
  isConnected: boolean; // WebSocket connection status
  gameState: GameState | null; // Current game or null if in lobby
  userSymbol: Player | null; // X or O
}
```

Components read from this state and dispatch actions through methods exposed by the hook: `createGame()`, `joinGame()`, `makeMove()`, `leaveGame()`.

### WebSocket Connection Lifecycle

When the App mounts:

1. The `useSocket` hook initializes a Socket.IO client pointing to the server
2. A connection event listener fires when the WebSocket handshake completes
3. The hook broadcasts that the client is connected and ready
4. If a player was in the middle of a game, they can receive the updated state

When the component unmounts:

1. The cleanup function in useEffect disconnects the socket
2. The server's disconnect handler removes the player from their current game
3. Other connected players receive a game:updated event with the opponent's player set to null

## Key Features

### Real-Time Synchronization

Every move is instantly broadcast to both players. When a move occurs:

1. The client emits a `game:move` event with the position
2. The server validates and updates its internal state
3. The server broadcasts `game:updated` with the new state to both clients
4. Both clients update their local React state
5. Components re-render with the new board position

This architecture ensures that even with network latency, both players see the same game state.

### Game Validation

The application prevents invalid moves at the UI layer, though the server also validates. Invalid moves are prevented because:

- Disabled cells can't be clicked once occupied
- The join game button is disabled if no game ID is provided
- Buttons are disabled when disconnected from the server

This prevents users from even attempting invalid actions.

### User Feedback

The application provides clear feedback on the game state:

- Connection status at the top of the page
- Game ID displayed when a game is created (users copy this to invite others)
- Turn indicator showing whose turn it is
- Visual highlighting of whose symbol (X or O) the player controls
- Result message upon game completion

### Responsive Design

The CSS includes media queries for mobile devices. On screens smaller than 600px, the board scales down and padding is reduced to fit the viewport. The application remains playable on phones and tablets.

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application runs on `http://localhost:5173` by default.

### Build

```bash
# Build for production
pnpm build

# Preview production build locally
pnpm preview
```

### Type Checking

```bash
# Run TypeScript compiler in check mode
pnpm type-check
```

This catches type errors without emitting JavaScript.

### Linting

```bash
# Run ESLint
pnpm lint
```

The configuration enforces React and TypeScript best practices.

## Styling

The application uses a single `App.css` file. The style sheet is organized into logical sections:

1. Global styles (\*, body, html)
2. Component-level styles (.app, .lobby, .game-board, etc.)
3. Interactive element styles (.cell, buttons)
4. Responsive styles (@media queries)
5. Animations (@keyframes)

The design uses a futuristic dark theme with red (#ff3333) and yellow (#ffaa00) accent colors. Effects include:

- Gradient backgrounds and text
- Glowing shadows (box-shadow with rgba colors)
- Scale and translation transforms on hover
- Smooth transitions (0.3s) on interactive elements
- Animated pulse effect on winning cells

## Hooks and Utilities

### useSocket Hook

This custom hook encapsulates all Socket.IO communication logic. It:

- Manages the Socket.IO client instance
- Maintains game state and connection status
- Exposes methods for game actions
- Handles automatic cleanup on unmount

The hook returns an object with these properties and methods:

```typescript
{
  isConnected: boolean,
  gameState: GameState | null,
  userSymbol: Player | null,
  createGame: () => void,
  joinGame: (gameId: string) => void,
  makeMove: (position: number) => void,
  leaveGame: () => void
}
```

## Component Details

### App Component

**Responsibilities:**

- Render the header and title
- Display connection status
- Conditionally show lobby or game screen
- Pass game callbacks to Game component
- Handle game creation and joining

**Props:** None (uses custom hook instead)

**State:**

- `gameIdInput` - Controlled input for joining games

### Game Component

**Responsibilities:**

- Display current game state
- Render the board grid
- Handle cell clicks for moves
- Show player info and turn indicator
- Display result when game finishes

**Props:**

- `gameState: GameState`
- `onMove: (position: number) => void`
- `userSymbol: Player`

**State:** None (all state passed via props)

## Common Issues and Troubleshooting

### Connection Failed

If the page shows "Disconnected", check:

1. Is the backend server running? (`pnpm --filter @tictactoe/server dev`)
2. Is the server on the correct port? (Default: 3000)
3. Check browser console for error messages

### Game State Out of Sync

If the board shows different positions for each player:

1. Refresh the page (note: this loses the current game)
2. Check the server logs for any errors
3. Verify both clients received `game:updated` events

### Styling Issues

If styles look broken:

1. Check that `App.css` wasn't modified by accident
2. Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. Verify Google Fonts are loading (check network tab in dev tools for `fonts.googleapis.com`)

## Performance Considerations

### Socket Event Volume

Each move generates one `game:move` event from the client and one `game:updated` broadcast. This is a low volume of traffic and poses no scalability concerns for a typical game (which rarely lasts more than a few minutes).

### Component Re-renders

When `gameState` changes, the entire Game component and its children re-render. This is fine for a 3x3 grid, but if the board were larger, consider memoization with React.memo or splitting cells into separate components.

### Bundle Size

The production build (after minification) is small because:

- React and React DOM are essential dependencies
- Socket.IO client is required for real-time features
- No large third-party libraries for styling or state management
- CSS is hand-written rather than generated

## Future Improvements

- Show game history or stats
- Add sound effects for moves and win/loss
- Implement spectator mode
- Add undo/redo functionality
- Support for different board sizes
- Animated transitions between game states
- Dark/light theme toggle
