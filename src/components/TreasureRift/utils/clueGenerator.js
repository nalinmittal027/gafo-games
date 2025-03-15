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
  
  // Generate compass clue
  export const generateCompassClue = (compass, obstacles, deepOceanTiles) => {
    const clueOptions = [
      `The compass is in the Deep Ocean, closer to rocks than the Ocean Current.`,
      `The sum of the row and column number of the compass equals ${compass.x + 1 + compass.y + 1}.`,
      `The compass is in an ${(compass.y + 1) % 2 === 0 ? 'even' : 'odd'} row and ${(compass.x + 1) % 2 === 0 ? 'even' : 'odd'} column.`,
      `The compass is within 2 squares of a Rock but NOT directly adjacent.`,
      `The compass is NOT in the same row or column as the Ocean Current.`,
      `The compass is in a prime-numbered row and an even-numbered column.`,
      `The difference between the row and column of the compass is ${Math.abs((compass.y + 1) - (compass.x + 1))}.`,
      `The sum of the row and column of the compass is a multiple of ${((compass.x + 1 + compass.y + 1) % 3 === 0) ? '3' : '5'}.`
    ];
    
    // Pick a random clue
    return clueOptions[Math.floor(Math.random() * clueOptions.length)];
  };
  
  // Generate treasure clues
  export const generateTreasureClues = (treasure, map, compass, shipWreck, obstacles, deepOceanTiles, board) => {
    const possibleClues = [
      // Location Constraints
      `The treasure is in the half of the grid where the Map was found.`,
      `The treasure is NOT in the same row or column as the Ocean Current.`,
      `The treasure is in a row number greater than ${Math.min(treasure.y, 3)} but in a column divisible by ${(treasure.x + 1) % 3 === 0 ? '3' : '2'}.`,
      `The treasure is NOT in the 2 or 3 nearest squares to any Rock.`,
      
      // Number-Based Clues
      `The sum of the row and column number of the treasure location is ${(treasure.x + 1 + treasure.y + 1) % 2 === 0 ? 'an even' : 'an odd'} number.`,
      `The treasure's row is ${treasure.y + 1}.`,
      `The treasure is in a column that is the average of the row and column of the Shipwreck (rounded down).`,
      `The row number of the treasure is ${isPrime(treasure.y + 1) ? 'a prime number' : 'not a prime number'}.`,
      
      // Directional Clues
      `The treasure is to the East of the Shipwreck.`,
      `The treasure is in a row ${treasure.y < map.y ? 'above' : 'below'} the Map.`,
      `The treasure is in the same row as the ${treasure.y === compass.y ? 'Compass' : 'Shipwreck'} but in a different ocean type.`,
      
      // Pattern-Based Clues
      `The treasure is placed at a coordinate that mirrors the Shipwreck's location when flipped diagonally.`,
      `The treasure is in a ${board[treasure.y][treasure.x].type === 'deepOcean' ? 'Deep' : 'Shallow'} Ocean tile.`
    ];
    
    // Shuffle the array
    const shuffledClues = [...possibleClues].sort(() => 0.5 - Math.random());
    
    // Take 4-5 clues
    const numClues = Math.random() < 0.5 ? 4 : 5;
    return shuffledClues.slice(0, numClues);
  };