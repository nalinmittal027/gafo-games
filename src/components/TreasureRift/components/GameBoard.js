// src/components/TreasureRift/components/GameBoard.js
import React, { memo } from 'react';
import { 
  isRevealed, 
  isMarked, 
  isHighlighted, 
  isInDiagonalLine, 
  getArrowToMap 
} from '../utils/gameLogic';

// Cell component to optimize rendering
const Cell = memo(({ 
  x, y, board, gamePhase, foundItems, elements, 
  revealedCells, markedCells, highlightedCells, diagonalLine,
  handleCellClick, handleCellLongPress
}) => {
  const getCellClassName = () => {
    const cell = board[y] && board[y][x];
    const revealed = isRevealed(x, y, elements, revealedCells);
    const marked = isMarked(x, y, markedCells);
    const highlighted = isHighlighted(x, y, highlightedCells);
    const inDiagonal = isInDiagonalLine(x, y, foundItems, diagonalLine);
    
    let classNames = `cell cell-${x}-${y}`;
    
    if (marked) {
      classNames += ' marked';
    } else if (cell && cell.visible) {
      // Cell is visible from initialization or has been revealed
      classNames += ` ${cell.type} visible`;
    } else if (!revealed) {
      // Cell is hidden - an item that needs to be discovered
      classNames += ' hidden';
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

  const getCellContent = () => {
    const cell = board[y] && board[y][x];
    const revealed = isRevealed(x, y, elements, revealedCells);
    const marked = isMarked(x, y, markedCells);
    
    if (marked) {
      return '❌';
    }
    
    // Cell is not revealed (only for hidden items)
    if (cell && !cell.visible && !revealed) {
      return '';
    }
    
    // Cell is a hidden item that was revealed
    if (revealed && cell && ['map', 'compass', 'shipWreck', 'treasure'].includes(cell.type)) {
      switch (cell.type) {
        case 'map': return '🗺️';
        case 'compass': return '🧭';
        case 'shipWreck': return '⚓';
        case 'treasure': return '💎';
        default: return '';
      }
    }
    
    // Cell is visible from the start
    if (cell && cell.visible) {
      switch (cell.type) {
        case 'rock': return '🗿';
        case 'oceanCurrent': return '🌊';
        // Don't show hidden items even if cell is visible
        case 'map': 
        case 'compass': 
        case 'shipWreck': 
        case 'treasure': 
          return '';
        case 'deepOcean': 
        case 'shallowOcean': 
          // If in Phase 1 and no map found, show arrow to map
          if (gamePhase === 1 && !foundItems.map && revealed) {
            const arrowDirection = getArrowToMap(x, y, elements, foundItems);
            if (arrowDirection) return arrowDirection;
          }
          return '';
        default: return '';
      }
    }
    
    // Empty revealed cell might show an arrow
    if (gamePhase === 1 && !foundItems.map && revealed) {
      const arrowDirection = getArrowToMap(x, y, elements, foundItems);
      if (arrowDirection) return arrowDirection;
    }
    
    return '';
  };

  return (
    <div
      className={getCellClassName()}
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
      {getCellContent()}
    </div>
  );
});

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
  // Prevent rendering if board is empty or not initialized
  if (!board || board.length === 0) {
    return <div className="game-board-container">Loading game board...</div>;
  }

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
              <Cell
                key={`${x}-${y}`}
                x={x}
                y={y}
                board={board}
                gamePhase={gamePhase}
                foundItems={foundItems}
                elements={elements}
                revealedCells={revealedCells}
                markedCells={markedCells}
                highlightedCells={highlightedCells}
                diagonalLine={diagonalLine}
                handleCellClick={handleCellClick}
                handleCellLongPress={handleCellLongPress}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameBoard;