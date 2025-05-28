import { Piece, PieceType, Color, Position, GameState } from '../types/game.types';

// Define all piece shapes relative to their origin (0,0)
const PIECE_DEFINITIONS: Record<PieceType, [number, number][]> = {
  monomino: [[0, 0]],
  domino: [[0, 0], [1, 0]],
  I3: [[0, 0], [1, 0], [2, 0]],
  L3: [[0, 0], [0, 1], [1, 0]],
  I4: [[0, 0], [1, 0], [2, 0], [3, 0]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  L4: [[0, 0], [0, 1], [0, 2], [1, 0]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  T: [[0, 0], [1, 0], [2, 0], [1, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  I5: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  L5: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 0]],
  N: [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]],
  P: [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1]],
  T5: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]],
  U: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]],
  V: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]],
  W: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]],
  X: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]],
  Y: [[0, 0], [1, 0], [2, 0], [3, 0], [1, 1]],
  Z5: [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]],
};

// Create initial set of pieces for a player
export const createPlayerPieces = (color: Color): Piece[] => {
  const pieces: Piece[] = [];
  
  // Add one of each piece type
  Object.entries(PIECE_DEFINITIONS).forEach(([type, squares]) => {
    pieces.push({
      type: type as PieceType,
      color,
      squares,
      size: squares.length,
    });
  });

  return pieces;
};

// Check if a position is within board bounds
export const isWithinBounds = (position: Position, boardSize: number): boolean => {
  return position.x >= 0 && position.x < boardSize && position.y >= 0 && position.y < boardSize;
};

// Check if a piece can be placed at a specific position
export const canPlacePiece = (
  piece: Piece,
  position: Position,
  gameState: GameState
): boolean => {
  const { board } = gameState;
  const boardSize = board.length;

  // Check if all squares of the piece are within bounds
  for (const [dx, dy] of piece.squares) {
    const x = position.x + dx;
    const y = position.y + dy;
    
    if (!isWithinBounds({ x, y }, boardSize)) {
      return false;
    }

    // Check if the cell is already occupied
    if (board[y][x] !== null) {
      return false;
    }
  }

  // Check if this is the first move for this color
  const isFirstMove = !board.some(row => row.some(cell => cell === piece.color));
  
  if (isFirstMove) {
    // For first move, must place in a corner
    const coversCorner = piece.squares.some(([dx, dy]) => {
      const x = position.x + dx;
      const y = position.y + dy;
      return (x === 0 || x === boardSize - 1) && (y === 0 || y === boardSize - 1);
    });
    return coversCorner;
  }

  // For subsequent moves, must touch a piece of the same color at corners only
  let hasCornerTouch = false;
  let hasEdgeTouch = false;

  for (const [dx, dy] of piece.squares) {
    const x = position.x + dx;
    const y = position.y + dy;

    // Check all 8 surrounding cells
    for (let nx = x - 1; nx <= x + 1; nx++) {
      for (let ny = y - 1; ny <= y + 1; ny++) {
        if (nx === x && ny === y) continue;
        if (!isWithinBounds({ x: nx, y: ny }, boardSize)) continue;

        const cell = board[ny][nx];
        if (cell === piece.color) {
          // Check if it's a corner touch or edge touch
          const isCorner = nx !== x && ny !== y;
          if (isCorner) {
            hasCornerTouch = true;
          } else {
            hasEdgeTouch = true;
          }
        }
      }
    }
  }

  // Must have at least one corner touch and no edge touches
  return hasCornerTouch && !hasEdgeTouch;
};

// Place a piece on the board
export const placePiece = (
  piece: Piece,
  position: Position,
  gameState: GameState
): GameState => {
  const newBoard = gameState.board.map(row => [...row]);
  
  // Place the piece on the board
  for (const [dx, dy] of piece.squares) {
    const x = position.x + dx;
    const y = position.y + dy;
    newBoard[y][x] = piece.color;
  }

  // Update the game state
  const newGameState: GameState = {
    ...gameState,
    board: newBoard,
    currentPlayer: gameState.currentPlayer === 'human' ? 'computer' : 'human',
    [gameState.currentPlayer === 'human' ? 'humanPieces' : 'computerPieces']: 
      gameState[gameState.currentPlayer === 'human' ? 'humanPieces' : 'computerPieces']
        .filter(p => p !== piece),
  };

  // Calculate new scores
  const currentPlayer = gameState.currentPlayer;
  const otherPlayer = currentPlayer === 'human' ? 'computer' : 'human';
  
  // Start with current scores
  const newScores = { ...gameState.scores };
  
  // Add points for the placed piece (1 point per square)
  newScores[currentPlayer] += piece.size;

  // Check if this was the last piece for the current player
  const remainingPieces = newGameState[currentPlayer === 'human' ? 'humanPieces' : 'computerPieces'];
  if (remainingPieces.length === 0) {
    // Add bonus for placing all pieces (+15)
    newScores[currentPlayer] += 15;
    
    // Add extra bonus if last piece was monomino (+5)
    if (piece.type === 'monomino') {
      newScores[currentPlayer] += 5;
    }
  }

  // Update the scores in the game state
  newGameState.scores = newScores;

  // Check if the next player can make a move
  const nextPlayer = newGameState.currentPlayer;
  const nextPlayerPieces = nextPlayer === 'human' ? newGameState.humanPieces : newGameState.computerPieces;
  const canNextPlayerMove = nextPlayerPieces.some(piece => canPlacePieceAnywhere(piece, newGameState));

  // If next player can't move, check if the other player can
  if (!canNextPlayerMove) {
    const otherPlayerPieces = nextPlayer === 'human' ? newGameState.computerPieces : newGameState.humanPieces;
    const canOtherPlayerMove = otherPlayerPieces.some(piece => canPlacePieceAnywhere(piece, newGameState));

    // Game only ends when neither player can move
    newGameState.gameOver = !canOtherPlayerMove;
  } else {
    newGameState.gameOver = false;
  }

  return newGameState;
};

