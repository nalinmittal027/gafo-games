// src/components/TreasureRift/utils/boardGenerator.js

// Constants
const GRID_SIZE = 8;

// Generate deep ocean sections (40% of the board)
export const generateDeepOceanSections = () => {
  const totalCells = GRID_SIZE * GRID_SIZE;
  const deepOceanTarget = Math.floor(totalCells * 0.4); // 40% of cells
  const tiles = [];
  
  // Create 2-3 large deep ocean sections
  const numSections = Math.random() < 0.5 ? 2 : 3;
  const sectionsInfo = [];
  
  for (let i = 0; i < numSections; i++) {
    // Start with a random center tile
    const centerRow = Math.floor(Math.random() * GRID_SIZE);
    const centerCol = Math.floor(Math.random() * GRID_SIZE);
    
    // Add the center tile
    const sectionTiles = [{ x: centerCol, y: centerRow }];
    tiles.push({ x: centerCol, y: centerRow });
    
    // Add a cluster of surrounding tiles
    const clusterSize = Math.floor(deepOceanTarget / numSections);
    
    for (let j = 0; j < clusterSize - 1; j++) {
      // Find a valid neighboring tile
      let added = false;
      let attempts = 0;
      
      while (!added && attempts < 20) {
        attempts++;
        
        // Pick a random existing tile
        const baseTile = sectionTiles[Math.floor(Math.random() * sectionTiles.length)];
        
        // Try to add a neighboring tile
        const directions = [
          { dx: -1, dy: 0 }, // left
          { dx: 1, dy: 0 },  // right
          { dx: 0, dy: -1 }, // up
          { dx: 0, dy: 1 },  // down
        ];
        
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const newCol = baseTile.x + dir.dx;
        const newRow = baseTile.y + dir.dy;
        
        // Check if the new tile is valid and not already added
        if (
          newRow >= 0 && newRow < GRID_SIZE && 
          newCol >= 0 && newCol < GRID_SIZE && 
          !tiles.some(t => t.x === newCol && t.y === newRow)
        ) {
          const newTile = { x: newCol, y: newRow };
          tiles.push(newTile);
          sectionTiles.push(newTile);
          added = true;
        }
      }
    }
    
    sectionsInfo.push({
      size: sectionTiles.length,
      tiles: sectionTiles
    });
  }
  
  // Sort sections by size (largest first)
  sectionsInfo.sort((a, b) => b.size - a.size);
  
  return {
    allTiles: tiles,
    sections: sectionsInfo
  };
};

// Place rocks and ocean current
export const placeObstacles = () => {
  const rocks = [];
  
  // Place 3 rocks
  for (let i = 0; i < 3; i++) {
    let placed = false;
    
    while (!placed) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      
      // Check if this position is already taken
      if (!rocks.some(rock => rock.x === x && rock.y === y)) {
        rocks.push({ x, y });
        placed = true;
      }
    }
  }
  
  // Place 1 ocean current
  let oceanCurrent;
  let placed = false;
  
  while (!placed) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    
    // Check if this position is already taken by a rock
    if (!rocks.some(rock => rock.x === x && rock.y === y)) {
      oceanCurrent = { x, y };
      placed = true;
    }
  }
  
  return { rocks, oceanCurrent };
};

// Create initial board with deep ocean, shallow ocean, rocks and ocean current
export const createInitialBoard = (deepOceanTiles, obstacles) => {
  const newBoard = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));
  
  // Add all tiles as shallow or deep ocean
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const isDeepOcean = deepOceanTiles.allTiles.some(tile => tile.x === x && tile.y === y);
      newBoard[y][x] = { 
        type: isDeepOcean ? 'deepOcean' : 'shallowOcean', 
        visible: false 
      };
    }
  }
  
  // Add rocks (visible from the start)
  obstacles.rocks.forEach(rock => {
    newBoard[rock.y][rock.x] = { type: 'rock', visible: true };
  });
  
  // Add ocean current (visible from the start)
  newBoard[obstacles.oceanCurrent.y][obstacles.oceanCurrent.x] = { 
    type: 'oceanCurrent', 
    visible: true 
  };
  
  return newBoard;
};

// Place map, compass, shipwreck and treasure
export const placeGameElements = (board, obstacles, deepOceanTiles, clueGenerator) => {
  // Find valid tiles for map (any blue tile)
  const validMapTiles = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (
        (board[y][x].type === 'deepOcean' || board[y][x].type === 'shallowOcean') &&
        !obstacles.rocks.some(rock => rock.x === x && rock.y === y) &&
        !(obstacles.oceanCurrent.x === x && obstacles.oceanCurrent.y === y)
      ) {
        validMapTiles.push({ x, y });
      }
    }
  }
  
  // Place map
  const mapIndex = Math.floor(Math.random() * validMapTiles.length);
  const map = validMapTiles[mapIndex];
  board[map.y][map.x] = { type: 'map', visible: false };
  
  // Generate compass location based on clues
  const compass = generateCompassLocation(board, obstacles, deepOceanTiles);
  board[compass.y][compass.x] = { type: 'compass', visible: false };
  
  // Generate shipwreck location based on map and compass orientation
  const shipWreck = generateShipwreckLocation(map, compass);
  board[shipWreck.y][shipWreck.x] = { type: 'shipWreck', visible: false };
  
  // Generate treasure location based on various clues
  const treasure = generateTreasureLocation(
    board, map, compass, shipWreck, obstacles, deepOceanTiles
  );
  board[treasure.y][treasure.x] = { type: 'treasure', visible: false };
  
  // Generate clues
  const compassClue = clueGenerator.generateCompassClue(compass, obstacles, deepOceanTiles);
  const treasureClues = clueGenerator.generateTreasureClues(
    treasure, map, compass, shipWreck, obstacles, deepOceanTiles, board
  );
  
  return { 
    map, 
    compass, 
    shipWreck, 
    treasure,
    compassClue,
    treasureClues
  };
};

