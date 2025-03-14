// src/components/TreasureRift/TreasureRift.js
import React, { useState, useEffect } from 'react';
import './TreasureRift.css';

const GRID_SIZE = 8;
const MANHATTAN_DISTANCE = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2);

const TreasureRift = () => {
  // Game state
  const [board, setBoard] = useState(Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null)));
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [message, setMessage] = useState('Find the hidden treasure while avoiding pirates!');
  const [pirateEncounters, setPirateEncounters] = useState(0);
  const [elements, setElements] = useState({
    rocks: [],
    oceanCurrent: { x: 0, y: 0 },
    map: { x: 0, y: 0 },
    shipWreck: { x: 0, y: 0 },
    pirates: [],
    treasure: { x: 0, y: 0 },
  });
  const [revealedCells, setRevealedCells] = useState([]);
  const [moves, setMoves] = useState(0);

  // Initialize the game
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    // Reset state
    setBoard(Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null)));
    setGameStatus('playing');
    setMessage('Find the hidden treasure while avoiding pirates!');
    setPirateEncounters(0);
    setRevealedCells([]);
    setMoves(0);

    // Step 1: Place the shipwreck
    const shipWreck = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };

    // Step 2: Place three rocks
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

    // Step 3: Place the ocean current
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

    // Step 4: Place the map in a random row
    const mapRow = Math.floor(Math.random() * GRID_SIZE);
    let mapCol;
    do {
      mapCol = Math.floor(Math.random() * GRID_SIZE);
    } while (
      (mapCol === shipWreck.x && mapRow === shipWreck.y) ||
      rocks.some(r => r.x === mapCol && r.y === mapRow) ||
      (mapCol === oceanCurrent.x && mapRow === oceanCurrent.y)
    );
    const map = { x: mapCol, y: mapRow };

    // Step 5: Determine possible treasure locations based on constraints
    const possibleTreasureLocations = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        // Skip if cell is occupied by another element
        if ((x === shipWreck.x && y === shipWreck.y) ||
            rocks.some(r => r.x === x && r.y === y) ||
            (x === oceanCurrent.x && y === oceanCurrent.y) ||
            (x === map.x && y === map.y)) {
          continue;
        }

        // Check treasure placement constraints
        const isWithinShipwreckRange = MANHATTAN_DISTANCE(x, y, shipWreck.x, shipWreck.y) <= 3;
        const isNotAdjacentToRocks = !rocks.some(r => MANHATTAN_DISTANCE(x, y, r.x, r.y) <= 1);
        const isNotInOceanCurrentRowOrCol = x !== oceanCurrent.x && y !== oceanCurrent.y;
        const isInMapRow = y === map.y;

        if (isWithinShipwreckRange && isNotAdjacentToRocks && 
            isNotInOceanCurrentRowOrCol && isInMapRow) {
          possibleTreasureLocations.push({ x, y });
        }
      }
    }

    // If no valid treasure locations, restart initialization
    if (possibleTreasureLocations.length === 0) {
      return initializeGame();
    }

    // Select a random valid location for the treasure
    const treasure = possibleTreasureLocations[
      Math.floor(Math.random() * possibleTreasureLocations.length)
    ];

    // Step 6: Place pirates (avoiding all other elements)
    const pirates = [];
    const numPirates = 5; // Adjust number of pirates as needed
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
      shipWreck,
      pirates,
      treasure
    });

    // Create a new board with placed elements
    const newBoard = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));

    // Place visible elements on the board
    rocks.forEach(rock => {
      newBoard[rock.y][rock.x] = { type: 'rock', visible: true };
    });

    newBoard[oceanCurrent.y][oceanCurrent.x] = { type: 'oceanCurrent', visible: true };
    newBoard[map.y][map.x] = { type: 'map', visible: true };
    newBoard[shipWreck.y][shipWreck.x] = { type: 'shipWreck', visible: true };

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

    // Increment moves counter
    setMoves(moves + 1);

    // Create a copy of revealed cells
    const newRevealedCells = [...revealedCells, { x, y }];
    setRevealedCells(newRevealedCells);

    // Get the cell content
    const cell = board[y][x];

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
      const newBoard = [...board];
      newBoard[y][x] = { type: 'empty', visible: true, hint };
      setBoard(newBoard);
    } else if (cell.type === 'treasure' && !cell.visible) {
      // Found treasure - win the game
      const newBoard = [...board];
      newBoard[y][x] = { ...cell, visible: true };
      setBoard(newBoard);
      setGameStatus('won');
      setMessage(`Congratulations! You found the treasure in ${moves + 1} moves!`);
    } else if (cell.type === 'pirate' && !cell.visible) {
      // Hit a pirate
      const newPirateEncounters = pirateEncounters + 1;
      setPirateEncounters(newPirateEncounters);
      
      const newBoard = [...board];
      newBoard[y][x] = { ...cell, visible: true };
      setBoard(newBoard);
      
      if (newPirateEncounters >= 3) {
        // Game over - too many pirates
        setGameStatus('lost');
        setMessage('The pirates captured you! Game over.');
        
        // Reveal all pirates and the treasure
        const finalBoard = [...newBoard];
        elements.pirates.forEach(pirate => {
          finalBoard[pirate.y][pirate.x] = { type: 'pirate', visible: true };
        });
        finalBoard[elements.treasure.y][elements.treasure.x] = { type: 'treasure', visible: true };
        setBoard(finalBoard);
      } else {
        setMessage(`You encountered a pirate! (${newPirateEncounters}/3 encounters)`);
      }
    } else if (!cell.visible) {
      // Reveal other hidden elements
      const newBoard = [...board];
      newBoard[y][x] = { ...cell, visible: true };
      setBoard(newBoard);
      
      // Generate message based on what was revealed
      if (cell.type === 'map') {
        setMessage('This map shows the treasure is in this row!');
      } else if (cell.type === 'shipWreck') {
        setMessage('The shipwreck suggests the treasure is within 3 squares of here.');
      } else if (cell.type === 'oceanCurrent') {
        setMessage('The treasure cannot be in this row or column due to the ocean current.');
      } else if (cell.type === 'rock') {
        setMessage('Just a rock. The treasure cannot be adjacent to rocks.');
      }
    }
  };

  const isRevealed = (x, y) => {
    return revealedCells.some(cell => cell.x === x && cell.y === y);
  };

  const getCellClassName = (x, y) => {
    const cell = board[y][x];
    
    if (!cell || !cell.visible) {
      return 'cell hidden';
    }
    
    return `cell ${cell.type} visible`;
  };

  const getCellContent = (x, y) => {
    const cell = board[y][x];
    
    if (!cell || !cell.visible) {
      return '';
    }
    
    switch (cell.type) {
      case 'rock': return '🪨';
      case 'oceanCurrent': return '🌊';
      case 'map': return '🗺️';
      case 'shipWreck': return '🚢';
      case 'pirate': return '☠️';
      case 'treasure': return '💰';
      case 'empty': return '🔍';
      default: return '';
    }
  };

  return (
    <div className="treasure-rift-container">
      <div className="game-header">
        <h1>Treasure Rift</h1>
        <div className="game-stats">
          <div className="stat-item">
            <span className="stat-label">Moves:</span>
            <span className="stat-value">{moves}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Pirate Encounters:</span>
            <span className="stat-value">{pirateEncounters}/3</span>
          </div>
        </div>
      </div>

      <div className="game-message">{message}</div>

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

      <div className="game-legend">
        <h3>Legend</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-icon">🪨</span>
            <span className="legend-text">Rock - Treasure cannot be adjacent to rocks</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🌊</span>
            <span className="legend-text">Ocean Current - Treasure cannot be in this row or column</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🗺️</span>
            <span className="legend-text">Map - Treasure is in the same row</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🚢</span>
            <span className="legend-text">Shipwreck - Treasure is within 3 squares</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">☠️</span>
            <span className="legend-text">Pirate - Encounter 3 pirates and you lose!</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">💰</span>
            <span className="legend-text">Treasure - Find this to win!</span>
          </div>
        </div>
      </div>

      {gameStatus !== 'playing' && (
        <div className={`game-over-overlay ${gameStatus}`}>
          <div className="game-over-content">
            <h2>{gameStatus === 'won' ? 'Victory!' : 'Game Over!'}</h2>
            <p>{message}</p>
            <button className="restart-button" onClick={initializeGame}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreasureRift;