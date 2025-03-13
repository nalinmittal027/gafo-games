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
  
  // Generate a new game
  const generateNewGame = (size) => {
    const newGridSize = size || gridSize;
    
    // Generate grid with valid rows AND valid columns
    const validGrid = generateValidGridWithColumns(newGridSize);
    setOriginalGrid(validGrid);
    
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
  
  // Generate a valid grid with both valid rows AND valid columns
  const generateValidGridWithColumns = (size) => {
    // This is a simplified approach that may not be perfect for large grids
    // For production, you might need a more sophisticated algorithm
    
    // Try a limited number of times to generate a valid grid
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      // First generate a grid with valid rows
      const candidateGrid = generateValidGrid(size);
      
      // Check if columns are also valid words
      let allColumnsValid = true;
      
      // Extract columns and check if they're valid words
      for (let j = 0; j < size; j++) {
        const column = [];
        for (let i = 0; i < size; i++) {
          column.push(candidateGrid[i][j]);
        }
        
        const columnWord = column.join('');
        if (!wordDictionaries[size].includes(columnWord)) {
          allColumnsValid = false;
          break;
        }
      }
      
      if (allColumnsValid) {
        return candidateGrid;
      }
      
      attempts++;
    }
    
    // If we can't find a perfect solution, use a fallback approach
    console.log("Couldn't find a grid with all valid columns. Using fallback grid.");
    return generateValidGrid(size);
  };
  
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
                      className={`grid-cell ${cell.revealed ? 'revealed' : ''} ${solutionRevealed ? 'solution' : ''}`}
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
          <li>Fill in the grid with letters to form valid words in each row AND column</li>
          <li>The sum of each row and column must match the numbers shown</li>
          <li>Each letter has a numerical value (0-5) shown in the left panel</li>
          <li>Use the revealed letters in the top-left and bottom-right as clues</li>
          <li>Need help? Use the HINT button to reveal another letter (adds 2 to your attempts)</li>
        </ul>
      </div>
    </div>
  );
};

export default GridLock;