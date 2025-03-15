// src/components/TreasureRift/utils/clueGenerator.js

// Check if a number is prime
export const isPrime = (num) => {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  let i = 5;
  while (i * i <= num) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
    i += 6;
  }
  return true;
};

// Find the largest deep ocean section
const findLargestDeepOceanSection = (deepOceanTiles) => {
  if (deepOceanTiles.sections && deepOceanTiles.sections.length > 0) {
    return deepOceanTiles.sections[0]; // Already sorted by size
  }
  return null;
};

// Find the second largest deep ocean section
const findSecondLargestDeepOceanSection = (deepOceanTiles) => {
  if (deepOceanTiles.sections && deepOceanTiles.sections.length > 1) {
    return deepOceanTiles.sections[1];
  }
  return null;
};

// Check if tile is in the outermost squares of a section
const isOuterSquare = (tile, section) => {
  if (!section || !section.tiles) return false;
  
  for (const t of section.tiles) {
    // Check all 8 neighbors of this tile
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue; // Skip the tile itself
        
        const nx = t.x + dx;
        const ny = t.y + dy;
        
        // If a neighbor is not in the section, then this tile is on the outer edge
        if (!section.tiles.some(nt => nt.x === nx && nt.y === ny)) {
          if (t.x === tile.x && t.y === tile.y) {
            return true; // This tile is on the outer edge
          }
        }
      }
    }
  }
  
  return false;
};

// Generate compass clue
export const generateCompassClue = (compass, obstacles, deepOceanTiles) => {
  const row = compass.y + 1; // 1-based row number
  const col = compass.x + 1; // 1-based column number
  
  // Calculate distance to rocks and ocean current
  const distanceToRocks = obstacles.rocks.map(rock => 
    Math.abs(compass.x - rock.x) + Math.abs(compass.y - rock.y)
  );
  
  const distanceToOceanCurrent = 
    Math.abs(compass.x - obstacles.oceanCurrent.x) + 
    Math.abs(compass.y - obstacles.oceanCurrent.y);
  
  const closerToRocksThanOceanCurrent = 
    Math.min(...distanceToRocks) < distanceToOceanCurrent;
  
  // Calculate section information
  const largestSection = findLargestDeepOceanSection(deepOceanTiles);
  const secondLargestSection = findSecondLargestDeepOceanSection(deepOceanTiles);
  
  const inLargestSection = largestSection && 
    largestSection.tiles.some(t => t.x === compass.x && t.y === compass.y);
  
  const inSecondLargestSection = secondLargestSection && 
    secondLargestSection.tiles.some(t => t.x === compass.x && t.y === compass.y);
  
  const notInOuterSquares = inLargestSection && 
    !isOuterSquare({ x: compass.x, y: compass.y }, largestSection);
  
  // Generate clues based on the actual compass position
  const clues = [];
  
  // Deep ocean clue
  if (inLargestSection) {
    if (notInOuterSquares) {
      clues.push(`The compass is in the largest deep ocean section but NOT in its outermost squares.`);
    } else {
      clues.push(`The compass is in the largest deep ocean section.`);
    }
  } else if (inSecondLargestSection) {
    clues.push(`The compass is in the second-largest deep ocean section.`);
  } else {
    clues.push(`The compass is in the Deep Ocean.`);
  }
  
  // Proximity to obstacles clue
  if (closerToRocksThanOceanCurrent) {
    clues.push(`The compass is closer to rocks than the Ocean Current.`);
  } else {
    clues.push(`The compass is closer to the Ocean Current than to any Rock.`);
  }
  
  // Row/column numerical clues
  clues.push(`The sum of the row and column number of the compass equals ${row + col}.`);
  
  if (Math.abs(row - col) === 2) {
    clues.push(`The difference between the row and column of the compass is 2.`);
  }
  
  if ((row + col) % 5 === 0) {
    clues.push(`The sum of the row and column of the compass is a multiple of 5.`);
  } else if ((row + col) % 3 === 0) {
    clues.push(`The sum of the row and column of the compass is a multiple of 3.`);
  }
  
  // Parity clues
  clues.push(`The compass is in an ${row % 2 === 0 ? 'even' : 'odd'} row and ${col % 2 === 0 ? 'even' : 'odd'} column.`);
  
  // Prime row clue
  if (isPrime(row)) {
    clues.push(`The compass is in a prime-numbered row.`);
    
    if (col % 2 === 0) {
      clues.push(`The compass is in a prime-numbered row and an even-numbered column.`);
    }
  }
  
  // Column divisibility
  if (col % 4 === 0) {
    clues.push(`The compass is at the intersection of an ${row % 2 === 1 ? 'odd' : 'even'}-numbered row and a column divisible by 4.`);
  } else if (col % 3 === 0) {
    clues.push(`The compass is in a column divisible by 3.`);
  }
  
  // Relation to Ocean Current
  const sameRowAsOceanCurrent = compass.y === obstacles.oceanCurrent.y;
  const sameColAsOceanCurrent = compass.x === obstacles.oceanCurrent.x;
  
  if (!sameRowAsOceanCurrent && !sameColAsOceanCurrent) {
    clues.push(`The compass is away from the Ocean Current's row and column.`);
  }
  
  // Proximity to rocks
  const nearRock = distanceToRocks.some(d => d === 2);
  const adjacentToRock = distanceToRocks.some(d => d === 1);
  
  if (nearRock && !adjacentToRock) {
    clues.push(`The compass is within 2 squares of a Rock but NOT directly adjacent.`);
  }
  
  // Choose a random clue that's accurate
  return clues[Math.floor(Math.random() * clues.length)];
};

