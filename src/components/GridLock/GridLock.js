// src/components/GridLock/GridLock.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './GridLock.css';

// Dictionary of valid words for different grid sizes (corrected)
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
    
    if (allRowsMatch && allColsMatch && grid.flat().every(cell => cell.letter !== '')) {
      setGameWon(true);
    }
  }, [grid]);
  
  // Generate a new game
  const generateNewGame = (size) => {
    const newGridSize = size || gridSize;
    const validGrid = generateValidGrid(newGridSize);
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
    setAttempts(0);
    setRowMatches(Array(newGridSize).fill(false));
    setColMatches(Array(newGridSize).fill(false));
  };
  
  // Generate a valid grid with valid words
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
    if (grid[rowIndex][colIndex].revealed) return;
    
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

  return (
    <div className="grid-lock-container">
      <div className="grid-lock-header">
        <h1>GRID LOCK</h1>
        <div className="header-controls">
          <div className="grid-size-selector">
            <select 
              id="grid-size" 
              value={gridSize} 
              onChange={handleGridSizeChange}
              disabled={gameWon}
            >
              <option value="3">3×3</option>
              <option value="4">4×4</option>
              <option value="5">5×5</option>
              <option value="6">6×6</option>
            </select>
          </div>
          
          <button className="game-button" onClick={restartGame}>
            {gameWon ? 'NEW GAME' : 'RESTART'}
          </button>
          
          <Link to="/" className="back-button">BACK</Link>
        </div>
      </div>
      
      <div className="game-area">
        <div className="letter-values">
          <div className="letter-values-grid">
            {Object.entries(letterValues).sort().map(([letter, value]) => (
              <div key={letter} className="letter-value-item">
                <span className="letter">{letter}</span>
                <span className="value">{value}</span>
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
                      className={`grid-cell ${cell.revealed ? 'revealed' : ''}`}
                    >
                      <input
                        type="text"
                        maxLength="1"
                        value={cell.letter}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        disabled={cell.revealed || gameWon}
                        className={cell.revealed ? 'revealed-input' : ''}
                      />
                      {cell.letter && (
                        <span className="letter-value-indicator">
                          {letterValues[cell.letter] !== undefined ? letterValues[cell.letter] : '?'}
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
      
      <div className="game-instructions">
        <h3>HOW TO PLAY</h3>
        <ul>
          <li>Fill in the grid with letters to form valid words in each row</li>
          <li>The sum of each row and column must match the numbers shown</li>
          <li>Each letter has a numerical value (0-5) shown in the left panel</li>
          <li>Use the revealed letters in the top-left and bottom-right as clues</li>
        </ul>
      </div>
    </div>
  );
};

export default GridLock;