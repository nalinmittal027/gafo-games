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
  const [message, setMessage] = useState('Find the hidden treasure while conserving your explorations!');
  const [pirateEncounters, setPirateEncounters] = useState(0);
  const [elements, setElements] = useState({
    rocks: [],
    oceanCurrent: { x: 0, y: 0 },
    map: { x: 0, y: 0 },
    compass: { orientation: 'horizontal' }, // 'horizontal' or 'vertical'
    shipWreck: { x: 0, y: 0 },
    pirates: [],
    treasure: { x: 0, y: 0 },
  });
  const [revealedCells, setRevealedCells] = useState([]);
  const [explorationsLeft, setExplorationsLeft] = useState(MAX_EXPLORATIONS);
  const [score, setScore] = useState(0);

  // Initialize the game
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    // Reset state
    setBoard(Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null)));
    setGameStatus('playing');
    setMessage('Find the hidden treasure while conserving your explorations!');
    setPirateEncounters(0);
    setRevealedCells([]);
    setExplorationsLeft(MAX_EXPLORATIONS);
    setScore(0);

    // Step 1: Place the shipwreck
    const shipWreck = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };

    // Step 2: Place the compass and determine orientation
    const compassOrientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
    const compass = { orientation: compassOrientation };

    // Step 3: Place three rocks
    const rocks = [];
    while (rocks.length < 3) {
      const rock = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };

      // Ensure rocks don't overlap with shipwreck
      if (!(rock.x === shipWreck.x && rock.y === shipWreck.y) && 
          !rocks.some(r => r.x === rock.x && r.y === rock.y)) {
        rocks.push(rock);
      }
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
      rocks.some(r => r.x === oceanCurrent.x && r.y === oceanCurrent.y)
    );

    // Step 5: Place the map
    let map;
    do {
      map = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (
      (map.x === shipWreck.x && map.y === shipWreck.y) ||
      rocks.some(r => r.x === map.x && r.y === map.y) ||
      (map.x === oceanCurrent.x && map.y === oceanCurrent.y)
    );

    // Step 6: Determine possible treasure locations based on constraints
    const possibleTreasureLocations = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        // Skip if cell is occupied by another element
        if ((x === shipWreck.x && y === shipWreck.y) ||
            rocks.some(r => r.x === x && r.y === r.y) ||
            (x === oceanCurrent.x && y === oceanCurrent.y) ||
            (x === map.x && y === map.y)) {
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
              (newX === map.x && newY === map.y)) {
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
    newBoard[shipWreck.y][shipWreck.x] = { type: 'shipWreck', visible: false };

    // Hidden elements (pirates and treasure)
    pirates.forEach(pirate => {
      newBoard[pirate.y][pirate.x] = { type: 'pirate', visible: false };
    });

    newBoard[treasure.y][treasure.x] = { type: 'treasure', visible: false };

    setBoard(newBoard);
  };

  const handleCellClick = (x, y) => {
    if (gameStatus !== 'playing' || isRevealed(x, y)) {
      return;
    }

    // Decrement explorations left
    const newExplorationsLeft = explorationsLeft - 1;
    setExplorationsLeft(newExplorationsLeft);

    // Create a copy of revealed cells
    const newRevealedCells = [...revealedCells, { x, y }];
    setRevealedCells(newRevealedCells);

    // Get the cell content
    const cell = board[y][x];

    // Create new board with the revealed cell
    const newBoard = [...board];
    
    // If no specific content in the cell
    if (!cell) {
      // Empty cell - provide hint based on proximity
      const { treasure, rocks, pirates } = elements;
      
      // Distance to treasure
      const distanceToTreasure = MANHATTAN_DISTANCE(x, y, treasure.x, treasure.y);
      
      // Check proximity to rocks
      const nearbyRocks = rocks.filter(rock => MANHATTAN_DISTANCE(x, y, rock.x, rock.y) <= 2);
      
      // Check proximity to pirates
      const nearbyPirates = pirates.filter(pirate => MANHATTAN_DISTANCE(x, y, pirate.x, pirate.y) <= 1);
      
      // Generate hint message
      let hint = '';
      
      if (nearbyPirates.length > 0) {
        hint = 'You hear pirates nearby! Be careful!';
      } else if (nearbyRocks.length > 0) {
        hint = `You see ${nearbyRocks.length} rock${nearbyRocks.length > 1 ? 's' : ''} in the vicinity.`;
      } else {
        // Distance hint
        if (distanceToTreasure <= 2) {
          hint = 'You feel like the treasure is very close!';
        } else if (distanceToTreasure <= 4) {
          hint = 'You sense the treasure might be nearby.';
        } else {
          hint = 'The treasure seems far away from here.';
        }
      }
      
      setMessage(hint);
      
      // Update board with the revealed empty cell
      newBoard[y][x] = { type: 'empty', visible: true, hint };
    } else {
      // Reveal the cell with its content
      newBoard[y][x] = { ...cell, visible: true };
      
      if (cell.type === 'treasure') {
        // Found treasure - win the game
        setGameStatus('won');
        // Score is based on explorations left
        const finalScore = newExplorationsLeft * 100;
        setScore(finalScore);
        setMessage(`Congratulations! You found the treasure with ${newExplorationsLeft} explorations left! Score: ${finalScore}`);
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
        } else {
          setMessage(`You encountered a pirate! (${newPirateEncounters}/3 encounters)`);
        }
      } else {
        // Generate message based on what was revealed
        if (cell.type === 'map') {
          const compassDir = elements.compass.orientation === 'horizontal' ? 'rows' : 'columns';
          setMessage(`This map shows the treasure is within the three adjacent ${compassDir}!`);
        } else if (cell.type === 'shipWreck') {
          setMessage('The shipwreck suggests the treasure is within 3 squares of here.');
        } else if (cell.type === 'oceanCurrent') {
          setMessage('The treasure cannot be in this row or column due to the ocean current.');
        } else if (cell.type === 'rock') {
          setMessage('A large rock. The treasure cannot be within one square of any rock (including diagonals).');
        }
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

  const isRevealed = (x, y) => {
    // Rocks and ocean current are always considered revealed
    const cell = board[y][x];
    if (cell && (cell.type === 'rock' || cell.type === 'oceanCurrent')) {
      return true;
    }
    return revealedCells.some(cell => cell.x === x && cell.y === y);
  };

  const getCellClassName = (x, y) => {
    const cell = board[y][x];
    const revealed = isRevealed(x, y);
    
    if (!revealed) {
      return `cell hidden cell-${x}-${y}`;
    }
    
    if (!cell) {
      return `cell empty visible cell-${x}-${y}`;
    }
    
    return `cell ${cell.type} visible cell-${x}-${y}`;
  };

  const getCellContent = (x, y) => {
    const cell = board[y][x];
    const revealed = isRevealed(x, y);
    
    if (!revealed) {
      return '';
    }
    
    if (!cell) {
      return '';
    }
    
    switch (cell.type) {
      case 'rock': return '🗿';
      case 'oceanCurrent': return '🌊';
      case 'map': return '🧭';
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
          {gameStatus === 'won' && (
            <div className="stat-item score">
              <span className="stat-label">Score</span>
              <span className="stat-value">{score}</span>
            </div>
          )}
        </div>
      </div>

      <div className="game-message">{message}</div>

      <div className="game-board-container">
        <div className="game-board">
          {board.map((row, y) => (
            <div key={y} className="board-row">
              {row.map((_, x) => (
                <div
                  key={`${x}-${y}`}
                  className={getCellClassName(x, y)}
                  onClick={() => handleCellClick(x, y)}
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
            <span className="legend-icon">🗿</span>
            <span className="legend-text">Ancient Rock - Treasure cannot be within one square (including diagonally)</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🌊</span>
            <span className="legend-text">Whirlpool - Treasure cannot be in this row or column</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🧭</span>
            <span className="legend-text">Map - Indicates treasure is within three adjacent rows or columns</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon compass-icons">⬅️ ➡️</span>
            <span className="legend-text">Horizontal Arrows - Treasure is in one of the three rows (current, above, or below the map)</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon compass-icons">⬆️ ⬇️</span>
            <span className="legend-text">Vertical Arrows - Treasure is in one of the three columns (current, left, or right of the map)</span>
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