// Generate treasure clues
export const generateTreasureClues = (treasure, map, compass, shipWreck, obstacles, deepOceanTiles, board) => {
  const row = treasure.y + 1; // 1-based row
  const col = treasure.x + 1; // 1-based column
  
  const mapRow = map.y + 1;
  const mapCol = map.x + 1;
  
  const compassRow = compass.y + 1;
  const compassCol = compass.x + 1;
  
  const shipWreckRow = shipWreck.y + 1;
  const shipWreckCol = shipWreck.x + 1;
  
  // Determine treasure's ocean type
  const isTreasureInDeepOcean = 
    board[treasure.y][treasure.x].type === 'deepOcean' || 
    board[treasure.y][treasure.x].baseType === 'deepOcean';
  
  const clues = [];
  
  // Location Constraints
  if (treasure.y < 4) { // In top half
    clues.push(`The treasure is in the half of the grid where the Map was found.`);
  } else {
    clues.push(`The treasure is in the half of the grid opposite from where the Map was found.`);
  }
  
  clues.push(`The treasure is NOT in the same row or column as the Ocean Current.`);
  
  if (row > 3) {
    if (col % 3 === 0) {
      clues.push(`The treasure is in a row number greater than 3 and in a column divisible by 3.`);
    } else if (col % 2 === 0) {
      clues.push(`The treasure is in a row number greater than 3 and in an even-numbered column.`);
    } else {
      clues.push(`The treasure is in a row number greater than 3.`);
    }
  }
  
  // Ocean type
  if (isTreasureInDeepOcean) {
    clues.push(`The treasure is in a Deep Ocean tile.`);
  } else {
    clues.push(`The treasure is in a Shallow Ocean tile.`);
  }
  
  // Number-Based Clues
  if ((row + col) % 2 === 1) {
    clues.push(`The sum of the row and column number of the treasure location is an odd number.`);
  } else {
    clues.push(`The sum of the row and column number of the treasure location is an even number.`);
  }
  
  if (isPrime(row)) {
    clues.push(`The row number of the treasure is a prime number.`);
  } else {
    clues.push(`The row number of the treasure is not a prime number.`);
  }
  
  // Column clue
  const avgCol = Math.floor((shipWreckRow + shipWreckCol) / 2);
  if (col === avgCol) {
    clues.push(`The treasure is in a column that is the average of the row and column of the Shipwreck (rounded down).`);
  }
  
  // Directional Clues
  if (treasure.x > shipWreck.x) {
    clues.push(`The treasure is to the East of the Shipwreck.`);
  } else if (treasure.x < shipWreck.x) {
    clues.push(`The treasure is to the West of the Shipwreck.`);
  }
  
  if (treasure.y < map.y) {
    clues.push(`The treasure is in a row above the Map.`);
  } else if (treasure.y > map.y) {
    clues.push(`The treasure is in a row below the Map.`);
  }
  
  if (treasure.y === compass.y) {
    const compassOceanType = board[compass.y][compass.x].baseType || board[compass.y][compass.x].type;
    if ((isTreasureInDeepOcean && compassOceanType !== 'deepOcean') || 
        (!isTreasureInDeepOcean && compassOceanType === 'deepOcean')) {
      clues.push(`The treasure is in the same row as the Compass but in a different ocean type.`);
    } else {
      clues.push(`The treasure is in the same row as the Compass.`);
    }
  } else if (treasure.y === shipWreck.y) {
    clues.push(`The treasure is in the same row as the Shipwreck.`);
  }
  
  // Pattern-Based Clues
  const isSymmetric = (row + col === 9); // 8x8 grid, so center is between 4,5
  if (isSymmetric) {
    clues.push(`The treasure is located at the intersection of two tiles that are symmetrical to each other across the grid's center.`);
  }
  
  // Check for Fibonacci relationship
  const fibNumbers = [1, 2, 3, 5, 8];
  if (fibNumbers.includes(row) && fibNumbers.includes(col)) {
    clues.push(`The treasure's row and column both follow the Fibonacci sequence.`);
  }
  
  // Mirror of shipwreck
  const mirroredX = 9 - shipWreckCol; // 8x8 grid with 1-based indices
  const mirroredY = 9 - shipWreckRow;
  if (col === mirroredX && row === mirroredY) {
    clues.push(`The treasure is placed at a coordinate that mirrors the Shipwreck's location when flipped diagonally.`);
  }
  
  // Shuffle and pick 4-5 clues
  const shuffledClues = [...clues].sort(() => 0.5 - Math.random());
  const numClues = Math.random() < 0.5 ? 4 : 5;
  return shuffledClues.slice(0, numClues);
};