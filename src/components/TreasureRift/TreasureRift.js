// src/components/TreasureRift/TreasureRift.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './TreasureRift.css';

const GRID_SIZE = 8;
const MAX_EXPLORATIONS = 15;
const MANHATTAN_DISTANCE = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2);

const TreasureRift = () => {
  // Game state
  const [board, setBoard] = useState(Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null)));
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [message, setMessage] = useState('Phase 1: Find the map and compass to use the map!');
  const [pirateEncounters, setPirateEncounters] = useState(0);
  const [elements, setElements] = useState({
    rocks: [],
    oceanCurrent: { x: 0, y: 0 },
    map: { x: 0, y: 0 },
    compass: { x: 0, y: 0, orientation: 'horizontal' }, // 'horizontal' or 'vertical'
    shipWreck: { x: 0, y: 0 },
    pirates: [],
    treasure: { x: 0, y: 0 },
  });
  const [revealedCells, setRevealedCells] = useState([]);
  const [markedCells, setMarkedCells] = useState([]);
  const [explorationsLeft, setExplorationsLeft] = useState(MAX_EXPLORATIONS);
  const [score, setScore] = useState(0);
  const [clickTimeout, setClickTimeout] = useState(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [gamePhase, setGamePhase] = useState(1); // Phase 1: Find map/compass, Phase 2: Find treasure
  const [foundMap, setFoundMap] = useState(false);
  const [foundCompass, setFoundCompass] = useState(false);
  const [highlightedCells, setHighlightedCells] = useState([]);
  const [diagonalLine, setDiagonalLine] = useState([]);

  // Initialize the game
  useEffect(() => {
    initializeGame();
    
    // Clean up any timeouts on unmount
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, []);

  const initializeGame = () => {
    // Reset state
    setBoard(Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null)));
    setGameStatus('playing');
    setMessage('Phase 1: Find the map and compass to use the map!');
    setPirateEncounters(0);
    setRevealedCells([]);
    setMarkedCells([]);
    setExplorationsLeft(MAX_EXPLORATIONS);
    setScore(0);
    setGamePhase(1);
    setFoundMap(false);
    setFoundCompass(false);
    setHighlightedCells([]);
    setDiagonalLine([]);

    // Step 1: Place the shipwreck
    const shipWreck = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };

    // Step 2: Place the compass 
    let compass;
    const compassOrientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
    
    do {
      compass = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
        orientation: compassOrientation
      };
    } while (compass.x === shipWreck.x && compass.y === shipWreck.y);

    // Step 3: Place three rocks
    const rocks = [];
    while (rocks.length < 3) {
      const rock = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };

      // Ensure rocks don't overlap with shipwreck or compass
      if ((rock.x === shipWreck.x && rock.y === shipWreck.y) || 
          (rock.x === compass.x && rock.y === compass.y) ||
          rocks.some(r => r.x === rock.x && r.y === rock.y)) {
        continue;
      }

      rocks.push(rock);
    }

    // Step 4: Place the ocean current
    let oceanCurrent;
    do {
      oceanCurrent = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (
      (oceanCurrent.x === shipWreck.x && oceanCurrent.y === shipWreck.y) ||
      (oceanCurrent.x === compass.x && oceanCurrent.y === compass.y) ||
      rocks.some(r => r.x === oceanCurrent.x && r.y === oceanCurrent.y)
    );

    // Step 5: Place the map - should be far from the compass to create a longer diagonal
    let map;
    let maxDistance = 0;
    let bestMapPosition = null;
    
    // Try multiple positions and pick the one furthest from compass
    for (let attempts = 0; attempts < 50; attempts++) {
      const potentialMap = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      
      // Ensure no overlap with other elements
      if ((potentialMap.x === shipWreck.x && potentialMap.y === shipWreck.y) ||
          (potentialMap.x === compass.x && potentialMap.y === compass.y) ||
          rocks.some(r => r.x === potentialMap.x && r.y === potentialMap.y) ||
          (potentialMap.x === oceanCurrent.x && potentialMap.y === oceanCurrent.y)) {
        continue;
      }
      
      // Calculate diagonal distance
      const distance = Math.sqrt(
        Math.pow(potentialMap.x - compass.x, 2) + 
        Math.pow(potentialMap.y - compass.y, 2)
      );
      
      if (distance > maxDistance) {
        maxDistance = distance;
        bestMapPosition = potentialMap;
      }
    }
    
    // If we found a good position, use it; otherwise use a random valid position
    if (bestMapPosition) {
      map = bestMapPosition;
    } else {
      do {
        map = {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE)
        };
      } while (
        (map.x === shipWreck.x && map.y === shipWreck.y) ||
        (map.x === compass.x && map.y === compass.y) ||
        rocks.some(r => r.x === map.x && r.y === map.y) ||
        (map.x === oceanCurrent.x && map.y === oceanCurrent.y)
      );
    }

    // Step 6: Determine possible treasure locations based on constraints
    const possibleTreasureLocations = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        // Skip if cell is occupied by another element
        if ((x === shipWreck.x && y === shipWreck.y) ||
            rocks.some(r => r.x === x && r.y === r.y) ||
            (x === oceanCurrent.x && y === oceanCurrent.y) ||
            (x === map.x && y === map.y) ||
            (x === compass.x && y === compass.y)) {
          continue;
        }

        // Check if the position is affected by a rock (including diagonals)
        const isNearRock = rocks.some(rock => {
          const dx = Math.abs(x - rock.x);
          const dy = Math.abs(y - rock.y);
          return dx <= 1 && dy <= 1; // This includes diagonals
        });

        if (isNearRock) {
          continue;
        }

        // Check treasure placement constraints
        const isWithinShipwreckRange = MANHATTAN_DISTANCE(x, y, shipWreck.x, shipWreck.y) <= 3;
        const isNotInOceanCurrentRowOrCol = x !== oceanCurrent.x && y !== oceanCurrent.y;
        
        // Map constraint based on compass
        let isInMapRange = false;
        if (compassOrientation === 'horizontal') {
          // Check if in map row or adjacent rows
          isInMapRange = y >= map.y - 1 && y <= map.y + 1;
        } else { // vertical
          // Check if in map column or adjacent columns
          isInMapRange = x >= map.x - 1 && x <= map.x + 1;
        }

        if (isWithinShipwreckRange && isNotInOceanCurrentRowOrCol && isInMapRange) {
          possibleTreasureLocations.push({ x, y });
        }
      }
    }

    // If no valid treasure locations, restart initialization
    if (possibleTreasureLocations.length === 0) {
      return initializeGame();
    }

    // If more than one valid location, adjust constraints to ensure uniqueness
    if (possibleTreasureLocations.length > 1) {
      // We need to add more constraints or adjust element positions to ensure uniqueness
      
      // Let's try adjusting the ocean current first to eliminate some possibilities
      if (possibleTreasureLocations.length > 1) {
        // Try multiple ocean current positions to find one that results in a unique solution
        let foundUniqueSolution = false;
        const originalOceanCurrent = { ...oceanCurrent };
        
        // Try up to 10 different positions for the ocean current
        for (let attempt = 0; attempt < 10 && !foundUniqueSolution; attempt++) {
          // Generate a new position for the ocean current
          const newX = Math.floor(Math.random() * GRID_SIZE);
          const newY = Math.floor(Math.random() * GRID_SIZE);
          
          // Skip if this position overlaps with other elements
          if ((newX === shipWreck.x && newY === shipWreck.y) ||
              rocks.some(r => r.x === newX && r.y === newY) ||
              (newX === map.x && newY === map.y) ||
              (newX === compass.x && newY === compass.y)) {
            continue;
          }
          
          // Update the ocean current position
          oceanCurrent.x = newX;
          oceanCurrent.y = newY;
          
          // Recalculate possible treasure locations
          const newPossibilities = [];
          for (const loc of possibleTreasureLocations) {
            if (loc.x !== oceanCurrent.x && loc.y !== oceanCurrent.y) {
              newPossibilities.push(loc);
            }
          }
          
          // If we've narrowed it down to one location, we've found our solution
          if (newPossibilities.length === 1) {
            possibleTreasureLocations.length = 0;
            possibleTreasureLocations.push(newPossibilities[0]);
            foundUniqueSolution = true;
          }
        }
        
        // If we couldn't find a unique solution by adjusting the ocean current,
        // restore the original position and try a different approach
        if (!foundUniqueSolution) {
          oceanCurrent.x = originalOceanCurrent.x;
          oceanCurrent.y = originalOceanCurrent.y;
          
          // Just pick the first location for simplicity, but in a real game
          // you might want to try more sophisticated approaches to ensure uniqueness
          possibleTreasureLocations.length = 1;
        }
      }
    }

    // Select the treasure location (now guaranteed to be unique)
    const treasure = possibleTreasureLocations[0];

    // Step 7: Place pirates (avoiding all other elements)
    const pirates = [];
    const numPirates = 3; // 3 pirates as requested
    let attempts = 0;
    
    while (pirates.length < numPirates && attempts < 100) {
      attempts++;
      const pirate = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };

      // Ensure pirates don't overlap with other elements
      if ((pirate.x === shipWreck.x && pirate.y === shipWreck.y) ||
          rocks.some(r => r.x === pirate.x && r.y === pirate.y) ||
          (pirate.x === oceanCurrent.x && pirate.y === oceanCurrent.y) ||
          (pirate.x === map.x && pirate.y === map.y) ||
          (pirate.x === compass.x && pirate.y === compass.y) ||
          (pirate.x === treasure.x && pirate.y === treasure.y) ||
          pirates.some(p => p.x === pirate.x && p.y === pirate.y)) {
        continue;
      }

      pirates.push(pirate);
    }

    // Update game state with all elements
    setElements({
      rocks,
      oceanCurrent,
      map,
      compass,
      shipWreck,
      pirates,
      treasure
    });

    // Create a new board with placed elements (rocks and ocean current are pre-revealed)
    const newBoard = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));

    // Place elements on the board
    rocks.forEach(rock => {
      newBoard[rock.y][rock.x] = { type: 'rock', visible: true };
    });

    newBoard[oceanCurrent.y][oceanCurrent.x] = { type: 'oceanCurrent', visible: true };
    newBoard[map.y][map.x] = { type: 'map', visible: false };
    newBoard[compass.y][compass.x] = { type: 'compass', visible: false, orientation: compass.orientation };
    newBoard[shipWreck.y][shipWreck.x] = { type: 'shipWreck', visible: false };

    // Hidden elements (pirates and treasure)
    pirates.forEach(pirate => {
      newBoard[pirate.y][pirate.x] = { type: 'pirate', visible: false };
    });

    newBoard[treasure.y][treasure.x] = { type: 'treasure', visible: false };

    setBoard(newBoard);
  };

  const createDiagonalLine = () => {
    const { map, compass } = elements;
    const dx = compass.x - map.x;
    const dy = compass.y - map.y;
    
    const line = [];
    
    // Create a line from map to compass (including both)
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for (let i = 0; i <= steps; i++) {
      const ratio = steps === 0 ? 0 : i / steps;
      const x = Math.round(map.x + dx * ratio);
      const y = Math.round(map.y + dy * ratio);
      line.push({ x, y });
    }
    
    setDiagonalLine(line);
  };
  
  const calculateShipwreckHighlights = () => {
    const { shipWreck, oceanCurrent, map, compass, rocks } = elements;
    const validCells = [];
    
    const range = 3; // Manhattan distance from shipwreck
    
    for (let y = Math.max(0, shipWreck.y - range); y <= Math.min(GRID_SIZE - 1, shipWreck.y + range); y++) {
      for (let x = Math.max(0, shipWreck.x - range); x <= Math.min(GRID_SIZE - 1, shipWreck.x + range); x++) {
        // Skip the shipwreck itself
        if (x === shipWreck.x && y === shipWreck.y) continue;
        
        // Check if within range
        if (MANHATTAN_DISTANCE(x, y, shipWreck.x, shipWreck.y) <= range) {
          // Check if not near rocks
          const isNearRock = rocks.some(rock => {
            const dx = Math.abs(x - rock.x);
            const dy = Math.abs(y - rock.y);
            return dx <= 1 && dy <= 1; // This includes diagonals
          });
          
          // Check if not in ocean current row/column
          const isInOceanPath = x === oceanCurrent.x || y === oceanCurrent.y;
          
          if (!isNearRock && !isInOceanPath) {
            validCells.push({ x, y });
          }
        }
      }
    }
    
    setHighlightedCells(validCells);
  };

  const isRevealed = (x, y) => {
    // Rocks and ocean current are always considered revealed
    const cell = board[y] && board[y][x];
    if (cell && (cell.type === 'rock' || cell.type === 'oceanCurrent')) {
      return true;
    }
    return revealedCells.some(cell => cell.x === x && cell.y === y);
  };
  
  const isMarked = (x, y) => {
    return markedCells.some(cell => cell.x === x && cell.y === y);
  };
  
  const isHighlighted = (x, y) => {
    return highlightedCells.some(cell => cell.x === x && cell.y === y);
  };
  
  const isInDiagonalLine = (x, y) => {
    return diagonalLine.some(cell => cell.x === x && cell.y === y);
  };
  
  const getArrowToMap = (x, y) => {
    if (gamePhase !== 1 || foundMap) return null;
    
    const { map } = elements;
    const dx = map.x - x;
    const dy = map.y - y;
    
    // Determine direction based on the predominant vector component
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? '➡️' : '⬅️';
    } else {
      return dy > 0 ? '⬇️' : '⬆️';
    }
  };

  const handleCellClick = (x, y) => {
    if (gameStatus !== 'playing') {
      return;
    }
    
    // Handle double click (reveal)
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      
      // Double click - reveal the cell if not already revealed
      if (!isRevealed(x, y)) {
        revealCell(x, y);
      }
      return;
    }
    
    // Single click - set timeout to detect if it's a single or double click
    const timeout = setTimeout(() => {
      // Single click - toggle mark
      if (!isRevealed(x, y)) {
        toggleMark(x, y);
      }
      setClickTimeout(null);
    }, 300); // 300ms delay to detect double click
    
    setClickTimeout(timeout);
  };
  
  const handleCellLongPress = (x, y, e) => {
    e.preventDefault(); // Prevent context menu on right click
    
    if (gameStatus !== 'playing') {
      return;
    }
    
    // If the cell is marked, remove the mark
    if (isMarked(x, y)) {
      const newMarkedCells = markedCells.filter(cell => !(cell.x === x && cell.y === y));
      setMarkedCells(newMarkedCells);
    }
    
    setIsLongPress(true);
  };
  
  const toggleMark = (x, y) => {
    if (isMarked(x, y)) {
      // Remove mark
      const newMarkedCells = markedCells.filter(cell => !(cell.x === x && cell.y === y));
      setMarkedCells(newMarkedCells);
    } else {
      // Add mark
      setMarkedCells([...markedCells, { x, y }]);
    }
  };

  const revealCell = (x, y) => {
    if (isRevealed(x, y)) {
      return;
    }
    
    // Decrement explorations left
    const newExplorationsLeft = explorationsLeft - 1;
    setExplorationsLeft(newExplorationsLeft);

    // Create a copy of revealed cells
    const newRevealedCells = [...revealedCells, { x, y }];
    setRevealedCells(newRevealedCells);
    
    // Remove any mark on this cell
    if (isMarked(x, y)) {
      const newMarkedCells = markedCells.filter(cell => !(cell.x === x && cell.y === y));
      setMarkedCells(newMarkedCells);
    }

    // Get the cell content
    const cell = board[y][x];

    // Create new board with the revealed cell
    const newBoard = [...board];
    
    // If no specific content in the cell
    if (!cell) {
      // Empty cell - In Phase 1, show arrow pointing to map
      newBoard[y][x] = { 
        type: 'empty', 
        visible: true,
        arrowDirection: !foundMap && gamePhase === 1 ? getArrowToMap(x, y) : null
      };
    } else {
      // Reveal the cell with its content
      newBoard[y][x] = { ...cell, visible: true };
      
      // Special handling based on cell type
      if (cell.type === 'treasure') {
        // Check if player is allowed to find treasure yet
        if (gamePhase === 2) {
          // Found treasure - win the game
          setGameStatus('won');
          // Score is based on explorations left
          const finalScore = newExplorationsLeft * 100;
          setScore(finalScore);
          setMessage(`Congratulations! You found the treasure with ${newExplorationsLeft} explorations left! Score: ${finalScore}`);
        } else {
          // In Phase 1, just show an arrow to the map
          newBoard[y][x] = { 
            type: 'empty', 
            visible: true,
            arrowDirection: !foundMap ? getArrowToMap(x, y) : null
          };
        }
      } else if (cell.type === 'pirate') {
        // Hit a pirate
        const newPirateEncounters = pirateEncounters + 1;
        setPirateEncounters(newPirateEncounters);
        
        if (newPirateEncounters >= 3) {
          // Game over - too many pirates
          setGameStatus('lost');
          setMessage('The pirates captured you! Game over.');
          
          // Reveal all pirates and the treasure
          elements.pirates.forEach(pirate => {
            newBoard[pirate.y][pirate.x] = { type: 'pirate', visible: true };
          });
          newBoard[elements.treasure.y][elements.treasure.x] = { type: 'treasure', visible: true };
        }
      } else if (cell.type === 'map') {
        // Found map
        setFoundMap(true);
        
        // Create diagonal line to compass
        createDiagonalLine();
        
        // Update message
        if (foundCompass) {
          setGamePhase(2);
          setMessage('Phase 2: Find the treasure!');
        } else {
          setMessage('You found the map! Now find the compass along the diagonal line.');
        }
      } else if (cell.type === 'compass') {
        // Found compass
        setFoundCompass(true);
        
        // Update message and game phase if map was already found
        if (foundMap) {
          setGamePhase(2);
          setMessage('Phase 2: Find the treasure!');
        } else {
          setMessage('You found the compass! Now find the map.');
        }
      } else if (cell.type === 'shipWreck') {
        // Shipwreck revealed - highlight valid cells around it
        calculateShipwreckHighlights();
      }
    }
    
    setBoard(newBoard);
    
    // Check if we ran out of explorations
    if (newExplorationsLeft <= 0 && gameStatus === 'playing') {
      setGameStatus('lost');
      setMessage('You ran out of explorations! The treasure remains hidden.');
      
      // Reveal the treasure
      const finalBoard = [...newBoard];
      finalBoard[elements.treasure.y][elements.treasure.x] = { type: 'treasure', visible: true };
      setBoard(finalBoard);
    }
  };

  const getCellClassName = (x, y) => {
    const cell = board[y] && board[y][x];
    const revealed = isRevealed(x, y);
    const marked = isMarked(x, y);
    const highlighted = isHighlighted(x, y);
    const inDiagonal = isInDiagonalLine(x, y);
    
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
    const revealed = isRevealed(x, y);
    const marked = isMarked(x, y);
    
    if (marked) {
      return '❌';
    }
    
    if (!revealed) {
      return '';
    }
    
    if (!cell) {
      return '';
    }
    
    // If it's an empty cell with arrow direction in Phase 1
    if (cell.type === 'empty' && cell.arrowDirection && gamePhase === 1 && !foundMap) {
      return cell.arrowDirection;
    }
    
    switch (cell.type) {
      case 'rock': return '🗿';
      case 'oceanCurrent': return '🌊';
      case 'map': return '🧭';
      case 'compass': return cell.orientation === 'horizontal' ? '⬅️➡️' : '⬆️⬇️';
      case 'shipWreck': return '⚓';
      case 'pirate': return '🏴‍☠️';
      case 'treasure': return '💎';
      case 'empty': return '';
      default: return '';
    }
  };

  return (
    <div className="treasure-rift-container">
      <div className="game-header">
        <h1>Treasure Rift</h1>
        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-label">Explorations</span>
            <span className="stat-value">{explorationsLeft}/{MAX_EXPLORATIONS}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Pirates</span>
            <span className="stat-value">{pirateEncounters}/3</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Phase</span>
            <span className="stat-value">{gamePhase}</span>
          </div>
          {gameStatus === 'won' && (
            <div className="stat-item score">
              <span className="stat-label">Score</span>
              <span className="stat-value">{score}</span>
            </div>
          )}
        </div>
      </div>

      <div className="game-message">
        {gamePhase === 1 ? 
          (!foundMap && !foundCompass ? 'Phase 1: Find the map and compass to use the map!' :
           !foundMap ? 'Find the map to see where the treasure might be!' :
           !foundCompass ? 'Find the compass along the diagonal line!' : '') :
          'Phase 2: Find the treasure!'}
      </div>

      <div className="game-board-container">
        <div className="game-board">
          {board.map((row, y) => (
            <div key={y} className="board-row">
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

      <div className="game-controls">
        <Link to="/" className="back-button">Back to Games</Link>
        <button className="new-game-button" onClick={initializeGame}>New Game</button>
      </div>

      <div className="game-legend">
        <h3>Legend</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-icon">❌</span>
            <span className="legend-text">Mark - Single click to mark a spot you believe doesn't have the treasure</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🔍</span>
            <span className="legend-text">Explore - Double click to explore a spot (uses an exploration)</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🗿</span>
            <span className="legend-text">Ancient Rock - Treasure cannot be within one square (including diagonally)</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🌊</span>
            <span className="legend-text">Whirlpool - Treasure cannot be in this row or column</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🧭</span>
            <span className="legend-text">Map - Must be found to locate the treasure</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon compass-icons">⬅️➡️</span>
            <span className="legend-text">Horizontal Compass - Shows treasure is in one of three rows</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon compass-icons">⬆️⬇️</span>
            <span className="legend-text">Vertical Compass - Shows treasure is in one of three columns</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">⚓</span>
            <span className="legend-text">Shipwreck - Treasure is within 3 squares</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🏴‍☠️</span>
            <span className="legend-text">Pirate - Encounter 3 pirates and you lose!</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">💎</span>
            <span className="legend-text">Treasure - Find this to win!</span>
          </div>
        </div>
      </div>

      {gameStatus !== 'playing' && (
        <div className={`game-over-overlay ${gameStatus}`}>
          <div className="game-over-content">
            <h2>{gameStatus === 'won' ? 'Victory!' : 'Game Over!'}</h2>
            <p>{message}</p>
            <div className="game-over-buttons">
              <button className="restart-button" onClick={initializeGame}>Play Again</button>
              <Link to="/" className="home-button">Back to Games</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreasureRift;