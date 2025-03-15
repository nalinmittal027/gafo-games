// src/components/TreasureRift/utils/gameLogic.js

export const GRID_SIZE = 8;
export const MAX_EXPLORATIONS = 10;
export const MANHATTAN_DISTANCE = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2);

// Check if a cell is revealed
export const isRevealed = (x, y, elements, revealedCells) => {
  // Check if rock or ocean current (always revealed)
  const { rocks, oceanCurrent } = elements;
  if (rocks.some(r => r.x === x && r.y === y) || (oceanCurrent.x === x && oceanCurrent.y === y)) {
    return true;
  }
  
  return revealedCells.some(cell => cell.x === x && cell.y === y);
};

// Check if a cell is marked
export const isMarked = (x, y, markedCells) => {
  return markedCells.some(cell => cell.x === x && cell.y === y);
};

// Check if a cell is highlighted
export const isHighlighted = (x, y, highlightedCells) => {
  return highlightedCells.some(cell => cell.x === x && cell.y === y);
};

// Check if a cell is in the diagonal line
export const isInDiagonalLine = (x, y, foundItems, diagonalLine) => {
  return foundItems.map && foundItems.compass && 
         diagonalLine.some(cell => cell.x === x && cell.y === y);
};

// Get arrow direction to map
export const getArrowToMap = (x, y, elements, foundItems) => {
  if (foundItems.map) return null;
  
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

// Overlay map and compass to find shipwreck
export const checkMapCompassAlignment = (mapOrientation, compassOrientation, elements, setHighlightedCells, setMessage) => {
  // Check if the orientations align correctly to point to the shipwreck
  const { map, compass, shipWreck } = elements;
  
  // Create vector from map to compass
  let dx = compass.x - map.x;
  let dy = compass.y - map.y;
  
  // Apply rotations based on orientation
  // For simplicity, we'll just check if they're both at the same orientation
  if (mapOrientation === compassOrientation) {
    // Extend the vector to predict shipwreck location
    const predictedX = compass.x + dx;
    const predictedY = compass.y + dy;
    
    // If prediction is close to actual shipwreck, highlight it
    if (predictedX === shipWreck.x && predictedY === shipWreck.y) {
      setHighlightedCells([{ x: shipWreck.x, y: shipWreck.y }]);
      setMessage("You've aligned the Map and Compass correctly! The Shipwreck location is highlighted.");
      return true;
    }
  }
  
  // If no alignment, clear highlights
  setHighlightedCells([]);
  return false;
};

// Create diagonal line from map to compass
export const createDiagonalLine = (elements, setDiagonalLine) => {
  const { map, compass } = elements;
  if (!map || !compass) return;
  
  const dx = compass.x - map.x;
  const dy = compass.y - map.y;
  
  const line = [];
  
  // Create a line from map to compass (and beyond)
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  
  // Include map and compass points
  line.push({ x: map.x, y: map.y });
  
  // Add points along the line
  for (let i = 1; i <= steps; i++) {
    const ratio = i / steps;
    const x = Math.round(map.x + dx * ratio);
    const y = Math.round(map.y + dy * ratio);
    line.push({ x, y });
  }
  
  // Add extension point (potential shipwreck location)
  const extendedX = Math.min(GRID_SIZE - 1, Math.max(0, compass.x + dx));
  const extendedY = Math.min(GRID_SIZE - 1, Math.max(0, compass.y + dy));
  
  if (extendedX !== compass.x || extendedY !== compass.y) {
    line.push({ x: extendedX, y: extendedY });
  }
  
  setDiagonalLine(line);
};

// Handle revealing a cell
export const revealCell = (x, y, board, elements, revealedCells, markedCells, explorationsLeft, score, gamePhase, 
  foundItems, gameStatus, treasureClues, mapClue, setRevealedCells, setMarkedCells, setExplorationsLeft, 
  setScore, setGamePhase, setFoundItems, setGameStatus, setMessage, setBoard, createDiagonalLineFunc) => {
  
  // Prevent revealing already revealed cells
  if (isRevealed(x, y, elements, revealedCells)) {
    return null;
  }
  
  // Decrement explorations left
  const newExplorationsLeft = explorationsLeft - 1;
  
  // Reduce score for each exploration
  const newScore = Math.max(0, score - 100);

  // Add to revealed cells
  const newRevealedCells = [...revealedCells, { x, y }];
  
  // Remove any mark on this cell
  let newMarkedCells = markedCells;
  if (isMarked(x, y, markedCells)) {
    newMarkedCells = markedCells.filter(cell => !(cell.x === x && cell.y === y));
  }

  // Check if this cell has something important
  const { map, compass, shipWreck, treasure } = elements;
  
  // Create a copy of the board for updates
  const newBoard = JSON.parse(JSON.stringify(board));
  
  // Make cell visible
  if (newBoard[y][x]) {
    newBoard[y][x] = { ...newBoard[y][x], visible: true };
  } else {
    // Handle case where cell might be undefined
    newBoard[y][x] = { type: 'empty', visible: true };
  }
  
  // Update state first
  setRevealedCells(newRevealedCells);
  setMarkedCells(newMarkedCells);
  setExplorationsLeft(newExplorationsLeft);
  setScore(newScore);
  setBoard(newBoard);
  
  // Check for game over due to running out of attempts
  if (newExplorationsLeft <= 0 && gameStatus === 'playing') {
    setGameStatus('lost');
    setMessage('You ran out of explorations! The treasure remains hidden.');
    
    // Reveal the treasure
    const finalBoard = JSON.parse(JSON.stringify(newBoard));
    finalBoard[treasure.y][treasure.x] = { ...finalBoard[treasure.y][treasure.x], visible: true };
    setBoard(finalBoard);
    return { newExplorationsLeft, newScore, finalBoard };
  }
  
  // Check for special items - using separate conditionals to avoid complex logic chains
  if (x === map.x && y === map.y) {
    // Found the Map
    setFoundItems(prev => ({ ...prev, map: true }));
    setGamePhase(2);
    setMessage(`You found the Map! ${mapClue}`);
    
    // Create diagonal line to help find compass
    if (createDiagonalLineFunc) createDiagonalLineFunc();
  }
  else if (x === compass.x && y === compass.y) {
    // Found the Compass
    setFoundItems(prev => ({ ...prev, compass: true }));
    
    if (foundItems.map) {
      // If map is already found, move to Phase 3
      setGamePhase(3);
      setMessage("You found the Compass! Rotate the Map and Compass to align them and find the Shipwreck.");
    } else {
      setMessage("You found the Compass! Now find the Map to complete the path.");
    }
  }
  else if (x === shipWreck.x && y === shipWreck.y) {
    // Found the Shipwreck
    setFoundItems(prev => ({ ...prev, shipwreck: true }));
    setGamePhase(4);
    
    // Format the clues nicely
    const clueList = treasureClues.map((clue, index) => `${index + 1}. ${clue}`).join('\n');
    setMessage(`You found the Shipwreck and a Scroll! The Scroll contains these clues to find the treasure:\n${clueList}`);
  }
  else if (x === treasure.x && y === treasure.y) {
    // Found the Treasure
    if (gamePhase === 4 && foundItems.shipwreck) {
      // Win condition
      setGameStatus('won');
      const finalScore = newScore + (newExplorationsLeft * 100); // Bonus for remaining explorations
      setScore(finalScore);
      setMessage(`Congratulations! You found the Treasure with ${newExplorationsLeft} explorations remaining! Final Score: ${finalScore}`);
    } else {
      // Found treasure too early
      setMessage("You found something shiny, but without the Shipwreck's Scroll, you don't recognize its value. Keep exploring!");
    }
  }
  else {
    // Empty cell, just show arrow pointing to map if in phase 1
    if (gamePhase === 1 && !foundItems.map) {
      setMessage(`No clues here. The directional arrow might help guide your search.`);
    }
  }
  
  return { newExplorationsLeft, newScore, newBoard };
};