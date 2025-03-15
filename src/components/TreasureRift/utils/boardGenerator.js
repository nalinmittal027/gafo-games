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
// All ocean tiles are visible initially
export const createInitialBoard = (deepOceanTiles, obstacles) => {
  const newBoard = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));
  
  // Add all tiles as shallow or deep ocean (visible from the start)
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const isDeepOcean = deepOceanTiles.allTiles.some(tile => tile.x === x && tile.y === y);
      newBoard[y][x] = { 
        type: isDeepOcean ? 'deepOcean' : 'shallowOcean', 
        visible: true // All ocean tiles are visible from the start
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

// Generate a valid compass location with meaningful clues
export const generateCompassLocation = (board, obstacles, deepOceanTiles) => {
  // Get all deep ocean tiles as potential compass locations
  const deepOceanTilesList = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (
        board[y][x].type === 'deepOcean' &&
        !obstacles.rocks.some(rock => rock.x === x && rock.y === y) &&
        !(obstacles.oceanCurrent.x === x && obstacles.oceanCurrent.y === y)
      ) {
        deepOceanTilesList.push({ x, y });
      }
    }
  }

  // If no deep ocean tiles available, fallback to any available tile
  if (deepOceanTilesList.length === 0) {
    const validTiles = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (
          !obstacles.rocks.some(rock => rock.x === x && rock.y === y) &&
          !(obstacles.oceanCurrent.x === x && obstacles.oceanCurrent.y === y)
        ) {
          validTiles.push({ x, y });
        }
      }
    }
    return validTiles[Math.floor(Math.random() * validTiles.length)];
  }

  // Apply some constraints to make clues meaningful
  const constraints = [];

  // Constraint 1: In even row and odd column
  constraints.push(deepOceanTilesList.filter(tile => 
    (tile.y + 1) % 2 === 0 && (tile.x + 1) % 2 === 1
  ));

  // Constraint 2: Not in same row/column as ocean current
  constraints.push(deepOceanTilesList.filter(tile =>
    tile.x !== obstacles.oceanCurrent.x && tile.y !== obstacles.oceanCurrent.y
  ));

  // Constraint 3: Within 2 squares of a rock but not adjacent
  constraints.push(deepOceanTilesList.filter(tile => {
    return obstacles.rocks.some(rock => {
      const distance = Math.abs(tile.x - rock.x) + Math.abs(tile.y - rock.y);
      return distance === 2; // 2 squares away, not 1 (not adjacent)
    });
  }));

  // Find a tile that satisfies multiple constraints if possible
  for (let i = 0; i < constraints.length; i++) {
    if (constraints[i].length > 0) {
      return constraints[i][Math.floor(Math.random() * constraints[i].length)];
    }
  }

  // If no tile satisfies our constraints, just pick a random deep ocean tile
  return deepOceanTilesList[Math.floor(Math.random() * deepOceanTilesList.length)];
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
  const eastTiles = validTiles.filter(tile => tile.x > shipWreck.x);
  if (eastTiles.length > 0) {
    validTiles = eastTiles;
  }
  
  // If we still have multiple options, apply more filters:
  if (validTiles.length > 1) {
    // Filter 4: Number-based clue (e.g., sum of row and column is odd)
    const oddSumTiles = validTiles.filter(tile => (tile.x + 1 + tile.y + 1) % 2 === 1);
    if (oddSumTiles.length > 0) {
      validTiles = oddSumTiles;
    }
  }
  
  // If we narrowed down to at least one tile, use the first one
  if (validTiles.length > 0) {
    return validTiles[0];
  }
  
  // Fallback: If no valid tile with all constraints, relax constraints and just use a valid tile
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (
        !(x === map.x && y === map.y) &&
        !(x === compass.x && y === compass.y) &&
        !(x === shipWreck.x && y === shipWreck.y) &&
        !obstacles.rocks.some(rock => rock.x === x && rock.y === y) &&
        !(obstacles.oceanCurrent.x === x && obstacles.oceanCurrent.y === y)
      ) {
        return { x, y };
      }
    }
  }
  
  // Last resort - just return a position that's not a rock or current
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (
        !obstacles.rocks.some(rock => rock.x === x && rock.y === y) &&
        !(obstacles.oceanCurrent.x === x && obstacles.oceanCurrent.y === y)
      ) {
        return { x, y };
      }
    }
  }
  
  // If we somehow got here, just return a position
  return { x: 0, y: 0 };
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
  
  // Place map (hidden)
  const mapIndex = Math.floor(Math.random() * validMapTiles.length);
  const map = validMapTiles[mapIndex];
  if (map && board[map.y] && board[map.y][map.x]) {
    board[map.y][map.x] = { 
      type: 'map', 
      // Keep base type for clue generation
      baseType: board[map.y][map.x].type,
      visible: false // Map is hidden initially
    };
  }
  
  // Generate compass location based on clues (hidden)
  const compass = generateCompassLocation(board, obstacles, deepOceanTiles);
  if (compass && board[compass.y] && board[compass.y][compass.x]) {
    board[compass.y][compass.x] = { 
      type: 'compass', 
      // Keep base type for clue generation
      baseType: board[compass.y][compass.x].type,
      visible: false // Compass is hidden initially
    };
  }
  
  // Generate shipwreck location based on map and compass orientation (hidden)
  const shipWreck = generateShipwreckLocation(map, compass);
  if (shipWreck && board[shipWreck.y] && board[shipWreck.y][shipWreck.x]) {
    board[shipWreck.y][shipWreck.x] = { 
      type: 'shipWreck', 
      // Keep base type for clue generation
      baseType: board[shipWreck.y][shipWreck.x].type,
      visible: false // Shipwreck is hidden initially
    };
  }
  
  // Generate treasure location based on various clues (hidden)
  const treasure = generateTreasureLocation(
    board, map, compass, shipWreck, obstacles, deepOceanTiles
  );
  if (treasure && board[treasure.y] && board[treasure.y][treasure.x]) {
    board[treasure.y][treasure.x] = { 
      type: 'treasure', 
      // Keep base type for clue generation
      baseType: board[treasure.y][treasure.x].type,
      visible: false // Treasure is hidden initially
    };
  }
  
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