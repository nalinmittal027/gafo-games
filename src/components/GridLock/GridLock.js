// src/components/GridLock/GridLock.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './GridLock.css';

// Dictionary of valid words for different grid sizes
const wordDictionaries = {
  3: ['cat', 'dog', 'rat', 'bat', 'hat', 'mat', 'sat', 'pat', 'tap', 'top', 'mop', 'hop', 'pop', 'lot', 'dot', 'hot', 'pot', 'got', 'jot', 'rot', 'fog', 'log', 'bog', 'cog', 'jog', 'bag', 'rag', 'tag', 'wag', 'big', 'dig', 'fig', 'pig', 'wig', 'bun', 'fun', 'gun', 'run', 'sun', 'pun', 'gem', 'hem', 'rim', 'dim', 'him', 'den', 'hen', 'men', 'pen', 'ten', 'fan', 'man', 'pan', 'ran', 'tan', 'van', 'cab', 'dab', 'jab', 'lab', 'tab', 'bib', 'fib', 'rib', 'bob', 'cob', 'fob', 'job', 'mob', 'rob', 'sob', 'rub', 'tub', 'cub', 'hub', 'pub', 'sub'],
  
  4: ['cake', 'take', 'make', 'lake', 'rake', 'sake', 'wake', 'bake', 'fake', 'game', 'fame', 'lame', 'name', 'same', 'tame', 'best', 'nest', 'pest', 'rest', 'test', 'vest', 'west', 'zest', 'cool', 'fool', 'pool', 'tool', 'cast', 'fast', 'last', 'mast', 'past', 'vast', 'card', 'hard', 'lard', 'ward', 'yard', 'bark', 'dark', 'lark', 'mark', 'park', 'cold', 'bold', 'fold', 'gold', 'hold', 'mold', 'sold', 'told', 'band', 'hand', 'land', 'sand', 'bend', 'lend', 'mend', 'send', 'tend', 'bird', 'firm', 'girl', 'dirt', 'time', 'lime', 'mime', 'dime', 'star', 'scar', 'fear', 'dear', 'tear', 'bear', 'pear', 'gear', 'hear', 'year', 'ring', 'king', 'sing', 'wing'],
  
  5: ['plane', 'flame', 'blame', 'frame', 'shame', 'space', 'trace', 'grace', 'place', 'brace', 'store', 'shore', 'chore', 'snore', 'score', 'scent', 'spent', 'meant', 'plant', 'grant', 'slant', 'craft', 'draft', 'shaft', 'smart', 'start', 'chart', 'spark', 'stark', 'shark', 'shape', 'grape', 'drape', 'scrape', 'stare', 'scare', 'spare', 'share', 'flare', 'blare', 'glare', 'house', 'mouse', 'blouse', 'grind', 'blind', 'minds', 'winds', 'finds', 'binds', 'shine', 'whine', 'spine', 'twine', 'swine', 'dines', 'lines', 'pines', 'vines', 'mines', 'speak', 'freak', 'bleak', 'sneak', 'steak', 'break', 'creak', 'dream', 'cream', 'steam', 'gleam', 'seams', 'teams', 'beams', 'reams'],
  
  6: ['planet', 'market', 'basket', 'pocket', 'socket', 'flower', 'shower', 'slower', 'towers', 'powers', 'carpet', 'forget', 'target', 'carrot', 'pencil', 'happen', 'hidden', 'kitten', 'golden', 'frozen', 'listen', 'spoken', 'broken', 'chosen', 'woven', 'action', 'nation', 'lotion', 'potion', 'motion', 'option', 'station', 'caution', 'faction', 'mention', 'dragon', 'carbon', 'ribbon', 'cotton', 'button', 'common', 'cannon', 'season', 'reason', 'treason', 'lesson', 'blossom', 'tender', 'vendor', 'border', 'murder', 'powder', 'wonder', 'louder', 'holder', 'folder', 'summer', 'dinner', 'winner', 'copper', 'hopper', 'proper', 'supper', 'matter', 'batter', 'letter', 'better', 'setter', 'bitter', 'litter', 'sitter']
};

