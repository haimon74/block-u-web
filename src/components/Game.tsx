import React, { useState, useEffect, useCallback } from 'react';
import { GameState, Color, Piece, Position } from '../types/game.types';
import { createPlayerPieces, canPlacePiece, placePiece, getComputerMove, getValidMoves, passTurn } from '../utils/gameUtils';
import PieceDisplay from './PieceDisplay';
import styles from '../styles/GameBoard.module.css';

const BOARD_SIZE = 20;
const COLORS: Color[] = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'pink'];

const initialGameState: GameState = {
  board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
  currentPlayer: 'human',
  humanColor: 'red',
  computerColor: 'blue',
  humanPieces: [],
  computerPieces: [],
  gameOver: false,
  scores: {
    human: 0,
    computer: 0,
  },
};

const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [dragOverCell, setDragOverCell] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [canCurrentPlayerMove, setCanCurrentPlayerMove] = useState(true);

  // Initialize pieces for both players
  useEffect(() => {
    if (selectedColor) {
      const computerColor = COLORS.find(c => c !== selectedColor)!;
      setGameState(prev => ({
        ...prev,
        humanColor: selectedColor,
        computerColor,
        humanPieces: createPlayerPieces(selectedColor),
        computerPieces: createPlayerPieces(computerColor),
      }));
    }
  }, [selectedColor]);

  // Update canCurrentPlayerMove whenever gameState changes
  useEffect(() => {
    const currentPieces = gameState.currentPlayer === 'human' ? gameState.humanPieces : gameState.computerPieces;
    const canMove = currentPieces.some(piece => getValidMoves(piece, gameState).length > 0);
    setCanCurrentPlayerMove(canMove);
  }, [gameState]);

  // Handle computer's turn
  useEffect(() => {
    if (gameState.currentPlayer === 'computer' && !gameState.gameOver) {
      const computerMove = getComputerMove(gameState);
      if (computerMove) {
        setTimeout(() => {
          setGameState(prev => placePiece(computerMove.piece, computerMove.position, prev));
        }, 1000);
      } else {
        // Computer can't move, so pass turn
        setTimeout(() => {
          setGameState(prev => passTurn(prev));
        }, 1000);
      }
    }
  }, [gameState.currentPlayer, gameState.gameOver]);

  // Show game over modal when game ends
  useEffect(() => {
    if (gameState.gameOver) {
      setShowGameOver(true);
    }
  }, [gameState.gameOver]);

  const handleColorSelection = (color: Color) => {
    setSelectedColor(color);
  };

  const handlePieceRotate = useCallback((rotatedPiece: Piece) => {
    if (selectedPiece) {
      // Update the piece in the humanPieces array
      setGameState(prev => ({
        ...prev,
        humanPieces: prev.humanPieces.map(p => 
          p === selectedPiece ? rotatedPiece : p
        ),
      }));
      // Update the selected piece
      setSelectedPiece(rotatedPiece);
      // Update valid moves for the rotated piece
      setValidMoves(getValidMoves(rotatedPiece, gameState));
    }
  }, [selectedPiece, gameState]);

  const handlePieceSelection = useCallback((piece: Piece) => {
    if (gameState.currentPlayer !== 'human' || gameState.gameOver) {
      return;
    }
    // If clicking the same piece, deselect it
    if (selectedPiece === piece) {
      setSelectedPiece(null);
      setValidMoves([]);
    } else {
      setSelectedPiece(piece);
      setValidMoves(getValidMoves(piece, gameState));
    }
  }, [gameState, selectedPiece]);

  const handleDragStart = useCallback((e: React.DragEvent, piece: Piece) => {
    if (gameState.currentPlayer !== 'human' || gameState.gameOver) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('piece', JSON.stringify(piece));
    setSelectedPiece(piece);
    setValidMoves(getValidMoves(piece, gameState));
  }, [gameState]);

  const handleDragOver = useCallback((e: React.DragEvent, position: Position) => {
    e.preventDefault();
    if (!selectedPiece) return;

    const isValid = canPlacePiece(selectedPiece, position, gameState);
    setDragOverCell(isValid ? position : null);
  }, [selectedPiece, gameState]);

  const handleDrop = useCallback((e: React.DragEvent, position: Position) => {
    e.preventDefault();
    if (!selectedPiece || !canPlacePiece(selectedPiece, position, gameState)) {
      setDragOverCell(null);
      return;
    }

    setGameState(prev => placePiece(selectedPiece, position, prev));
    setSelectedPiece(null);
    setDragOverCell(null);
    setValidMoves([]);
  }, [selectedPiece, gameState]);

  const handleDragEnd = useCallback(() => {
    setDragOverCell(null);
  }, []);

  const handleCellClick = useCallback((position: Position) => {
    if (!selectedPiece || gameState.currentPlayer !== 'human' || gameState.gameOver) {
      return;
    }

    if (canPlacePiece(selectedPiece, position, gameState)) {
      setGameState(prev => placePiece(selectedPiece, position, prev));
      setSelectedPiece(null);
      setValidMoves([]);
    }
  }, [selectedPiece, gameState]);

  const handleNewGame = () => {
    setGameState(initialGameState);
    setSelectedColor(null);
    setSelectedPiece(null);
    setShowGameOver(false);
  };

  const handlePassTurn = useCallback(() => {
    if (gameState.currentPlayer === 'human' && !gameState.gameOver) {
      setGameState(prev => passTurn(prev));
    }
  }, [gameState]);

  if (!selectedColor) {
    return (
      <div className={styles.gameContainer}>
        <h1>Choose Your Color</h1>
        <div className={styles.colorSelection}>
          {COLORS.map(color => (
            <button
              key={color}
              className={`${styles.colorOption} ${styles[color]}`}
              onClick={() => handleColorSelection(color)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameInfo}>
        <div className={styles.playerInfo}>
          <h2>Your Score: {gameState.scores.human}</h2>
          <div className={styles.pieceCount}>
            Remaining Pieces: {gameState.humanPieces.length}
          </div>
          {gameState.currentPlayer === 'human' && !canCurrentPlayerMove && !gameState.gameOver && (
            <button className={styles.passButton} onClick={handlePassTurn}>
              Pass Turn
            </button>
          )}
        </div>
        <div className={styles.playerInfo}>
          <h2>Computer Score: {gameState.scores.computer}</h2>
          <div className={styles.pieceCount}>
            Remaining Pieces: {gameState.computerPieces.length}
          </div>
        </div>
      </div>

      <div 
        className={`${styles.gameBoard} ${dragOverCell ? styles.dragging : ''}`}
        onDragEnd={handleDragEnd}
      >
        {gameState.board.map((row, y) =>
          row.map((cell, x) => {
            const position = { x, y };
            const isValidMove = validMoves.some(move => 
              move.x === position.x && move.y === position.y
            );
            const isDragOver = dragOverCell?.x === x && dragOverCell?.y === y;

            return (
              <div
                key={`${x}-${y}`}
                className={`${styles.cell} 
                  ${cell ? styles[cell] : ''} 
                  ${isValidMove ? styles.validMove : ''}
                  ${isDragOver ? styles.dragOver : ''}
                `}
                onClick={() => handleCellClick(position)}
                onDragOver={(e) => handleDragOver(e, position)}
                onDrop={(e) => handleDrop(e, position)}
              />
            );
          })
        )}
      </div>

      <div className={styles.pieceSelection}>
        {gameState.humanPieces.map((piece, index) => (
          <PieceDisplay
            key={`${piece.type}-${index}`}
            piece={piece}
            selected={selectedPiece === piece}
            onClick={() => handlePieceSelection(piece)}
            onRotate={handlePieceRotate}
            onDragStart={handleDragStart}
            draggable={gameState.currentPlayer === 'human' && !gameState.gameOver}
            size="small"
          />
        ))}
      </div>

      {showGameOver && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>
              Game Over!
              {gameState.scores.human < gameState.scores.computer
                ? ' You Win!'
                : gameState.scores.human > gameState.scores.computer
                ? ' Computer Wins!'
                : " It's a Tie!"}
            </h2>
            <button className={styles.modalButton} onClick={handleNewGame}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game; 