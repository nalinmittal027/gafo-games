// src/components/TreasureRift/components/GameBoard.js
import React from 'react';
import { 
  isRevealed, 
  isMarked, 
  isHighlighted, 
  isInDiagonalLine, 
  getArrowToMap 
} from '../utils/gameLogic';

const GameBoard = ({ 
  board, 
  gamePhase, 
  foundItems, 
  elements, 
  revealedCells, 
  markedCells, 
  highlightedCells, 
  diagonalLine, 
  handleCellClick, 
  handleCellLongPress 
}) => {
  
  const getCellClassName = (x, y) => {
    const cell = board[y] && board[y][x];
    const revealed = isRevealed(x, y, elements, revealedCells);
    const marked = isMarked(x, y, markedCells);
    const highlighted = isHighlighted(x, y, highlightedCells);
    const inDiagonal = isInDiagonalLine(x, y, foundItems, diagonalLine);
    
    let classNames = `cell cell-${x}-${y}`;
    
    if (marked) {
      classNames += ' marked';
    } else if (!revealed) {
      classNames += ' hidden';
    } else if (cell) {
      classNames += ` ${cell.type} visible`;
    } else {
      classNames += ' empty visible';
    }
    
    if (highlighted) {
      classNames += ' highlighted';
    }
    
    if (inDiagonal) {
      classNames += ' diagonal';
    }
    
    return classNames;
  };

  const getCellContent = (x, y) => {
    const cell = board[y] && board[y][x];
    const revealed = isRevealed(x, y, elements, revealedCells);
    const marked = isMarked(x, y, markedCells);
    
    if (marked) {
      return '❌';
    }
    
    if (!revealed) {
      return '';
    }
    
    // If it's a revealed empty cell and we're in Phase 1, show arrow to map
    if ((cell && (cell.type === 'empty' || cell.type === 'deepOcean' || cell.type === 'shallowOcean')) 
        && gamePhase === 1 && !foundItems.map) {
      const arrowDirection = getArrowToMap(x, y, elements, foundItems);
      if (arrowDirection) return arrowDirection;
    }
    
    if (!cell) {
      return '';
    }
    
    switch (cell.type) {
      case 'rock': return '🗿';
      case 'oceanCurrent': return '🌊';
      case 'map': return '🗺️';
      case 'compass': return '🧭';
      case 'shipWreck': return '⚓';
      case 'treasure': return '💎';
      case 'deepOcean': 
      case 'shallowOcean': 
      case 'empty': 
        // If in Phase 1 and no map found, show arrow
        if (gamePhase === 1 && !foundItems.map) {
          return getArrowToMap(x, y, elements, foundItems);
        }
        return '';
      default: return '';
    }
  };

  return (
    <div className="game-board-container">
      <div className="game-board">
        {/* Row numbers */}
        <div className="board-row board-labels">
          <div className="cell-label"></div>
          {Array.from({length: board.length}, (_, i) => (
            <div key={`col-${i}`} className="cell-label">{i + 1}</div>
          ))}
        </div>
        
        {board.map((row, y) => (
          <div key={y} className="board-row">
            {/* Column numbers */}
            <div className="cell-label">{y + 1}</div>
            
            {row.map((_, x) => (
              <div
                key={`${x}-${y}`}
                className={getCellClassName(x, y)}
                onClick={() => handleCellClick(x, y)}
                onContextMenu={(e) => handleCellLongPress(x, y, e)}
                onTouchStart={(e) => {
                  const longPressTimer = setTimeout(() => {
                    handleCellLongPress(x, y, e);
                  }, 500);
                  e.target.longPressTimer = longPressTimer;
                }}
                onTouchEnd={(e) => {
                  if (e.target.longPressTimer) {
                    clearTimeout(e.target.longPressTimer);
                  }
                }}
                onTouchMove={(e) => {
                  if (e.target.longPressTimer) {
                    clearTimeout(e.target.longPressTimer);
                  }
                }}
              >
                {getCellContent(x, y)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameBoard;