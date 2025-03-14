// src/components/GridLock/GridLock.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './GridLock.css';

// Word dictionaries for different word lengths
const wordDictionaries = {
  3: ['cat', 'dog', 'rat', 'bat', 'hat', 'mat', 'sat', 'pat', 'tap', 'top', 'mop', 'hop', 'pop', 'lot', 'dot', 'hot', 'pot', 'got', 'jot', 'rot', 'fog', 'log', 'bog', 'cog', 'jog', 'bag', 'rag', 'tag', 'wag', 'big', 'dig', 'fig', 'pig', 'wig', 'bun', 'fun', 'gun', 'run', 'sun', 'pun', 'gem', 'hem', 'rim', 'dim', 'him', 'den', 'hen', 'men', 'pen', 'ten', 'fan', 'man', 'pan', 'ran', 'tan', 'van', 'cab', 'dab', 'jab', 'lab', 'tab', 'bib', 'fib', 'rib', 'bob', 'cob', 'fob', 'job', 'mob', 'rob', 'sob', 'rub', 'tub', 'cub', 'hub', 'pub', 'sub'],
  
  4: ['cake', 'take', 'make', 'lake', 'rake', 'sake', 'wake', 'bake', 'fake', 'game', 'fame', 'lame', 'name', 'same', 'tame', 'best', 'nest', 'pest', 'rest', 'test', 'vest', 'west', 'zest', 'cool', 'fool', 'pool', 'tool', 'cast', 'fast', 'last', 'mast', 'past', 'vast', 'card', 'hard', 'lard', 'ward', 'yard', 'bark', 'dark', 'lark', 'mark', 'park', 'cold', 'bold', 'fold', 'gold', 'hold', 'mold', 'sold', 'told', 'band', 'hand', 'land', 'sand', 'bend', 'lend', 'mend', 'send', 'tend', 'bird', 'firm', 'girl', 'dirt', 'time', 'lime', 'mime', 'dime', 'star', 'scar', 'fear', 'dear', 'tear', 'bear', 'pear', 'gear', 'hear', 'year', 'ring', 'king', 'sing', 'wing'],
  
  5: ['plane', 'flame', 'blame', 'frame', 'shame', 'space', 'trace', 'grace', 'place', 'brace', 'store', 'shore', 'chore', 'snore', 'score', 'scent', 'spent', 'meant', 'plant', 'grant', 'slant', 'craft', 'draft', 'shaft', 'smart', 'start', 'chart', 'spark', 'stark', 'shark', 'shape', 'grape', 'drape', 'scrape', 'stare', 'scare', 'spare', 'share', 'flare', 'blare', 'glare', 'house', 'mouse', 'blouse', 'grind', 'blind', 'minds', 'winds', 'finds', 'binds', 'shine', 'whine', 'spine', 'twine', 'swine', 'dines', 'lines', 'pines', 'vines', 'mines', 'speak', 'freak', 'bleak', 'sneak', 'steak', 'break', 'creak', 'dream', 'cream', 'steam', 'gleam', 'seams', 'teams', 'beams', 'reams'],
  
  6: ['planet', 'market', 'basket', 'pocket', 'socket', 'flower', 'shower', 'slower', 'towers', 'powers', 'carpet', 'forget', 'target', 'carrot', 'pencil', 'happen', 'hidden', 'kitten', 'golden', 'frozen', 'listen', 'spoken', 'broken', 'chosen', 'woven', 'action', 'nation', 'lotion', 'potion', 'motion', 'option', 'station', 'caution', 'faction', 'mention', 'dragon', 'carbon', 'ribbon', 'cotton', 'button', 'common', 'cannon', 'season', 'reason', 'treason', 'lesson', 'blossom', 'tender', 'vendor', 'border', 'murder', 'powder', 'wonder', 'louder', 'holder', 'folder', 'summer', 'dinner', 'winner', 'copper', 'hopper', 'proper', 'supper', 'matter', 'batter', 'letter', 'better', 'setter', 'bitter', 'litter', 'sitter']
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
  
  // Generate the game grid with the first column as a valid word
  const generateGameGrid = (rows) => {
    // Step 1: Choose a random word for the first column
    const firstColumnLetters = [];
    
    // Select letters for the first column - this will be our vertical word
    const allPossibleLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    
    // Shuffle the letters
    for (let i = allPossibleLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allPossibleLetters[i], allPossibleLetters[j]] = [allPossibleLetters[j], allPossibleLetters[i]];
    }
    
    // Pick first 'rows' letters that have at least one word starting with them
    for (let letter of allPossibleLetters) {
      // Find if there are words starting with this letter
      let hasWords = false;
      for (let wordLength = 3; wordLength <= 6; wordLength++) {
        if (findWordsStartingWith(letter, wordLength).length > 0) {
          hasWords = true;
          break;
        }
      }
      
      if (hasWords) {
        firstColumnLetters.push(letter);
        if (firstColumnLetters.length === rows) break;
      }
    }
    
    // Create the grid
    const grid = Array(rows).fill().map(() => Array(6).fill(''));
    
    // Fill the first column
    for (let i = 0; i < rows; i++) {
      grid[i][0] = firstColumnLetters[i];
    }
    
    // Step 2: For each row, choose a valid word that starts with the first column letter
    for (let i = 0; i < rows; i++) {
      const firstLetter = grid[i][0];
      
      // Randomly choose a word length between 3 and 6
      const wordLength = Math.floor(Math.random() * 4) + 3; // 3 to 6
      
      // Find words starting with the first letter
      const possibleWords = findWordsStartingWith(firstLetter, wordLength);
      
      // If no words found, try a different length
      if (possibleWords.length === 0) {
        // Try all lengths
        for (let len = 3; len <= 6; len++) {
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
    
    // Create player grid with only first column revealed
    const playerGrid = gameGrid.map(row => {
      return row.map((letter, colIndex) => {
        return {
          letter: colIndex === 0 ? letter : '', // Reveal only the first column
          revealed: colIndex === 0             // Mark first column as revealed
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
  };
  
  // Calculate if row totals match expected values
  const calculateRowMatches = () => {
    return rowSums.map((expectedSum, rowIndex) => {
      const currentSum = grid[rowIndex].reduce((sum, cell) => {
        return sum + (cell.letter ? letterValues[cell.letter] || 0 : 0);
      }, 0);
      return currentSum === expectedSum;
    });
  };
  
  // Calculate if column totals match expected values
  const calculateColumnMatches = () => {
    return colSums.map((expectedSum, colIndex) => {
      let currentSum = 0;
      for (let i = 0; i < grid.length; i++) {
        if (grid[i][colIndex]) {
          currentSum += grid[i][colIndex].letter ? letterValues[grid[i][colIndex].letter] || 0 : 0;
        }
      }
      return currentSum === expectedSum;
    });
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
    setAttempts(prev => prev + 1);
    setInvalidLetter('');
  };
  
  // Restart the game
  const restartGame = () => {
    generateNewGame(difficulty);
  };
  
  // Change difficulty level
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
        if (grid[i][j] && !grid[i][j].revealed && !grid[i][j].letter && originalGrid[i][j]) {
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
    const solutionGrid = [];
    
    for (let i = 0; i < originalGrid.length; i++) {
      const row = [];
      for (let j = 0; j < originalGrid[i].length; j++) {
        if (originalGrid[i][j]) {
          row.push({
            letter: originalGrid[i][j],
            revealed: j === 0  // Only first column is "revealed"
          });
        } else {
          row.push(null); // Empty cell
        }
      }
      solutionGrid.push(row);
    }
    
    setGrid(solutionGrid);
    setSolutionRevealed(true);
  };
  
  // Initialize game
  useEffect(() => {
    generateNewGame(difficulty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Check win condition whenever grid changes
  useEffect(() => {
    if (!grid.length) return;
    
    const newRowMatches = calculateRowMatches();
    const newColMatches = calculateColumnMatches();
    
    setRowMatches(newRowMatches);
    setColMatches(newColMatches);
    
    // Check if all rows and columns match
    const allRowsMatch = newRowMatches.every(match => match);
    const allColsMatch = newColMatches.every(match => match);
    
    // Check if all non-empty cells are filled
    let allCellsFilled = true;
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (grid[i][j] && !grid[i][j].letter && originalGrid[i][j]) {
          allCellsFilled = false;
          break;
        }
      }
      if (!allCellsFilled) break;
    }
    
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
          
          <button className="game-button" onClick={restartGame}>
            {gameWon || solutionRevealed ? 'NEW GAME' : 'RESTART'}
          </button>
          
          <Link to="/" className="back-button">BACK</Link>
        </div>
      </div>
      
      {invalidLetter && (
        <div className="invalid-letter-message">
          <span>Letter "{invalidLetter.toUpperCase()}" is not available in this puzzle!</span>
        </div>
      )}
      
      <div className="game-area">
        <div className="grid-area">
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
                        className={`grid-cell ${cell.revealed ? 'revealed' : ''} ${solutionRevealed ? 'solution' : ''} ${colIndex === 0 ? 'first-column' : ''}`}
                      >
                        <input
                          type="text"
                          maxLength="1"
                          value={cell.letter}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                          disabled={colIndex === 0 || cell.revealed || gameWon || solutionRevealed}
                          className={colIndex === 0 || cell.revealed ? 'revealed-input' : ''}
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
      </div>
      
      {gameWon && (
        <div className="win-message">
          <h2>PUZZLE SOLVED</h2>
          <p>Completed in {attempts} attempts</p>
          <button className="game-button" onClick={restartGame}>PLAY AGAIN</button>
        </div>
      )}
      
      {solutionRevealed && !gameWon && (
        <div className="solution-message">
          <h2>SOLUTION REVEALED</h2>
          <p>Better luck next time!</p>
          <button className="game-button" onClick={restartGame}>PLAY AGAIN</button>
        </div>
      )}
      
      <div className="game-instructions">
        <h3>HOW TO PLAY</h3>
        <ul>
          <li>Complete the grid with letters to form valid words in each row</li>
          <li>The first column is already filled for you and forms a valid word</li>
          <li>Each row starts with the letter in the first column</li>
          <li>The sum of each row and column must match the numbers shown</li>
          <li>Each letter has a numerical value (0-4) shown in the table</li>
          <li>Need help? Use the HINT button to reveal a letter (adds 2 to your attempts)</li>
        </ul>
      </div>
    </div>
  );
};

export default GridLock;