const GridLock = () => {
  // Game state
  const [gridSize, setGridSize] = useState(3);
  const [grid, setGrid] = useState([]);
  const [originalGrid, setOriginalGrid] = useState([]);
  
  // A single source of truth for letter values
  const [letterValues, setLetterValues] = useState({});
  
  // Values for display only
  const [displayedLetters, setDisplayedLetters] = useState([]);
  const [groupedLetterValues, setGroupedLetterValues] = useState({});
  
  // Game progress tracking
  const [rowSums, setRowSums] = useState([]);
  const [colSums, setColSums] = useState([]);
  const [rowMatches, setRowMatches] = useState([]);
  const [colMatches, setColMatches] = useState([]);
  const [validColumnIndex, setValidColumnIndex] = useState(0);
  
  // Game states
  const [gameWon, setGameWon] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [solutionRevealed, setSolutionRevealed] = useState(false);
  const [invalidLetter, setInvalidLetter] = useState('');
  
  // Load Ethnocentric font
  useEffect(() => {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.cdnfonts.com/css/ethnocentric';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    
    return () => {
      document.head.removeChild(fontLink);
    };
  }, []);
  
  // STEP 1: Generate a column-first grid to ensure a valid column
  const generateColumnFirstGrid = (size) => {
    // First, choose a random valid word for the column
    const availableWords = [...wordDictionaries[size]];
    const randomColumnIndex = Math.floor(Math.random() * size);
    
    // Shuffle available words for better randomness
    for (let i = availableWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableWords[i], availableWords[j]] = [availableWords[j], availableWords[i]];
    }
    
    // Find a column word
    let columnWord = null;
    for (const word of availableWords) {
      if (word.length === size) {
        columnWord = word;
        break;
      }
    }
    
    if (!columnWord) {
      columnWord = availableWords[0]; // Fallback
    }
    
    // Create an empty grid
    const grid = Array(size).fill().map(() => Array(size).fill(''));
    
    // Fill the chosen column with the valid word
    for (let i = 0; i < size; i++) {
      grid[i][randomColumnIndex] = columnWord[i];
    }
    
    // Now fill rows with valid words
    for (let rowIndex = 0; rowIndex < size; rowIndex++) {
      // Get valid words for this row length
      const potentialWords = availableWords.filter(word => word.length === size);
      
      // Shuffle potential words
      for (let i = potentialWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [potentialWords[i], potentialWords[j]] = [potentialWords[j], potentialWords[i]];
      }
      
      // Find a word that matches the letter in the valid column
      let rowWord = null;
      for (const word of potentialWords) {
        if (word[randomColumnIndex] === columnWord[rowIndex]) {
          rowWord = word;
          break;
        }
      }
      
      // If no matching word found, create a custom word (unlikely)
      if (!rowWord) {
        const customWord = Array(size).fill('');
        for (let j = 0; j < size; j++) {
          if (j === randomColumnIndex) {
            customWord[j] = columnWord[rowIndex];
          } else {
            // Fill with random letters to form a valid word
            customWord[j] = 'a'; // Placeholder, would need real word generation
          }
        }
        rowWord = customWord.join('');
      }
      
      // Fill this row
      for (let colIndex = 0; colIndex < size; colIndex++) {
        grid[rowIndex][colIndex] = rowWord[colIndex];
      }
    }
    
    return { grid, validColumnIndex: randomColumnIndex };
  };
  
  // STEP 2: Assign fixed values to each letter (0-4)
  const assignLetterValues = (grid) => {
    // Get all unique letters in the grid
    const usedLetters = new Set();
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        usedLetters.add(grid[i][j]);
      }
    }
    
    // Create values object
    const values = {};
    
    // Assign values 0-4 to used letters
    const usedLettersArray = Array.from(usedLetters);
    for (let i = 0; i < usedLettersArray.length; i++) {
      values[usedLettersArray[i]] = Math.floor(Math.random() * 5); // 0-4
    }
    
    // Add some dummy letters with values
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const alphabetArray = alphabet.split('');
    const unusedLetters = alphabetArray.filter(letter => !usedLetters.has(letter));
    
    // Shuffle unused letters
    for (let i = unusedLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unusedLetters[i], unusedLetters[j]] = [unusedLetters[j], unusedLetters[i]];
    }
    
    // Assign values to all remaining letters
    for (let i = 0; i < unusedLetters.length; i++) {
      values[unusedLetters[i]] = Math.floor(Math.random() * 5); // 0-4
    }
    
    return values;
  };
  
  // STEP 3: Create display letter groups with dummy letters
  const createDisplayLetterGroups = (grid, letterValues) => {
    // Get all letters used in the grid
    const usedLetters = new Set();
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        usedLetters.add(grid[i][j]);
      }
    }
    
    // Sort letters by their values (0-4)
    const grouped = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: []
    };
    
    // Add used letters to their value groups
    const usedLettersArray = Array.from(usedLetters);
    for (const letter of usedLettersArray) {
      const value = letterValues[letter];
      grouped[value].push(letter);
    }
    
    // Add dummy letters to ensure each value has at least 2 letters
    // Get unused letters
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const unusedLetters = [];
    for (let i = 0; i < alphabet.length; i++) {
      const letter = alphabet[i];
      if (!usedLetters.has(letter)) {
        unusedLetters.push(letter);
      }
    }
    
    // Shuffle unused letters
    for (let i = unusedLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unusedLetters[i], unusedLetters[j]] = [unusedLetters[j], unusedLetters[i]];
    }
    
    // Add dummy letters to ensure at least 2 letters per value
    let dummyIndex = 0;
    for (let value = 0; value <= 4; value++) {
      // Need at least 2 letters
      const neededLetters = Math.max(0, 2 - grouped[value].length);
      
      // Add some extra letters sometimes
      const extraLetters = Math.random() < 0.4 ? 1 : 0;
      
      const totalToAdd = neededLetters + extraLetters;
      
      for (let i = 0; i < totalToAdd && dummyIndex < unusedLetters.length; i++) {
        const dummyLetter = unusedLetters[dummyIndex++];
        grouped[value].push(dummyLetter);
      }
    }
    
    // Sort all letters in each group alphabetically
    for (let value = 0; value <= 4; value++) {
      grouped[value].sort();
    }
    
    // Create flat list of all displayed letters
    const allDisplayed = [];
    for (let value = 0; value <= 4; value++) {
      allDisplayed.push(...grouped[value]);
    }
    
    return { grouped, allDisplayed };
  };
  
  // Generate a new game
  const generateNewGame = (size) => {
    const newGridSize = size || gridSize;
    
    // Step 1: Generate a grid with a valid column
    const { grid: validGrid, validColumnIndex } = generateColumnFirstGrid(newGridSize);
    setOriginalGrid(validGrid);
    setValidColumnIndex(validColumnIndex);
    
    // Step 2: Assign random values to each letter (0-4)
    const values = assignLetterValues(validGrid);
    setLetterValues(values);
    
    // Step 3: Create display letter groups with dummy letters
    const { grouped, allDisplayed } = createDisplayLetterGroups(validGrid, values);
    setGroupedLetterValues(grouped);
    setDisplayedLetters(allDisplayed);
    
    // Step 4: Calculate row and column sums
    const rSums = validGrid.map(row => row.reduce((sum, letter) => sum + values[letter], 0));
    setRowSums(rSums);
    
    const cSums = [];
    for (let j = 0; j < validGrid[0].length; j++) {
      let sum = 0;
      for (let i = 0; i < validGrid.length; i++) {
        sum += values[validGrid[i][j]];
      }
      cSums.push(sum);
    }
    setColSums(cSums);
    
    // Step 5: Create player grid with only top-left and bottom-right revealed
    const playerGrid = [];
    for (let i = 0; i < newGridSize; i++) {
      const row = [];
      for (let j = 0; j < newGridSize; j++) {
        if ((i === 0 && j === 0) || (i === newGridSize - 1 && j === newGridSize - 1)) {
          row.push({ letter: validGrid[i][j], revealed: true });
        } else {
          row.push({ letter: '', revealed: false });
        }
      }
      playerGrid.push(row);
    }
    
    // Set initial game state
    setGrid(playerGrid);
    setGameWon(false);
    setSolutionRevealed(false);
    setAttempts(0);
    setRowMatches(Array(newGridSize).fill(false));
    setColMatches(Array(newGridSize).fill(false));
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
        currentSum += grid[i][colIndex].letter ? letterValues[grid[i][colIndex].letter] || 0 : 0;
      }
      return currentSum === expectedSum;
    });
  };
  
  // Handle cell input change
  const handleCellChange = (rowIndex, colIndex, value) => {
    if (grid[rowIndex][colIndex].revealed || gameWon || solutionRevealed) return;
    
    const inputLetter = value.toLowerCase();
    
    // Check if the letter is in the displayed letters
    if (inputLetter && !displayedLetters.includes(inputLetter)) {
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
    generateNewGame(gridSize);
  };
  
  // Change grid size
  const handleGridSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setGridSize(newSize);
    generateNewGame(newSize);
  };
  
  // Take a hint - reveal a random unrevealed cell
  const takeHint = () => {
    if (gameWon || solutionRevealed) return;
    
    // Find all unrevealed cells
    const unrevealedCells = [];
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (!cell.revealed && !cell.letter) {
          unrevealedCells.push({ rowIndex, colIndex });
        }
      });
    });
    
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
    const solutionGrid = originalGrid.map((row, rowIndex) => {
      return row.map((letter, colIndex) => {
        const isRevealed = (rowIndex === 0 && colIndex === 0) || 
                          (rowIndex === gridSize - 1 && colIndex === gridSize - 1);
        return {
          letter,
          revealed: isRevealed
        };
      });
    });
    
    setGrid(solutionGrid);
    setSolutionRevealed(true);
  };
  
  // Initialize game
  useEffect(() => {
    generateNewGame(gridSize);
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
    
    if (allRowsMatch && allColsMatch && grid.flat().every(cell => cell.letter !== '') && !solutionRevealed) {
      setGameWon(true);
    }
  }, [grid, solutionRevealed]);

  return (
    <div className="grid-lock-container">
      <div className="grid-lock-header">
        <div className="header-left">
          <h1 className="ethnocentric-font">GRID LOCK</h1>
          <div className="attempts-counter">
            <span>Attempts: {attempts}</span>
          </div>
        </div>
        <div className="header-controls">
          <div className="grid-size-selector">
            <select 
              id="grid-size" 
              value={gridSize} 
              onChange={handleGridSizeChange}
              disabled={gameWon || solutionRevealed}
            >
              <option value="3">3×3</option>
              <option value="4">4×4</option>
              <option value="5">5×5</option>
              <option value="6">6×6</option>
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
        <div className="letter-values">
          <h3>LETTER VALUES</h3>
          <div className="letter-values-by-number">
            {Object.entries(groupedLetterValues).map(([value, letters]) => (
              <div key={value} className="letter-value-group">
                <div className="value-header">{value}</div>
                <div className="letters-list">
                  {letters.map(letter => (
                    <div key={letter} className="letter-item">{letter}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid-area">
          <div className="grid-container">
            <div className="grid">
              {/* Column sums at the top */}
              <div className="col-sums">
                <div className="empty-cell"></div>
                {colSums.map((sum, index) => (
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
                  {row.map((cell, colIndex) => (
                    <div 
                      key={colIndex} 
                      className={`grid-cell ${cell.revealed ? 'revealed' : ''} ${solutionRevealed ? 'solution' : ''} ${colIndex === validColumnIndex ? 'valid-column' : ''}`}
                    >
                      <input
                        type="text"
                        maxLength="1"
                        value={solutionRevealed ? originalGrid[rowIndex][colIndex] : cell.letter}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        disabled={cell.revealed || gameWon || solutionRevealed}
                        className={cell.revealed ? 'revealed-input' : ''}
                      />
                      {(cell.letter || solutionRevealed) && (
                        <span className="letter-value-indicator">
                          {letterValues[solutionRevealed ? originalGrid[rowIndex][colIndex] : cell.letter] !== undefined 
                            ? letterValues[solutionRevealed ? originalGrid[rowIndex][colIndex] : cell.letter] 
                            : '?'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {/* Add column arrows below the grid */}
              <div className="col-indicators">
                <div className="empty-cell"></div>
                {Array(grid[0]?.length || 0).fill(0).map((_, index) => (
                  <div 
                    key={index} 
                    className={`col-indicator ${index === validColumnIndex ? 'visible' : ''}`}
                  >
                    {index === validColumnIndex && <span>▲</span>}
                  </div>
                ))}
              </div>
            </div>
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
          <li>Fill in the grid with letters to form valid words in each row</li>
          <li>The sum of each row and column must match the numbers shown</li>
          <li>Each letter has a numerical value (0-4) shown in the left panel</li>
          <li>Use the revealed letters in the top-left and bottom-right as clues</li>
          <li>Need help? Use the HINT button to reveal another letter (adds 2 to your attempts)</li>
        </ul>
        <p className="valid-column-note">
          <strong>Bonus:</strong> One column (marked with ▲) will also form a valid word!
        </p>
        <p className="hint-note">
          <strong>Tip:</strong> Not all letters shown in the values panel are used in the grid!
        </p>
      </div>
    </div>
  );
};

export default GridLock;