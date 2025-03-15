// src/components/GridLock/GridLock.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './GridLock.css';

// Word dictionaries for different word lengths
const wordDictionaries = {
  3: ['cat', 'dog', 'rat', 'bat', 'hat', 'mat', 'sat', 'pat', 'tap', 'top', 'mop', 'hop', 'pop', 'lot', 'dot', 'hot', 'pot', 'got', 'jot', 'rot', 'fog', 'log', 'bog', 'cog', 'jog', 'bag', 'rag', 'tag', 'wag', 'big', 'dig', 'fig', 'pig', 'wig', 'bun', 'fun', 'gun', 'run', 'sun', 'pun', 'gem', 'hem', 'rim', 'dim', 'him', 'den', 'hen', 'men', 'pen', 'ten', 'fan', 'man', 'pan', 'ran', 'tan', 'van', 'cab', 'dab', 'jab', 'lab', 'tab', 'bib', 'fib', 'rib', 'bob', 'cob', 'fob', 'job', 'mob', 'rob', 'sob', 'rub', 'tub', 'cub', 'hub', 'pub', 'sub'],
  
  4: ['cake', 'take', 'make', 'lake', 'rake', 'sake', 'wake', 'bake', 'fake', 'game', 'fame', 'lame', 'name', 'same', 'tame', 'best', 'nest', 'pest', 'rest', 'test', 'vest', 'west', 'zest', 'cool', 'fool', 'pool', 'tool', 'cast', 'fast', 'last', 'mast', 'past', 'vast', 'card', 'hard', 'lard', 'ward', 'yard', 'bark', 'dark', 'lark', 'mark', 'park', 'cold', 'bold', 'fold', 'gold', 'hold', 'mold', 'sold', 'told', 'band', 'hand', 'land', 'sand', 'bend', 'lend', 'mend', 'send', 'tend', 'bird', 'firm', 'girl', 'dirt', 'time', 'lime', 'mime', 'dime', 'star', 'scar', 'fear', 'dear', 'tear', 'bear', 'pear', 'gear', 'hear', 'year', 'ring', 'king', 'sing', 'wing'],
  
  5: ['plane', 'flame', 'blame', 'frame', 'shame', 'space', 'trace', 'grace', 'place', 'brace', 'store', 'shore', 'chore', 'snore', 'score', 'scent', 'spent', 'meant', 'plant', 'grant', 'slant', 'craft', 'draft', 'shaft', 'smart', 'start', 'chart', 'spark', 'stark', 'shark', 'shape', 'grape', 'drape', 'scrape', 'stare', 'scare', 'spare', 'share', 'flare', 'blare', 'glare', 'house', 'mouse', 'blouse', 'grind', 'blind', 'minds', 'winds', 'finds', 'binds', 'shine', 'whine', 'spine', 'twine', 'swine', 'dines', 'lines', 'pines', 'vines', 'mines', 'speak', 'freak', 'bleak', 'sneak', 'steak', 'break', 'creak', 'dream', 'cream', 'steam', 'gleam', 'seams', 'teams', 'beams', 'reams'],
  
  6: ['planet', 'market', 'basket', 'pocket', 'socket', 'flower', 'shower', 'slower', 'towers', 'powers', 'carpet', 'forget', 'target', 'carrot', 'pencil', 'happen', 'hidden', 'kitten', 'golden', 'frozen', 'listen', 'spoken', 'broken', 'chosen', 'woven', 'action', 'nation', 'lotion', 'potion', 'motion', 'option', 'station', 'caution', 'faction', 'mention', 'dragon', 'carbon', 'ribbon', 'cotton', 'button', 'common', 'cannon', 'season', 'reason', 'treason', 'lesson', 'blossom', 'tender', 'vendor', 'border', 'murder', 'powder', 'wonder', 'louder', 'holder', 'folder', 'summer', 'dinner', 'winner', 'copper', 'hopper', 'proper', 'supper', 'matter', 'batter', 'letter', 'better', 'setter', 'bitter', 'litter', 'sitter'],
  
  7: ['amazing', 'blazing', 'camping', 'dancing', 'farming', 'gossips', 'housing', 'jogging', 'kingdom', 'laughing', 'mansion', 'napping', 'packing', 'quaking', 'rocking', 'sailing', 'talking', 'vampire', 'walking', 'yoghurt', 'zipping', 'animals', 'between', 'complex', 'diamond', 'evolves', 'fantasy', 'general', 'harvest', 'inspire', 'journey', 'knights', 'limited', 'monster', 'network', 'organic', 'package', 'qualify', 'railway', 'supreme', 'texture', 'upgrade', 'various', 'website', 'youthful', 'zephyrs']
};

