import React, { useState, useEffect } from 'react';
import { Piece } from '../types/game.types';
import styles from '../styles/GameBoard.module.css';

interface PieceDisplayProps {
  piece: Piece;
  onClick?: () => void;
  onRotate?: (rotatedPiece: Piece) => void;
  selected?: boolean;
  size?: 'small' | 'medium' | 'large';
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, piece: Piece) => void;
}

const PieceDisplay: React.FC<PieceDisplayProps> = ({
  piece,
  onClick,
  onRotate,
  selected = false,
  size = 'medium',
  draggable = false,
  onDragStart,
}) => {
  const [currentPiece, setCurrentPiece] = useState(piece);

  // Update currentPiece when the piece prop changes
  useEffect(() => {
    setCurrentPiece(piece);
  }, [piece.type]); // Only reset when piece type changes

  const handleRotate = (clockwise: boolean) => {
    if (!onRotate) return;

    // Calculate the center point of the piece
    const maxX = Math.max(...currentPiece.squares.map(([x]) => x));
    const maxY = Math.max(...currentPiece.squares.map(([, y]) => y));
    const minX = Math.min(...currentPiece.squares.map(([x]) => x));
    const minY = Math.min(...currentPiece.squares.map(([, y]) => y));
    const centerX = (maxX + minX) / 2;
    const centerY = (maxY + minY) / 2;

    // Rotate each square around the center point
    const rotatedSquares = currentPiece.squares.map(([x, y]) => {
      // Translate to origin
      const dx = x - centerX;
      const dy = y - centerY;

      // Rotate 90 degrees
      const [newX, newY] = clockwise 
        ? [-dy, dx]  // Clockwise: (x,y) -> (-y,x)
        : [dy, -dx]; // Counter-clockwise: (x,y) -> (y,-x)

      // Translate back and round to nearest integer
      return [
        Math.round(newX + centerX),
        Math.round(newY + centerY)
      ] as [number, number];
    });

    // Normalize coordinates to start from (0,0)
    const newMinX = Math.min(...rotatedSquares.map(([x]) => x));
    const newMinY = Math.min(...rotatedSquares.map(([, y]) => y));
    const normalizedSquares = rotatedSquares.map(([x, y]) => 
      [x - newMinX, y - newMinY] as [number, number]
    );

    const rotatedPiece = {
      ...currentPiece,
      squares: normalizedSquares,
    };
    
    setCurrentPiece(rotatedPiece);
    onRotate(rotatedPiece);
  };

  // Calculate the grid size based on the piece's dimensions
  const maxX = Math.max(...currentPiece.squares.map(([x]) => x));
  const maxY = Math.max(...currentPiece.squares.map(([, y]) => y));
  const gridSize = Math.max(maxX, maxY) + 1;

  return (
    <div
      className={`${styles.pieceContainer} ${selected ? styles.selected : ''}`}
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, currentPiece)}
    >
      <div
        className={`${styles.piece} ${styles[size]} ${selected ? styles.selected : ''}`}
        onClick={onClick}
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          width: `${gridSize * 20}px`,
          height: `${gridSize * 20}px`,
        }}
      >
        {currentPiece.squares.map(([x, y], index) => (
          <div
            key={index}
            className={`${styles.pieceSquare} ${styles[currentPiece.color]}`}
            style={{
              gridColumn: x + 1,
              gridRow: y + 1,
            }}
          />
        ))}
      </div>
      {selected && onRotate && (
        <div className={styles.rotationControls}>
          <button
            className={styles.rotateButton}
            onClick={(e) => {
              e.stopPropagation();
              handleRotate(false);
            }}
            title="Rotate Counter-clockwise"
          >
            ↺
          </button>
          <button
            className={styles.rotateButton}
            onClick={(e) => {
              e.stopPropagation();
              handleRotate(true);
            }}
            title="Rotate Clockwise"
          >
            ↻
          </button>
        </div>
      )}
    </div>
  );
};

export default PieceDisplay; 