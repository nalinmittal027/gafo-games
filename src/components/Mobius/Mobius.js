// src/components/Mobius/Mobius.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Mobius.css';

const Mobius = () => {
  // Game States
  const [gameLoop, setGameLoop] = useState([]);
  const [movesTaken, setMovesTaken] = useState(0);
  const [difficulty, setDifficulty] = useState('easy');
  const [gameState, setGameState] = useState('playing'); // playing, win
  const [lockedIndices, setLockedIndices] = useState([]);
  const [selectedPowerUp, setSelectedPowerUp] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [powerUps, setPowerUps] = useState({
    equalizer: 1,
    reverseRipple: 1,
    extraMove: 0, // Removed since there's no move limit
    fixedPoint: 1,
    loopSkip: 1
  });

  // Game Configuration based on difficulty
  const difficultyConfig = {
    easy: { loopSize: 6, lockedCount: 0, powerUpChance: 0.7 },
    medium: { loopSize: 8, lockedCount: 2, powerUpChance: 0.4 },
    hard: { loopSize: 10, lockedCount: 3, powerUpChance: 0.2 }
  };

  // Performance rating thresholds (moves)
  const performanceRating = {
    easy: { genius: 8, excellent: 12, good: 18, poor: Infinity },
    medium: { genius: 12, excellent: 18, good: 25, poor: Infinity },
    hard: { genius: 15, excellent: 22, good: 32, poor: Infinity }
  };

  // Get rating based on move count
  const getRating = (movesCount) => {
    const thresholds = performanceRating[difficulty];
    if (movesCount <= thresholds.genius) return 'Genius';
    if (movesCount <= thresholds.excellent) return 'Excellent';
    if (movesCount <= thresholds.good) return 'Good';
    return 'Keep Practicing';
  };

  // Generate Random Loop
  const generateLoop = useCallback(() => {
    const config = difficultyConfig[difficulty];
    const size = config.loopSize;
    const newLoop = Array.from({ length: size }, () => Math.floor(Math.random() * 9) + 1);
    
    // Generate random locked positions
    const locked = [];
    if (config.lockedCount > 0) {
      while (locked.length < config.lockedCount) {
        const randomIndex = Math.floor(Math.random() * size);
        if (!locked.includes(randomIndex)) {
          locked.push(randomIndex);
        }
      }
    }
    
    // Possibly add a powerup
    const newPowerUps = {...powerUps};
    if (Math.random() < config.powerUpChance) {
      const powerUpTypes = Object.keys(powerUps).filter(key => key !== 'extraMove');
      const randomPowerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      newPowerUps[randomPowerUp] += 1;
      setPowerUps(newPowerUps);
    }

    setGameLoop(newLoop);
    setMovesTaken(0);
    setLockedIndices(locked);
    setGameState('playing');
    setShowRules(false);
  }, [difficulty, powerUps]);

  // Initialize game on component mount
  useEffect(() => {
    generateLoop();
  }, [generateLoop]);

  // Change difficulty
  const changeDifficulty = (level) => {
    setDifficulty(level);
    setSelectedPowerUp(null);
    generateLoop();
  };

  // Restart Game
  const restartGame = () => {
    generateLoop();
  };

  // Check if player has won
  const checkWin = useCallback(() => {
    if (gameLoop.length === 0) return false;
    const firstNum = gameLoop[0];
    return gameLoop.every(num => num === firstNum);
  }, [gameLoop]);

  // Handle making a move
  const makeMove = (index, direction) => {
    if (gameState !== 'playing' || lockedIndices.includes(index)) return;

    const newLoop = [...gameLoop];
    const loopSize = newLoop.length;
    
    // Apply move based on selected power-up
    if (selectedPowerUp === 'equalizer') {
      const targetValue = newLoop[index];
      const leftIndex = (index - 1 + loopSize) % loopSize;
      const rightIndex = (index + 1) % loopSize;
      
      if (!lockedIndices.includes(leftIndex)) newLoop[leftIndex] = targetValue;
      if (!lockedIndices.includes(rightIndex)) newLoop[rightIndex] = targetValue;
      
      // Use up the power-up
      const newPowerUps = {...powerUps};
      newPowerUps.equalizer -= 1;
      setPowerUps(newPowerUps);
      setSelectedPowerUp(null);
    } 
    else if (selectedPowerUp === 'reverseRipple') {
      applyMove(index, direction, true);
      
      // Use up the power-up
      const newPowerUps = {...powerUps};
      newPowerUps.reverseRipple -= 1;
      setPowerUps(newPowerUps);
      setSelectedPowerUp(null);
    }
    else if (selectedPowerUp === 'loopSkip') {
      // Only affect the selected number without propagation
      if (!lockedIndices.includes(index)) {
        newLoop[index] = Math.max(1, Math.min(9, newLoop[index] + direction));
      }
      
      // Use up the power-up
      const newPowerUps = {...powerUps};
      newPowerUps.loopSkip -= 1;
      setPowerUps(newPowerUps);
      setSelectedPowerUp(null);
    }
    else if (selectedPowerUp === 'fixedPoint') {
      // Lock the selected position
      if (!lockedIndices.includes(index)) {
        setLockedIndices([...lockedIndices, index]);
      }
      
      // Use up the power-up
      const newPowerUps = {...powerUps};
      newPowerUps.fixedPoint -= 1;
      setPowerUps(newPowerUps);
      setSelectedPowerUp(null);
      
      // This doesn't consume a move
      return;
    }
    else {
      // Standard move
      applyMove(index, direction, false);
    }
    
    function applyMove(index, direction, isReversed) {
      if (!lockedIndices.includes(index)) {
        // Update the selected number
        newLoop[index] = Math.max(1, Math.min(9, newLoop[index] + direction));

        // Update the adjacent numbers based on the move
        if (isReversed) {
          // Reverse ripple: right neighbor affected by increase, left by decrease
          const rightIndex = (index + 1) % loopSize;
          const leftIndex = (index - 1 + loopSize) % loopSize;
          
          if (direction > 0 && !lockedIndices.includes(rightIndex)) {
            newLoop[rightIndex] = Math.max(1, Math.min(9, newLoop[rightIndex] - 1));
          } else if (direction < 0 && !lockedIndices.includes(leftIndex)) {
            newLoop[leftIndex] = Math.max(1, Math.min(9, newLoop[leftIndex] + 1));
          }
        } else {
          // Normal rules: left neighbor affected by increase, right by decrease
          const leftIndex = (index - 1 + loopSize) % loopSize;
          const rightIndex = (index + 1) % loopSize;
          
          if (direction > 0 && !lockedIndices.includes(leftIndex)) {
            newLoop[leftIndex] = Math.max(1, Math.min(9, newLoop[leftIndex] - 1));
          } else if (direction < 0 && !lockedIndices.includes(rightIndex)) {
            newLoop[rightIndex] = Math.max(1, Math.min(9, newLoop[rightIndex] + 1));
          }
        }
      }
    }
    
    setGameLoop(newLoop);
    setMovesTaken(prevMoves => prevMoves + 1);
  };

  // Function to activate power-up
  const activatePowerUp = (type) => {
    if (powerUps[type] > 0 && gameState === 'playing') {
      setSelectedPowerUp(type);
    }
  };

  // Check game state after each move
  useEffect(() => {
    if (gameState === 'playing' && checkWin()) {
      setGameState('win');
    }
  }, [gameLoop, gameState, checkWin]);

  // Toggle rules display
  const toggleRules = () => {
    setShowRules(!showRules);
  };

  // Render the power-ups
  const renderPowerUps = () => {
    return (
      <div className="mobius-power-ups">
        <h3>Power-Ups</h3>
        <div className="power-up-grid">
          <button 
            className={`power-up ${selectedPowerUp === 'equalizer' ? 'selected' : ''} ${powerUps.equalizer <= 0 ? 'disabled' : ''}`}
            onClick={() => activatePowerUp('equalizer')}
            disabled={powerUps.equalizer <= 0}
            title="Equalizer: Makes neighboring numbers match the selected number"
          >
            <span role="img" aria-label="Equalizer">🌀</span>
            <span className="power-up-count">{powerUps.equalizer}</span>
          </button>
          
          <button 
            className={`power-up ${selectedPowerUp === 'reverseRipple' ? 'selected' : ''} ${powerUps.reverseRipple <= 0 ? 'disabled' : ''}`}
            onClick={() => activatePowerUp('reverseRipple')}
            disabled={powerUps.reverseRipple <= 0}
            title="Reverse Ripple: Changes propagate in the opposite direction"
          >
            <span role="img" aria-label="Reverse Ripple">🔄</span>
            <span className="power-up-count">{powerUps.reverseRipple}</span>
          </button>
          
          <button 
            className={`power-up ${selectedPowerUp === 'fixedPoint' ? 'selected' : ''} ${powerUps.fixedPoint <= 0 ? 'disabled' : ''}`}
            onClick={() => activatePowerUp('fixedPoint')}
            disabled={powerUps.fixedPoint <= 0}
            title="Fixed Point: Locks a number, making it immune to changes"
          >
            <span role="img" aria-label="Fixed Point">🎯</span>
            <span className="power-up-count">{powerUps.fixedPoint}</span>
          </button>
          
          <button 
            className={`power-up ${selectedPowerUp === 'loopSkip' ? 'selected' : ''} ${powerUps.loopSkip <= 0 ? 'disabled' : ''}`}
            onClick={() => activatePowerUp('loopSkip')}
            disabled={powerUps.loopSkip <= 0}
            title="Loop Skip: Temporarily breaks the loop effect for one move"
          >
            <span role="img" aria-label="Loop Skip">💫</span>
            <span className="power-up-count">{powerUps.loopSkip}</span>
          </button>
        </div>
        
        {selectedPowerUp && (
          <div className="active-power-up">
            <p>Active Power-Up: 
              {selectedPowerUp === 'equalizer' && " 🌀 Equalizer - Choose a number to equalize its neighbors"}
              {selectedPowerUp === 'reverseRipple' && " 🔄 Reverse Ripple - Effects propagate in reverse"}
              {selectedPowerUp === 'fixedPoint' && " 🎯 Fixed Point - Select a number to lock it"}
              {selectedPowerUp === 'loopSkip' && " 💫 Loop Skip - Your next move won't affect neighbors"}
            </p>
            <button className="cancel-power-up" onClick={() => setSelectedPowerUp(null)}>Cancel</button>
          </div>
        )}
      </div>
    );
  };

  // Render the game information panel
  const renderGameInfo = () => {
    return (
      <div className="mobius-game-info">
        <div className="difficulty-select">
          <span>Difficulty:</span>
          <div className="difficulty-buttons">
            <button 
              className={difficulty === 'easy' ? 'active' : ''} 
              onClick={() => changeDifficulty('easy')}
            >
              Easy
            </button>
            <button 
              className={difficulty === 'medium' ? 'active' : ''} 
              onClick={() => changeDifficulty('medium')}
            >
              Medium
            </button>
            <button 
              className={difficulty === 'hard' ? 'active' : ''} 
              onClick={() => changeDifficulty('hard')}
            >
              Hard
            </button>
          </div>
        </div>
        <div className="moves-counter">Moves: {movesTaken}</div>
        <button className="rules-button" onClick={toggleRules}>
          {showRules ? 'Hide Rules' : 'Show Rules'}
        </button>
      </div>
    );
  };

  // Render the game rules
  const renderRules = () => {
    if (!showRules) return null;
    
    return (
      <div className="game-instructions">
        <h3>How to Play</h3>
        <p>Make all numbers in the loop equal to win. Use as few moves as possible for a better rating!</p>
        <ul>
          <li>Click + or - to change a number</li>
          <li>When you increase a number, its left neighbor decreases by 1</li>
          <li>When you decrease a number, its right neighbor increases by 1</li>
          <li>Locked numbers (🔒) cannot be changed</li>
          <li>Use power-ups strategically to solve the puzzle efficiently</li>
        </ul>
        <h4>Power-Ups:</h4>
        <ul>
          <li><span role="img" aria-label="Equalizer">🌀</span> <strong>Equalizer:</strong> Makes neighboring numbers match the selected number</li>
          <li><span role="img" aria-label="Reverse Ripple">🔄</span> <strong>Reverse Ripple:</strong> Changes propagate in the opposite direction</li>
          <li><span role="img" aria-label="Fixed Point">🎯</span> <strong>Fixed Point:</strong> Locks a number, making it immune to changes</li>
          <li><span role="img" aria-label="Loop Skip">💫</span> <strong>Loop Skip:</strong> Your next move won't affect neighbors</li>
        </ul>
      </div>
    );
  };

  // Render the game board
  const renderGameBoard = () => {
    const size = gameLoop.length;
    const radius = 150;
    const centerX = 200;
    const centerY = 200;
    
    return (
      <div className="mobius-game-board">
        <svg className="loop-container" viewBox="0 0 400 400">
          {/* Outer circle */}
          <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#1AFFD5" strokeWidth="2" />
          
          {/* Numbers */}
          {gameLoop.map((num, index) => {
            const angle = (index / size) * 2 * Math.PI;
            const x = centerX + radius * Math.sin(angle);
            const y = centerY - radius * Math.cos(angle);
            
            const isLocked = lockedIndices.includes(index);
            
            return (
              <g key={index} className="number-node">
                {/* Circle behind number */}
                <circle 
                  cx={x} 
                  cy={y} 
                  r="30" 
                  className={isLocked ? "locked-node" : ""}
                />
                
                {/* Number text */}
                <text 
                  x={x} 
                  y={y} 
                  textAnchor="middle" 
                  dominantBaseline="middle"
                  className="number-text"
                >
                  {num}
                </text>
                
                {/* Control buttons (if not locked) */}
                {!isLocked && (
                  <>
                    <circle 
                      cx={x} 
                      cy={y - 30} 
                      r="12" 
                      className="control-button increase"
                      onClick={() => makeMove(index, 1)}
                    />
                    <text 
                      x={x} 
                      y={y - 30} 
                      textAnchor="middle" 
                      dominantBaseline="middle"
                      className="control-text"
                      onClick={() => makeMove(index, 1)}
                    >
                      +
                    </text>
                    
                    <circle 
                      cx={x} 
                      cy={y + 30} 
                      r="12" 
                      className="control-button decrease"
                      onClick={() => makeMove(index, -1)}
                    />
                    <text 
                      x={x} 
                      y={y + 30} 
                      textAnchor="middle" 
                      dominantBaseline="middle"
                      className="control-text"
                      onClick={() => makeMove(index, -1)}
                    >
                      -
                    </text>
                  </>
                )}
                
                {/* Lock icon for locked numbers */}
                {isLocked && (
                  <text 
                    x={x} 
                    y={y - 30}
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    className="lock-icon"
                  >
                    🔒
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Render win screen
  const renderWin = () => {
    const rating = getRating(movesTaken);
    let ratingClass = '';
    
    if (rating === 'Genius') ratingClass = 'genius';
    else if (rating === 'Excellent') ratingClass = 'excellent';
    else if (rating === 'Good') ratingClass = 'good';
    else ratingClass = 'poor';
    
    return (
      <div className="mobius-result win">
        <h2>You Won! 🎉</h2>
        <p>You solved the puzzle in {movesTaken} moves.</p>
        <div className={`rating ${ratingClass}`}>
          <span>Rating: {rating}</span>
        </div>
        <div className="win-buttons">
          <button onClick={restartGame}>Play Again</button>
          <button onClick={() => changeDifficulty(difficulty === 'easy' ? 'medium' : difficulty === 'medium' ? 'hard' : 'easy')}>
            Try {difficulty === 'easy' ? 'Medium' : difficulty === 'medium' ? 'Hard' : 'Easy'} Level
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="mobius-container">
      <header className="mobius-header">
        <h1>Mobius</h1>
        <p className="mobius-tagline">The Looping Logic Game</p>
        <Link to="/" className="back-to-home">Back to Home</Link>
      </header>

      <div className="mobius-game">
        {gameState === 'playing' && (
          <div className="game-playing">
            {renderGameInfo()}
            {renderRules()}
            {renderGameBoard()}
            {renderPowerUps()}
          </div>
        )}
        
        {gameState === 'win' && renderWin()}
      </div>

      <footer className="mobius-footer">
        <p>&copy; {new Date().getFullYear()} Gafo.Games. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Mobius;