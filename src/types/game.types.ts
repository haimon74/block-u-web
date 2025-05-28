export type Color = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'indigo' | 'pink';

export type PieceType = 
  | 'monomino'    // 1 square
  | 'domino'      // 2 squares
  | 'I3'          // 3 squares in line
  | 'L3'          // L shape
  | 'I4'          // 4 squares in line
  | 'O'           // 2x2 square
  | 'L4'          // 3 in line with square on end
  | 'Z'           // Z shape
  | 'T'           // T shape
  | 'S'           // S shape
  | 'I5'          // 5 squares in line
  | 'L5'          // 4 in line with one extra
  | 'N'           // Lightning bolt shape
  | 'P'           // 2x2 with one sticking out
  | 'T5'          // T shape with longer arms
  | 'U'           // U shape
  | 'V'           // V shape
  | 'W'           // Zigzag shape
  | 'X'           // Plus shape
  | 'Y'           // Fork shape
  | 'Z5';         // Z shape but longer

export interface Piece {
  type: PieceType;
  color: Color;
  squares: [number, number][]; // Array of [x, y] coordinates relative to piece origin
  size: number; // Number of squares in the piece
}

export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  board: (Color | null)[][];
  currentPlayer: 'human' | 'computer';
  humanColor: Color;
  computerColor: Color;
  humanPieces: Piece[];
  computerPieces: Piece[];
  gameOver: boolean;
  scores: {
    human: number;
    computer: number;
  };
}

export interface GameConfig {
  boardSize: number; // 20x20 for Blokus XL
  colors: Color[];
} 