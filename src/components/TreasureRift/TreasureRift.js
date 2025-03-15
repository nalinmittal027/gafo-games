// src/components/TreasureRift/TreasureRift.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Utilities
import { 
  GRID_SIZE, 
  MAX_EXPLORATIONS, 
  revealCell, 
  checkMapCompassAlignment, 
  createDiagonalLine,
  isRevealed,
  isMarked
} from './utils/gameLogic';
import { generateDeepOceanSections, placeObstacles, createInitialBoard, placeGameElements } from './utils/boardGenerator';
import * as clueGenerator from './utils/clueGenerator';

// Components
import GameBoard from './components/GameBoard';
import Inventory from './components/Inventory';
import ClueDisplay from './components/ClueDisplay';
import GameOverlay from './components/GameOverlay';

// CSS
import './TreasureRift.css';

const TreasureRift = () => {
  // Game state
  const [board, setBoard] = useState(Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null)));
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [message, setMessage] = useState('Phase 1: Find the map to begin your journey!');
  const [elements, setElements] = useState({
    rocks: [],
    oceanCurrent: { x: 0, y: 0 },
    map: { x: 0, y: 0 },
    compass: { x: 0, y: 0 },
    shipWreck: { x: 0, y: 0 },
    treasure: { x: 0, y: 0 },
  });
  const [revealedCells, setRevealedCells] = useState([]);
  const [markedCells, setMarkedCells] = useState([]);
  const [explorationsLeft, setExplorationsLeft] = useState(MAX_EXPLORATIONS);
  const [score, setScore] = useState(1000); // Starting score of 1000
  const [clickTimeout, setClickTimeout] = useState(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [gamePhase, setGamePhase] = useState(1); // Phase 1: Find map, Phase 2: Find compass, Phase 3: Find shipwreck, Phase 4: Find treasure
  const [foundItems, setFoundItems] = useState({
    map: false,
    compass: false,
    shipwreck: false
  });
  const [mapOrientation, setMapOrientation] = useState(0); // 0, 90, 180, 270 degrees
  const [compassOrientation, setCompassOrientation] = useState(0); // 0, 90, 180, 270 degrees
  const [highlightedCells, setHighlightedCells] = useState([]);
  const [diagonalLine, setDiagonalLine] = useState([]);
  const [mapClue, setMapClue] = useState("");
  const [treasureClues, setTreasureClues] = useState([]);
  const [deepOceanSections, setDeepOceanSections] = useState({ allTiles: [], sections: [] });

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
    setMessage('Phase 1: Find the map to begin your journey!');
    setRevealedCells([]);
    setMarkedCells([]);
    setExplorationsLeft(MAX_EXPLORATIONS);
    setScore(1000);
    setGamePhase(1);
    setFoundItems({
      map: false,
      compass: false,
      shipwreck: false
    });
    setMapOrientation(0);
    setCompassOrientation(0);
    setHighlightedCells([]);
    setDiagonalLine([]);
    setMapClue("");
    setTreasureClues([]);

    // Create deep ocean sections (40% of the board)
    const deepOceanTiles = generateDeepOceanSections();
    setDeepOceanSections(deepOceanTiles);
    
    // Place rocks and ocean current
    const obstacles = placeObstacles();
    
    // Create the board with deep ocean and shallow ocean
    // All ocean tiles are visible from the start
    const newBoard = createInitialBoard(deepOceanTiles, obstacles);
    
    // Place the map, compass, shipwreck and treasure (all hidden)
    const gameElements = placeGameElements(newBoard, obstacles, deepOceanTiles, clueGenerator);
    
    const { map, compass, shipWreck, treasure, compassClue, treasureClues: clues } = gameElements;
    
    setElements({
      rocks: obstacles.rocks,
      oceanCurrent: obstacles.oceanCurrent,
      map,
      compass,
      shipWreck,
      treasure
    });
    
    // Set the clues
    setMapClue(compassClue);
    setTreasureClues(clues);
    
    setBoard(newBoard);
  };

  // Create diagonal line wrapper
  const createDiagonalLineWrapper = () => {
    createDiagonalLine(elements, setDiagonalLine);
  };

  // Rotate map
  const rotateMap = () => {
    setMapOrientation((prev) => (prev + 90) % 360);
    checkMapCompassAlignment(mapOrientation, compassOrientation, elements, setHighlightedCells, setMessage);
  };

  // Rotate compass
  const rotateCompass = () => {
    setCompassOrientation((prev) => (prev + 90) % 360);
    checkMapCompassAlignment(mapOrientation, compassOrientation, elements, setHighlightedCells, setMessage);
  };

  const handleCellClick = (x, y) => {
    if (gameStatus !== 'playing') {
      return;
    }
    
    // Check if this is a hidden item cell (map, compass, shipwreck, treasure)
    const { map, compass, shipWreck, treasure } = elements;
    const isHiddenItem = 
      (x === map.x && y === map.y) || 
      (x === compass.x && y === compass.y) ||
      (x === shipWreck.x && y === shipWreck.y) ||
      (x === treasure.x && y === treasure.y);
    
    // Handle double click (reveal)
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      
      // Double click reveals the cell
      // For hidden items that need to be found
      if (isHiddenItem && !isRevealed(x, y, elements, revealedCells)) {
        handleCellReveal(x, y);
      }
      // For ocean cells in Phase 1 to show arrow to map
      else if (gamePhase === 1 && !foundItems.map && !isRevealed(x, y, elements, revealedCells)) {
        handleCellReveal(x, y);
      }
      return;
    }
    
    // Single click - set timeout to detect if it's a single or double click
    const timeout = setTimeout(() => {
      // Single click toggles mark
      // We can mark both ocean cells and hidden item cells
      if (!isRevealed(x, y, elements, revealedCells)) {
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
    if (isMarked(x, y, markedCells)) {
      const newMarkedCells = markedCells.filter(cell => !(cell.x === x && cell.y === y));
      setMarkedCells(newMarkedCells);
    }
    
    setIsLongPress(true);
  };
  
  const toggleMark = (x, y) => {
    if (isMarked(x, y, markedCells)) {
      // Remove mark
      const newMarkedCells = markedCells.filter(cell => !(cell.x === x && cell.y === y));
      setMarkedCells(newMarkedCells);
    } else {
      // Add mark
      setMarkedCells([...markedCells, { x, y }]);
    }
  };

  const handleCellReveal = (x, y) => {
    revealCell(
      x, y, board, elements, revealedCells, markedCells, explorationsLeft, score, gamePhase,
      foundItems, gameStatus, treasureClues, mapClue, setRevealedCells, setMarkedCells, 
      setExplorationsLeft, setScore, setGamePhase, setFoundItems, setGameStatus, setMessage,
      setBoard, createDiagonalLineWrapper
    );
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
            <span className="stat-label">Phase</span>
            <span className="stat-value">{gamePhase}</span>
          </div>
          <div className="stat-item score">
            <span className="stat-label">Score</span>
            <span className="stat-value">{score}</span>
          </div>
        </div>
      </div>

      <div className="game-message">
        {message}
      </div>
      
      <Inventory
        foundItems={foundItems}
        mapOrientation={mapOrientation}
        compassOrientation={compassOrientation}
        rotateMap={rotateMap}
        rotateCompass={rotateCompass}
      />

      <GameBoard
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
      
      <ClueDisplay
        gamePhase={gamePhase}
        foundItems={foundItems}
        mapClue={mapClue}
        treasureClues={treasureClues}
      />

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
            <span className="legend-text">Rock - Treasure cannot be near rocks (including diagonally)</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🌊</span>
            <span className="legend-text">Ocean Current - Treasure cannot be in this row or column</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🗺️</span>
            <span className="legend-text">Map - Contains clues to find the Compass</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🧭</span>
            <span className="legend-text">Compass - Helps locate the Shipwreck when aligned with the Map</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">⚓</span>
            <span className="legend-text">Shipwreck - Contains a Scroll with clues to find the Treasure</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">💎</span>
            <span className="legend-text">Treasure - Find this to win!</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">➡️⬅️⬆️⬇️</span>
            <span className="legend-text">Direction Arrows - Point toward the Map during Phase 1</span>
          </div>
        </div>
      </div>

      <GameOverlay
        gameStatus={gameStatus}
        message={message}
        initializeGame={initializeGame}
      />
    </div>
  );
};

export default TreasureRift;