// Check if a piece can be placed anywhere on the board
export const canPlacePieceAnywhere = (piece: Piece, gameState: GameState): boolean => {
  const boardSize = gameState.board.length;
  
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      if (canPlacePiece(piece, { x, y }, gameState)) {
        return true;
      }
    }
  }
  
  return false;
};

// Get all valid moves for a piece
export const getValidMoves = (piece: Piece, gameState: GameState): Position[] => {
  const validMoves: Position[] = [];
  const boardSize = gameState.board.length;
  const { board } = gameState;

  // Check if this is the first move for this color
  const isFirstMove = !board.some(row => row.some(cell => cell === piece.color));

  if (isFirstMove) {
    // For first move, try all corners for all possible anchor squares
    const corners = [
      { x: 0, y: 0 },
      { x: boardSize - 1, y: 0 },
      { x: 0, y: boardSize - 1 },
      { x: boardSize - 1, y: boardSize - 1 }
    ];
    for (const corner of corners) {
      for (const [anchorDx, anchorDy] of piece.squares) {
        // Calculate the top-left position so that (anchorDx, anchorDy) lands on the corner
        const pos = { x: corner.x - anchorDx, y: corner.y - anchorDy };
        if (canPlacePiece(piece, pos, gameState)) {
          validMoves.push(pos);
        }
      }
    }
    // Remove duplicates
    return validMoves.filter((pos, idx, self) => idx === self.findIndex(p => p.x === pos.x && p.y === pos.y));
  }

  // For subsequent moves, find all empty diagonal cells adjacent to your color
  const diagonalOffsets = [
    [-1, -1], [1, -1], [-1, 1], [1, 1]
  ];
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      // For each of your color's pieces
      if (board[y][x] === piece.color) {
        for (const [dx, dy] of diagonalOffsets) {
          const diagX = x + dx;
          const diagY = y + dy;
          if (!isWithinBounds({ x: diagX, y: diagY }, boardSize)) continue;
          if (board[diagY][diagX] !== null) continue;
          // For each square in the piece, try anchoring it here
          for (const [anchorDx, anchorDy] of piece.squares) {
            const pos = { x: diagX - anchorDx, y: diagY - anchorDy };
            if (canPlacePiece(piece, pos, gameState)) {
              validMoves.push(pos);
            }
          }
        }
      }
    }
  }
  // Remove duplicates
  return validMoves.filter((pos, idx, self) => idx === self.findIndex(p => p.x === pos.x && p.y === pos.y));
};

// Simple computer AI: choose a random valid move
export const getComputerMove = (gameState: GameState): { piece: Piece; position: Position } | null => {
  const validMoves: { piece: Piece; position: Position }[] = [];
  
  for (const piece of gameState.computerPieces) {
    const positions = getValidMoves(piece, gameState);
    for (const position of positions) {
      validMoves.push({ piece, position });
    }
  }
  
  if (validMoves.length === 0) {
    return null;
  }
  
  return validMoves[Math.floor(Math.random() * validMoves.length)];
};

// Add a function to handle passing turns
export const passTurn = (gameState: GameState): GameState => {
  const newGameState = { ...gameState };
  
  // Switch to the other player
  newGameState.currentPlayer = gameState.currentPlayer === 'human' ? 'computer' : 'human';
  
  // Check if the next player can make a move
  const nextPlayer = newGameState.currentPlayer;
  const nextPlayerPieces = nextPlayer === 'human' ? newGameState.humanPieces : newGameState.computerPieces;
  const canNextPlayerMove = nextPlayerPieces.some(piece => canPlacePieceAnywhere(piece, newGameState));

  // If next player can't move, check if the other player can
  if (!canNextPlayerMove) {
    const otherPlayerPieces = nextPlayer === 'human' ? newGameState.computerPieces : newGameState.humanPieces;
    const canOtherPlayerMove = otherPlayerPieces.some(piece => canPlacePieceAnywhere(piece, newGameState));

    // Game only ends when neither player can move
    newGameState.gameOver = !canOtherPlayerMove;
  } else {
    newGameState.gameOver = false;
  }

  return newGameState;
}; 