const GridLock = () => {
  // Game state
  const [difficulty, setDifficulty] = useState(3); // 3, 4, or 5 rows
  const [grid, setGrid] = useState([]);           // Player's grid with inputs
  const [originalGrid, setOriginalGrid] = useState([]); // Solution grid
  
  // Letter values: single source of truth
  const [letterValues, setLetterValues] = useState({});
  
  // Letters to display in the UI, organized by value
  const [letterValueGroups, setLetterValueGroups] = useState({
    0: [], 1: [], 2: [], 3: [], 4: []
  });
  
  // Game progress
  const [rowSums, setRowSums] = useState([]);
  const [colSums, setColSums] = useState([]);
  const [rowMatches, setRowMatches] = useState([]);
  const [colMatches, setColMatches] = useState([]);
  const [attempts, setAttempts] = useState(0);
  
  // Game state flags
  const [gameWon, setGameWon] = useState(false);
  const [solutionRevealed, setSolutionRevealed] = useState(false);
  const [invalidLetter, setInvalidLetter] = useState('');
  
  // Track remaining letters
  const [remainingLetters, setRemainingLetters] = useState(0);
  
  // Refs for keyboard navigation
  const cellRefs = useRef([]);
  
  // Load custom font
  useEffect(() => {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    
    return () => {
      if (document.head.contains(fontLink)) {
        document.head.removeChild(fontLink);
      }
    };
  }, []);
  
  // Find words that start with a specific letter
  const findWordsStartingWith = (letter, wordLength) => {
    return (wordDictionaries[wordLength] || []).filter(word => 
      word.charAt(0) === letter.toLowerCase()
    );
  };
  
  // Generate random letter for first column
  const getRandomLetter = () => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    return letters.charAt(Math.floor(Math.random() * letters.length));
  };
  
  // Generate the game grid with random first letters
  const generateGameGrid = (rows) => {
    // Create the grid
    const grid = Array(rows).fill().map(() => Array(7).fill('')); // Support up to 7-letter words
    
    // For each row, fill the first column with a random letter
    for (let i = 0; i < rows; i++) {
      // Generate a random letter for the first column
      let firstLetter = getRandomLetter();
      
      // Check if there are valid words that start with this letter in any length
      let hasValidWords = false;
      for (let wordLength = 3; wordLength <= (rows >= 5 ? 7 : 6); wordLength++) {
        if (findWordsStartingWith(firstLetter, wordLength).length > 0) {
          hasValidWords = true;
          break;
        }
      }
      
      // If no valid words found for this letter, try again
      if (!hasValidWords) {
        let attempts = 0;
        while (!hasValidWords && attempts < 26) { // Try all letters if needed
          firstLetter = getRandomLetter();
          for (let wordLength = 3; wordLength <= (rows >= 5 ? 7 : 6); wordLength++) {
            if (findWordsStartingWith(firstLetter, wordLength).length > 0) {
              hasValidWords = true;
              break;
            }
          }
          attempts++;
        }
      }
      
      grid[i][0] = firstLetter;
      
      // Choose a valid word that starts with the first letter
      // Randomly choose a word length between 3 and 6/7 (depending on difficulty)
      const maxWordLength = rows >= 5 ? 7 : 6;
      const wordLength = Math.floor(Math.random() * (maxWordLength - 2)) + 3; // 3 to 6/7
      
      // Find words starting with the first letter
      const possibleWords = findWordsStartingWith(firstLetter, wordLength);
      
      // If no words found, try a different length
      if (possibleWords.length === 0) {
        // Try all lengths from 3 to max length
        for (let len = 3; len <= maxWordLength; len++) {
          const otherWords = findWordsStartingWith(firstLetter, len);
          if (otherWords.length > 0) {
            const randomWord = otherWords[Math.floor(Math.random() * otherWords.length)];
            // Fill the row with this word
            for (let j = 0; j < randomWord.length; j++) {
              grid[i][j] = randomWord[j];
            }
            break;
          }
        }
      } else {
        // Choose a random word
        const randomWord = possibleWords[Math.floor(Math.random() * possibleWords.length)];
        // Fill the row with this word
        for (let j = 0; j < randomWord.length; j++) {
          grid[i][j] = randomWord[j];
        }
      }
    }
    
    return grid;
  };
  
  // Assign values to letters and create groups
  const assignLetterValues = (grid) => {
    // Get all unique letters in the grid
    const usedLetters = new Set();
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (grid[i][j]) {
          usedLetters.add(grid[i][j]);
        }
      }
    }
    
    // Create values object
    const values = {};
    
    // Assign values 0-4 to used letters
    const usedLettersArray = Array.from(usedLetters);
    for (let i = 0; i < usedLettersArray.length; i++) {
      values[usedLettersArray[i]] = Math.floor(Math.random() * 5); // 0-4
    }
    
    // Create groups for display
    const groups = { 0: [], 1: [], 2: [], 3: [], 4: [] };
    
    // Add used letters to groups
    usedLettersArray.forEach(letter => {
      groups[values[letter]].push(letter);
    });
    
    // Add unused letters to ensure each group has at least 2 letters
    const unusedLetters = [];
    'abcdefghijklmnopqrstuvwxyz'.split('').forEach(letter => {
      if (!usedLetters.has(letter)) {
        unusedLetters.push(letter);
        // Assign a value to this unused letter too
        values[letter] = Math.floor(Math.random() * 5);
      }
    });
    
    // Shuffle unused letters
    for (let i = unusedLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unusedLetters[i], unusedLetters[j]] = [unusedLetters[j], unusedLetters[i]];
    }
    
    // Ensure each group has at least 2 letters
    for (let value = 0; value <= 4; value++) {
      while (groups[value].length < 2 && unusedLetters.length > 0) {
        const letter = unusedLetters.pop();
        // Reassign value to this letter
        values[letter] = value;
        groups[value].push(letter);
      }
    }
    
    // Sort groups alphabetically
    Object.keys(groups).forEach(key => {
      groups[key].sort();
    });
    
    return { values, groups };
  };
  
  // Calculate sums for rows and columns
  const calculateSums = (grid, values) => {
    // Calculate row sums
    const rowSums = grid.map(row => {
      return row.reduce((sum, letter) => sum + (letter ? values[letter] || 0 : 0), 0);
    });
    
    // Calculate column sums
    const colSums = [];
    const maxCols = Math.max(...grid.map(row => row.length));
    
    for (let j = 0; j < maxCols; j++) {
      let sum = 0;
      for (let i = 0; i < grid.length; i++) {
        if (grid[i][j]) {
          sum += values[grid[i][j]] || 0;
        }
      }
      colSums.push(sum);
    }
    
    return { rowSums, colSums };
  };
  
  // Reveal random cells at start (3 random cells)
  const getRandomRevealedCells = (grid, numCells = 3) => {
    const availableCells = [];
    
    // Find all cells that aren't in the first column and have a letter
    for (let i = 0; i < grid.length; i++) {
      for (let j = 1; j < grid[i].length; j++) { // Skip first column (already revealed)
        if (grid[i][j]) {
          availableCells.push({ row: i, col: j });
        }
      }
    }
    
    // Shuffle the available cells
    for (let i = availableCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableCells[i], availableCells[j]] = [availableCells[j], availableCells[i]];
    }
    
    // Take the first numCells cells
    return availableCells.slice(0, Math.min(numCells, availableCells.length));
  };
  
  // Calculate number of remaining letters to be filled
  const calculateRemainingLetters = (grid) => {
    let total = 0;
    let filled = 0;
    
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (originalGrid[i] && originalGrid[i][j]) { // This is a valid cell in the solution
          total++;
          if (grid[i][j] && grid[i][j].letter) { // This cell has a letter in the player's grid
            filled++;
          }
        }
      }
    }
    
    return total - filled;
  };
  
  // Create a new game
  const generateNewGame = (rows) => {
    const difficultyLevel = rows || difficulty;
    
    // Generate the game grid
    const gameGrid = generateGameGrid(difficultyLevel);
    setOriginalGrid(gameGrid);
    
    // Assign letter values and create groups
    const { values, groups } = assignLetterValues(gameGrid);
    setLetterValues(values);
    setLetterValueGroups(groups);
    
    // Calculate sums
    const { rowSums, colSums } = calculateSums(gameGrid, values);
    setRowSums(rowSums);
    setColSums(colSums);
    
    // Get 3 random cells to reveal
    const randomCells = getRandomRevealedCells(gameGrid, 3);
    
    // Create player grid with first column and random cells revealed
    const playerGrid = gameGrid.map((row, i) => {
      return row.map((letter, j) => {
        // Check if this cell is the first column or one of the random cells
        const isRandomRevealed = randomCells.some(cell => cell.row === i && cell.col === j);
        
        return {
          letter: (j === 0 || isRandomRevealed) ? letter : '', // Reveal first column and random cells
          revealed: (j === 0 || isRandomRevealed)              // Mark them as revealed
        };
      });
    });
    
    // Reset game state
    setGrid(playerGrid);
    setGameWon(false);
    setSolutionRevealed(false);
    setAttempts(0);
    setRowMatches(Array(difficultyLevel).fill(false));
    setColMatches(Array(Math.max(...gameGrid.map(row => row.length))).fill(false));
    setInvalidLetter('');
    
    // Initialize cell refs for keyboard navigation
    cellRefs.current = Array(difficultyLevel).fill().map(() => Array(7).fill(null));
  };
  
  // Start a new game
  const newGame = () => {
    generateNewGame(difficulty);
  };
  
  // Reset current grid (keep the same puzzle)
  const resetGrid = () => {
    if (gameWon || solutionRevealed) return;
    
    // Create a new player grid based on the original grid, but only reveal the first column and previously revealed cells
    const newGrid = grid.map((row, i) => {
      return row.map((cell, j) => {
        if (!cell) return null; // Keep null cells as null
        
        return {
          letter: cell.revealed ? cell.letter : '', // Keep revealed cells' letters, clear others
          revealed: cell.revealed // Keep revealed status
        };
      });
    });
    
    setGrid(newGrid);
    setAttempts(attempts + 1); // Count as an attempt
  };
  
  // Calculate if row totals match expected values
  const calculateRowMatches = () => {
    return rowSums.map((expectedSum, rowIndex) => {
      const currentSum = grid[rowIndex].reduce((sum, cell) => {
        return sum + (cell && cell.letter ? letterValues[cell.letter] || 0 : 0);
      }, 0);
      return currentSum === expectedSum;
    });
  };
  
  // Calculate if column totals match expected values
  const calculateColumnMatches = () => {
    return colSums.map((expectedSum, colIndex) => {
      let currentSum = 0;
      for (let i = 0; i < grid.length; i++) {
        if (grid[i][colIndex] && grid[i][colIndex].letter) {
          currentSum += letterValues[grid[i][colIndex].letter] || 0;
        }
      }
      return currentSum === expectedSum;
    });
  };
  
  // Move focus to the next cell based on direction
  const moveFocus = (rowIndex, colIndex, direction) => {
    let nextRow = rowIndex;
    let nextCol = colIndex;
    
    switch(direction) {
      case 'ArrowRight':
        // Find the next valid cell to the right
        nextCol++;
        while (nextCol < 7 && (!grid[rowIndex][nextCol] || grid[rowIndex][nextCol].revealed || !originalGrid[rowIndex][nextCol])) {
          nextCol++;
        }
        // If we went out of bounds or hit a revealed/invalid cell, stay where we are
        if (nextCol >= 7 || !grid[rowIndex][nextCol] || grid[rowIndex][nextCol].revealed || !originalGrid[rowIndex][nextCol]) {
          nextCol = colIndex;
        }
        break;
      case 'ArrowLeft':
        // Find the next valid cell to the left
        nextCol--;
        while (nextCol >= 0 && (!grid[rowIndex][nextCol] || grid[rowIndex][nextCol].revealed || !originalGrid[rowIndex][nextCol])) {
          nextCol--;
        }
        // If we went out of bounds or hit a revealed/invalid cell, stay where we are
        if (nextCol < 0 || !grid[rowIndex][nextCol] || grid[rowIndex][nextCol].revealed || !originalGrid[rowIndex][nextCol]) {
          nextCol = colIndex;
        }
        break;
      case 'ArrowUp':
        // Find the next valid cell above
        nextRow--;
        while (nextRow >= 0 && (!grid[nextRow][colIndex] || grid[nextRow][colIndex].revealed || !originalGrid[nextRow][colIndex])) {
          nextRow--;
        }
        // If we went out of bounds or hit a revealed/invalid cell, stay where we are
        if (nextRow < 0 || !grid[nextRow][colIndex] || grid[nextRow][colIndex].revealed || !originalGrid[nextRow][colIndex]) {
          nextRow = rowIndex;
        }
        break;
      case 'ArrowDown':
        // Find the next valid cell below
        nextRow++;
        while (nextRow < grid.length && (!grid[nextRow][colIndex] || grid[nextRow][colIndex].revealed || !originalGrid[nextRow][colIndex])) {
          nextRow++;
        }
        // If we went out of bounds or hit a revealed/invalid cell, stay where we are
        if (nextRow >= grid.length || !grid[nextRow][colIndex] || grid[nextRow][colIndex].revealed || !originalGrid[nextRow][colIndex]) {
          nextRow = rowIndex;
        }
        break;
      case 'Backspace':
        // First clear current cell if not already empty
        const currentCell = grid[rowIndex][colIndex];
        if (currentCell && currentCell.letter && !currentCell.revealed) {
          handleCellChange(rowIndex, colIndex, '');
        }
        
        // Then move focus to previous cell (left)
        nextCol--;
        while (nextCol >= 0 && (!grid[rowIndex][nextCol] || grid[rowIndex][nextCol].revealed || !originalGrid[rowIndex][nextCol])) {
          nextCol--;
        }
        // If we went out of bounds or hit a revealed/invalid cell, stay where we are
        if (nextCol < 0 || !grid[rowIndex][nextCol] || grid[rowIndex][nextCol].revealed || !originalGrid[rowIndex][nextCol]) {
          nextCol = colIndex;
        }
        break;
      default:
        // For letter inputs, after setting the letter, move to next cell to the right
        nextCol++;
        while (nextCol < 7 && (!grid[rowIndex][nextCol] || grid[rowIndex][nextCol].revealed || !originalGrid[rowIndex][nextCol])) {
          nextCol++;
        }
        // If we went out of bounds or hit a revealed/invalid cell, stay where we are
        if (nextCol >= 7 || !grid[rowIndex][nextCol] || grid[rowIndex][nextCol].revealed || !originalGrid[rowIndex][nextCol]) {
          nextCol = colIndex;
        }
        break;
    }
    
    // Focus the next cell if it's different from the current one
    if ((nextRow !== rowIndex || nextCol !== colIndex) && cellRefs.current[nextRow] && cellRefs.current[nextRow][nextCol]) {
      cellRefs.current[nextRow][nextCol].focus();
    }
  };
  
  // Handle cell input change
  const handleCellChange = (rowIndex, colIndex, value) => {
    if (colIndex === 0 || !grid[rowIndex][colIndex] || grid[rowIndex][colIndex].revealed || gameWon || solutionRevealed) return;
    
    const inputLetter = value.toLowerCase();
    
    // Check if inputLetter is a valid letter
    const validLetters = Object.values(letterValueGroups).flat();
    if (inputLetter && !validLetters.includes(inputLetter)) {
      setInvalidLetter(inputLetter);
      setTimeout(() => setInvalidLetter(''), 1500); // Clear after 1.5 seconds
      return;
    }
    
    // Update grid with new value
    const newGrid = [...grid];
    newGrid[rowIndex][colIndex] = { 
      ...newGrid[rowIndex][colIndex], 
      letter: inputLetter 
    };
    setGrid(newGrid);
    
    // Only increment attempts for new inputs, not deletions
    if (inputLetter) {
      setAttempts(prev => prev + 1);
    }
    
    setInvalidLetter('');
  };
  
  // Handle keyboard navigation and input
  const handleKeyDown = (event, rowIndex, colIndex) => {
    if (gameWon || solutionRevealed) return;
    
    const { key } = event;
    
    // If it's an arrow key, prevent default behavior and move focus
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      event.preventDefault();
      moveFocus(rowIndex, colIndex, key);
    } 
    // If it's a letter key, let the input handle it but move focus after
    else if (/^[a-zA-Z]$/.test(key) && key.length === 1) {
      // The input change will be handled separately
      // After the input is handled, we'll move focus to the next cell
      setTimeout(() => {
        moveFocus(rowIndex, colIndex, 'letter');
      }, 10);
    }
    // For backspace, handle special delete and move logic
    else if (key === 'Backspace') {
      // If the cell is already empty, move to previous cell
      if (!grid[rowIndex][colIndex].letter) {
        event.preventDefault();
        moveFocus(rowIndex, colIndex, 'Backspace');
      }
    }
  };
  
  // Handle difficulty change
  const handleDifficultyChange = (e) => {
    const newDifficulty = parseInt(e.target.value);
    setDifficulty(newDifficulty);
    generateNewGame(newDifficulty);
  };
  
  // Take a hint - reveal a random unrevealed cell
  const takeHint = () => {
    if (gameWon || solutionRevealed) return;
    
    // Find all unrevealed cells that have a value in the original grid
    const unrevealedCells = [];
    
    for (let i = 0; i < grid.length; i++) {
      for (let j = 1; j < grid[i].length; j++) { // Skip first column (already revealed)
        if (grid[i][j] && !grid[i][j].revealed && originalGrid[i][j]) {
          unrevealedCells.push({ rowIndex: i, colIndex: j });
        }
      }
    }
    
    // If there are any unrevealed cells, reveal one randomly
    if (unrevealedCells.length > 0) {
      const randomIndex = Math.floor(Math.random() * unrevealedCells.length);
      const { rowIndex, colIndex } = unrevealedCells[randomIndex];
      
      const newGrid = [...grid];
      newGrid[rowIndex][colIndex] = { 
        letter: originalGrid[rowIndex][colIndex], 
        revealed: true 
      };
      
      setGrid(newGrid);
      setAttempts(prev => prev + 2); // Add 2 to attempts as penalty
    }
  };
  
  // Reveal the solution
  const revealSolution = () => {
    // Use the existing grid structure but fill in all the letters from originalGrid
    const solutionGrid = grid.map((row, i) => {
      return row.map((cell, j) => {
        if (!cell) return null; // Keep null cells as null
        
        // If cell exists in the grid, just fill in the correct letter from originalGrid
        if (originalGrid[i] && originalGrid[i][j]) {
          return {
            ...cell, // Keep all other properties
            letter: originalGrid[i][j] // Update the letter from solution
          };
        }
        return cell; // Keep as is if there's no matching letter in originalGrid
      });
    });
    
    setGrid(solutionGrid);
    setSolutionRevealed(true);
  };
  
  // Initialize game
  useEffect(() => {
    generateNewGame(difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Update remaining letters whenever grid changes
  useEffect(() => {
    if (!grid.length || !originalGrid.length) return;
    
    const remaining = calculateRemainingLetters(grid);
    setRemainingLetters(remaining);
    
    // Check win condition
    const newRowMatches = calculateRowMatches();
    const newColMatches = calculateColumnMatches();
    
    setRowMatches(newRowMatches);
    setColMatches(newColMatches);
    
    // Check if all rows and columns match
    const allRowsMatch = newRowMatches.every(match => match);
    const allColsMatch = newColMatches.every(match => match);
    
    // Check if all non-empty cells are filled
    let allCellsFilled = remaining === 0;
    
    if (allRowsMatch && allColsMatch && allCellsFilled && !solutionRevealed) {
      setGameWon(true);
    }
  }, [grid, originalGrid, solutionRevealed]);

  // Get maximum columns in the grid
  const maxColumns = Math.max(...(originalGrid.map(row => row.filter(cell => cell).length) || [0]));

  return (
    <div className="grid-lock-container">
      <div className="grid-lock-header">
        <div className="header-left">
          <h1 className="game-title">GRID LOCK</h1>
          <div className="attempts-counter">
            <span>Attempts: {attempts}</span>
          </div>
        </div>
        <div className="header-controls">
          <div className="difficulty-selector">
            <select 
              id="difficulty" 
              value={difficulty} 
              onChange={handleDifficultyChange}
              disabled={gameWon || solutionRevealed}
            >
              <option value="3">Easy (3 rows)</option>
              <option value="4">Medium (4 rows)</option>
              <option value="5">Hard (5 rows)</option>
            </select>
          </div>
          
          <button className="hint-button" onClick={takeHint} disabled={gameWon || solutionRevealed}>
            HINT (+2)
          </button>
          
          <button className="solution-button" onClick={revealSolution} disabled={gameWon || solutionRevealed}>
            SOLUTION
          </button>
          
          <button className="game-button" onClick={newGame}>
            NEW GAME
          </button>
          
          <Link to="/" className="back-link">
            ←
          </Link>
        </div>
      </div>
      
      {invalidLetter && (
        <div className="invalid-letter-message">
          <span>Letter "{invalidLetter.toUpperCase()}" is not available in this puzzle!</span>
        </div>
      )}
      
      <div className="game-area">
        <div className="game-panel">
          <div className="letter-values">
            <h3>LETTER VALUES</h3>
            <div className="letter-values-grid">
              {Object.entries(letterValueGroups).map(([value, letters]) => (
                <div key={value} className="letter-value-row">
                  <div className="value-cell">{value}</div>
                  <div className="letters-cells">
                    {letters.map(letter => (
                      <div key={letter} className="letter-cell">{letter}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="remaining-letters">
            <h3>REMAINING</h3>
            <div className="remaining-count">{remainingLetters}</div>
          </div>
        </div>
        
        <div className="grid-area">
          <div className="grid-header">
            <button className="reset-button" onClick={resetGrid} disabled={gameWon || solutionRevealed}>
              ↻ Reset
            </button>
          </div>
          <div className="grid-container">
            <div className="grid">
              {/* Column sums at the top */}
              <div className="col-sums">
                <div className="empty-cell"></div>
                {colSums.slice(0, maxColumns).map((sum, index) => (
                  <div 
                    key={index} 
                    className={`col-sum ${colMatches[index] ? 'matched' : 'unmatched'}`}
                  >
                    {sum}
                  </div>
                ))}
              </div>
              
              {/* Grid rows with row sums */}
              {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="grid-row">
                  {/* Row sum on the left */}
                  <div 
                    className={`row-sum ${rowMatches[rowIndex] ? 'matched' : 'unmatched'}`}
                  >
                    {rowSums[rowIndex]}
                  </div>
                  
                  {/* Grid cells */}
                  {row.map((cell, colIndex) => {
                    // Skip rendering empty cells
                    if (!cell) return null;
                    
                    // Only render filled cells
                    return (
                      <div 
                        key={colIndex} 
                        className={`grid-cell 
                          ${cell.revealed ? 'revealed' : ''} 
                          ${solutionRevealed ? 'solution' : ''} 
                          ${colIndex === 0 ? 'first-column' : ''}`}
                      >
                        <input
                          type="text"
                          maxLength="1"
                          value={cell.letter}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                          disabled={colIndex === 0 || cell.revealed || gameWon || solutionRevealed}
                          className={colIndex === 0 || cell.revealed || solutionRevealed ? 'revealed-input' : ''}
                          ref={el => {
                            if (cellRefs.current[rowIndex]) {
                              cellRefs.current[rowIndex][colIndex] = el;
                            }
                          }}
                        />
                        {cell.letter && (
                          <span className="letter-value-indicator">
                            {letterValues[cell.letter] !== undefined 
                              ? letterValues[cell.letter] 
                              : '?'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {gameWon && (
        <div className="win-message">
          <h2>PUZZLE SOLVED</h2>
          <p>Completed in {attempts} attempts</p>
          <button className="game-button" onClick={newGame}>PLAY AGAIN</button>
        </div>
      )}
      
      {solutionRevealed && !gameWon && (
        <div className="solution-message">
          <h2>SOLUTION REVEALED</h2>
          <p>Better luck next time!</p>
          <button className="game-button" onClick={newGame}>PLAY AGAIN</button>
        </div>
      )}
      
      <div className="game-instructions">
        <h3>HOW TO PLAY</h3>
        <ul>
          <li>Complete the grid with letters to form valid words in each row</li>
          <li>The first column letter is already provided for each row</li>
          <li>Each row starts with the letter in the first column</li>
          <li>The sum of each row and column must match the numbers shown</li>
          <li>Each letter has a numerical value (0-4) shown in the table</li>
          <li>3 letters are revealed to help you get started</li>
          <li>Use arrow keys to navigate the grid</li>
          <li>Check the remaining letters counter to track your progress</li>
          <li>Need help? Use the HINT button to reveal a letter (adds 2 to your attempts)</li>
        </ul>
      </div>
    </div>
  );
};

export default GridLock;