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
  const [gridSize, setGridSize] = useState(3);
  const [grid, setGrid] = useState([]);
  const [originalGrid, setOriginalGrid] = useState([]);
  const [letterValues, setLetterValues] = useState({});
  const [rowSums, setRowSums] = useState([]);
  const [colSums, setColSums] = useState([]);
  const [rowMatches, setRowMatches] = useState([]);
  const [colMatches, setColMatches] = useState([]);
  const [gameWon, setGameWon] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [solutionRevealed, setSolutionRevealed] = useState(false);
  const [groupedLetterValues, setGroupedLetterValues] = useState({});
  const [validColumnIndex, setValidColumnIndex] = useState(0);
  
  // Generate a valid grid with valid words (rows only)
  const generateValidGrid = (size) => {
    const validGrid = [];
    const availableWords = [...wordDictionaries[size]];
    
    // Select random words for each row
    for (let i = 0; i < size; i++) {
      // Get a random word for this row
      const randomIndex = Math.floor(Math.random() * availableWords.length);
      const word = availableWords[randomIndex].toLowerCase();
      
      // Remove the word from available words
      availableWords.splice(randomIndex, 1);
      
      // Add the word to the grid
      const row = word.split('');
      validGrid.push(row);
    }
    
    return validGrid;
  };
  
  // Generate a valid grid with valid rows and at least one valid column
  const generateValidGridWithColumns = (size) => {
    // First generate a grid with valid rows
    const validGrid = generateValidGrid(size);
    
    // Check if any column is already a valid word
    let validColumnIndex = -1;
    
    for (let j = 0; j < size; j++) {
      const column = [];
      for (let i = 0; i < size; i++) {
        column.push(validGrid[i][j]);
      }
      
      const columnWord = column.join('');
      if (wordDictionaries[size].includes(columnWord)) {
        validColumnIndex = j;
        break;
      }
    }
    
    // If we already have a valid column, return the grid and valid column index
    if (validColumnIndex !== -1) {
      return { grid: validGrid, validColumnIndex };
    }
    
    // Try to make one column valid by regenerating the grid up to several attempts
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      const newGrid = generateValidGrid(size);
      
      // Check each column for a valid word
      for (let j = 0; j < size; j++) {
        const column = [];
        for (let i = 0; i < size; i++) {
          column.push(newGrid[i][j]);
        }
        
        const columnWord = column.join('');
        if (wordDictionaries[size].includes(columnWord)) {
          return { grid: newGrid, validColumnIndex: j };
        }
      }
      
      attempts++;
    }
    
    // If we can't find a grid with a valid column, try to modify one column to make it valid
    for (let j = 0; j < size; j++) {
      // Start with our initial valid grid
      const modifiedGrid = JSON.parse(JSON.stringify(validGrid));
      const availableWords = [...wordDictionaries[size]];
      
      // Try to find a word that can be placed vertically with minimal changes
      const potentialWords = availableWords.filter(word => word.length === size);
      
      for (const word of potentialWords) {
        // Check if this word can fit in the column with minimal changes
        let changesNeeded = 0;
        
        for (let i = 0; i < size; i++) {
          if (word[i] !== modifiedGrid[i][j]) {
            changesNeeded++;
          }
        }
        
        // If less than half the letters need changing, try to use this word
        if (changesNeeded <= Math.floor(size / 2)) {
          // Try to update the rows to accommodate this column
          let canUpdate = true;
          
          for (let i = 0; i < size; i++) {
            if (word[i] !== modifiedGrid[i][j]) {
              // Change this letter in the row
              const newRow = modifiedGrid[i].slice();
              newRow[j] = word[i];
              const newRowWord = newRow.join('');
              
              // Check if the new row is still a valid word
              if (wordDictionaries[size].includes(newRowWord)) {
                modifiedGrid[i] = newRow;
              } else {
                canUpdate = false;
                break;
              }
            }
          }
          
          if (canUpdate) {
            return { grid: modifiedGrid, validColumnIndex: j };
          }
        }
      }
    }
    
    // If all else fails, just return the original grid and mark the first column
    // This is a fallback and shouldn't happen often
    console.log("Could not generate grid with valid column. Using fallback.");
    return { grid: validGrid, validColumnIndex: 0 };
  };
  
  // Calculate row sums
  const calculateRowSums = (grid, values) => {
    return grid.map(row => {
      return row.reduce((sum, letter) => sum + values[letter], 0);
    });
  };
  
  // Calculate column sums
  const calculateColumnSums = (grid, values) => {
    const sums = [];
    for (let j = 0; j < grid[0].length; j++) {
      let sum = 0;
      for (let i = 0; i < grid.length; i++) {
        sum += values[grid[i][j]];
      }
      sums.push(sum);
    }
    return sums;
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
  
  // Generate a new game
  const generateNewGame = (size) => {
    const newGridSize = size || gridSize;
    
    // Generate grid with valid rows and at least one valid column
    const { grid: validGrid, validColumnIndex } = generateValidGridWithColumns(newGridSize);
    setOriginalGrid(validGrid);
    setValidColumnIndex(validColumnIndex);
    
    // Assign random values to each letter
    const values = {};
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < alphabet.length; i++) {
      values[alphabet[i]] = Math.floor(Math.random() * 6); // 0-5
    }
    setLetterValues(values);
    
    // Calculate row and column sums
    const rSums = calculateRowSums(validGrid, values);
    const cSums = calculateColumnSums(validGrid, values);
    setRowSums(rSums);
    setColSums(cSums);
    
    // Create player grid with only top-left and bottom-right revealed
    const playerGrid = [];
    for (let i = 0; i < newGridSize; i++) {
      const row = [];
      for (let j = 0; j < newGridSize; j++) {
        // Reveal only top-left and bottom-right
        if ((i === 0 && j === 0) || (i === newGridSize - 1 && j === newGridSize - 1)) {
          row.push({ letter: validGrid[i][j], revealed: true });
        } else {
          row.push({ letter: '', revealed: false });
        }
      }
      playerGrid.push(row);
    }
    
    setGrid(playerGrid);
    setGameWon(false);
    setSolutionRevealed(false);
    setAttempts(0);
    setRowMatches(Array(newGridSize).fill(false));
    setColMatches(Array(newGridSize).fill(false));
  };
  
  // Handle cell input change
  const handleCellChange = (rowIndex, colIndex, value) => {
    if (grid[rowIndex][colIndex].revealed || gameWon || solutionRevealed) return;
    
    // Update grid with new value
    const newGrid = [...grid];
    newGrid[rowIndex][colIndex] = { 
      ...newGrid[rowIndex][colIndex], 
      letter: value.toLowerCase() 
    };
    setGrid(newGrid);
    setAttempts(prev => prev + 1);
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
  }, [gridSize]);
  
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
  
  // Group letter values whenever letterValues or originalGrid changes
  useEffect(() => {
    if (!originalGrid.length) return;

    const grouped = {};
    
    // Initialize groups for 0-5
    for (let i = 0; i <= 5; i++) {
      grouped[i] = [];
    }
    
    // Get only the letters used in the grid
    const usedLetters = new Set();
    originalGrid.forEach(row => {
      row.forEach(letter => {
        usedLetters.add(letter);
      });
    });
    
    // Group used letters by their values
    Object.entries(letterValues).forEach(([letter, value]) => {
      if (grouped[value] && usedLetters.has(letter)) {
        grouped[value].push(letter);
      }
    });
    
    // Sort letters within each group
    for (let i = 0; i <= 5; i++) {
      grouped[i] = grouped[i].sort();
    }
    
    setGroupedLetterValues(grouped);
  }, [letterValues, originalGrid]);

  return (
    <div className="grid-lock-container">
      <div className="grid-lock-header">
        <div className="header-left">
          <h1>GRID LOCK</h1>
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
          <li>Each letter has a numerical value (0-5) shown in the left panel</li>
          <li>Use the revealed letters in the top-left and bottom-right as clues</li>
          <li>Need help? Use the HINT button to reveal another letter (adds 2 to your attempts)</li>
        </ul>
        <p className="valid-column-note">
          <strong>Bonus:</strong> One column (marked with ▲) will also form a valid word!
        </p>
      </div>
    </div>
  );
};

export default GridLock;