// Generate a valid compass location
export const generateCompassLocation = (board, obstacles, deepOceanTiles) => {
  // Prefer deep ocean tiles
  const deepOceanTilesList = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (
        board[y][x].type === 'deepOcean' &&
        !obstacles.rocks.some(rock => rock.x === x && rock.y === y) &&
        !(obstacles.oceanCurrent.x === x && obstacles.oceanCurrent.y === y) &&
        !(board[y][x].type === 'map')
      ) {
        deepOceanTilesList.push({ x, y });
      }
    }
  }

  // Add constraints based on different types of clues
  const filteredTiles = deepOceanTilesList.filter(tile => {
    // Example: Compass is in an even row and odd column
    return (tile.y + 1) % 2 === 0 && (tile.x + 1) % 2 === 1;
  });
  
  if (filteredTiles.length > 0) {
    return filteredTiles[Math.floor(Math.random() * filteredTiles.length)];
  }
  
  // Fallback to any deep ocean tile
  if (deepOceanTilesList.length > 0) {
    return deepOceanTilesList[Math.floor(Math.random() * deepOceanTilesList.length)];
  }
  
  // Last resort: any valid tile
  const validTiles = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (
        !obstacles.rocks.some(rock => rock.x === x && rock.y === y) &&
        !(obstacles.oceanCurrent.x === x && obstacles.oceanCurrent.y === y) &&
        !(board[y][x].type === 'map')
      ) {
        validTiles.push({ x, y });
      }
    }
  }
  
  return validTiles[Math.floor(Math.random() * validTiles.length)];
};

// Generate a shipwreck location based on map and compass
export const generateShipwreckLocation = (map, compass) => {
  // Create a direction vector from map to compass
  const dx = compass.x - map.x;
  const dy = compass.y - map.y;
  
  // Extend this vector to find the shipwreck
  let newX = compass.x + dx;
  let newY = compass.y + dy;
  
  // Make sure it's within bounds
  newX = Math.max(0, Math.min(GRID_SIZE - 1, newX));
  newY = Math.max(0, Math.min(GRID_SIZE - 1, newY));
  
  // If exactly on map or compass, adjust slightly
  if ((newX === map.x && newY === map.y) || (newX === compass.x && newY === compass.y)) {
    // Try to adjust position slightly
    if (newX < GRID_SIZE - 1) newX++;
    else if (newX > 0) newX--;
    else if (newY < GRID_SIZE - 1) newY++;
    else if (newY > 0) newY--;
  }
  
  return { x: newX, y: newY };
};

// Generate a treasure location based on clues
export const generateTreasureLocation = (board, map, compass, shipWreck, obstacles, deepOceanTiles) => {
  // Start with all valid tiles
  let validTiles = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (
        !(x === map.x && y === map.y) &&
        !(x === compass.x && y === compass.y) &&
        !(x === shipWreck.x && y === shipWreck.y) &&
        !obstacles.rocks.some(rock => rock.x === x && rock.y === y) &&
        !(obstacles.oceanCurrent.x === x && obstacles.oceanCurrent.y === y)
      ) {
        validTiles.push({ x, y });
      }
    }
  }
  
  // Filter 1: Treasure is NOT in the same row or column as the Ocean Current
  validTiles = validTiles.filter(tile => 
    tile.x !== obstacles.oceanCurrent.x && 
    tile.y !== obstacles.oceanCurrent.y
  );
  
  // Filter 2: Treasure is NOT near rocks (including diagonals)
  validTiles = validTiles.filter(tile => {
    return !obstacles.rocks.some(rock => {
      const dx = Math.abs(tile.x - rock.x);
      const dy = Math.abs(tile.y - rock.y);
      return dx <= 1 && dy <= 1; // This includes adjacent and diagonal
    });
  });
  
  // Filter 3: Directional clue (e.g., East of the Shipwreck)
  validTiles = validTiles.filter(tile => 
    tile.x > shipWreck.x
  );
  
  // If we still have multiple options, apply more filters:
  
  // Filter 4: Number-based clue (e.g., sum of row and column is odd)
  if (validTiles.length > 1) {
    validTiles = validTiles.filter(tile => 
      (tile.x + 1 + tile.y + 1) % 2 === 1
    );
  }
  
  // If we narrowed down to at least one tile, use it
  if (validTiles.length > 0) {
    return validTiles[Math.floor(Math.random() * validTiles.length)];
  }
  
  // Fallback: If no valid tile with all constraints, relax constraints and try again
  validTiles = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (
        !(x === map.x && y === map.y) &&
        !(x === compass.x && y === compass.y) &&
        !(x === shipWreck.x && y === shipWreck.y) &&
        !obstacles.rocks.some(rock => rock.x === x && rock.y === y) &&
        !(obstacles.oceanCurrent.x === x && obstacles.oceanCurrent.y === y)
      ) {
        validTiles.push({ x, y });
      }
    }
  }
  
  return validTiles[Math.floor(Math.random() * validTiles.length)];
};