// src/components/Mobius/Mobius.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Mobius.css';

const Mobius = () => {
  // Game States
  const [gameLoop, setGameLoop] = useState([]);
  const [movesLeft, setMovesLeft] = useState(0);
  const [difficulty, setDifficulty] = useState('easy');
  const [gameState, setGameState] = useState('setup'); // setup, playing, win, lose
  const [lockedIndices, setLockedIndices] = useState([]);
  const [selectedPowerUp, setSelectedPowerUp] = useState(null);
  const [powerUps, setPowerUps] = useState({
    equalizer: 0,
    reverseRipple: 0,
    extraMove: 0,
    fixedPoint: 0,
    loopSkip: 0
  });

  // Game Configuration based on difficulty
  const difficultyConfig = {
    easy: { loopSize: 6, moves: 9, lockedCount: 0, powerUpChance: 0.7 },
    medium: { loopSize: 8, moves: 7, lockedCount: 2, powerUpChance: 0.4 },
    hard: { loopSize: 10, moves: 6, lockedCount: 3, powerUpChance: 0.2 }
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
      const powerUpTypes = Object.keys(powerUps);
      const randomPowerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      newPowerUps[randomPowerUp] += 1;
      setPowerUps(newPowerUps);
    }

    setGameLoop(newLoop);
    setMovesLeft(config.moves);
    setLockedIndices(locked);
    setGameState('playing');
  }, [difficulty, powerUps]);

  // Start Game
  const startGame = (level) => {
    setDifficulty(level);
    setSelectedPowerUp(null);
    generateLoop();
  };

  // Restart Game
  const restartGame = () => {
    setGameState('setup');
  };

  // Check if player has won
  const checkWin = useCallback(() => {
    if (gameLoop.length === 0) return false;
    const firstNum = gameLoop[0];
    return gameLoop.every(num => num === firstNum);
  }, [gameLoop]);

  // Handle making a move
  const makeMove = (index, direction) => {
    if (gameState !== 'playing' || lockedIndices.includes(index) || movesLeft <= 0) return;

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
    
    // Handle Extra Move power-up specially
    if (selectedPowerUp === 'extraMove') {
      const newPowerUps = {...powerUps};
      newPowerUps.extraMove -= 1;
      setPowerUps(newPowerUps);
      setSelectedPowerUp(null);
      // Don't decrement moves in this case
    } else {
      setMovesLeft(prevMoves => prevMoves - 1);
    }
  };

  // Function to activate power-up
  const activatePowerUp = (type) => {
    if (powerUps[type] > 0 && gameState === 'playing') {
      setSelectedPowerUp(type);
    }
  };

  // Check game state after each move
  useEffect(() => {
    if (gameState === 'playing') {
      if (checkWin()) {
        setGameState('win');
      } else if (movesLeft <= 0) {
        setGameState('lose');
      }
    }
  }, [gameLoop, movesLeft, gameState, checkWin]);

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
            className={`power-up ${selectedPowerUp === 'extraMove' ? 'selected' : ''} ${powerUps.extraMove <= 0 ? 'disabled' : ''}`}
            onClick={() => activatePowerUp('extraMove')}
            disabled={powerUps.extraMove <= 0}
            title="Extra Move: Your next move doesn't count against your move limit"
          >
            <span role="img" aria-label="Extra Move">⏳</span>
            <span className="power-up-count">{powerUps.extraMove}</span>
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
              {selectedPowerUp === 'extraMove' && " ⏳ Extra Move - Your next move is free"}
              {selectedPowerUp === 'fixedPoint' && " 🎯 Fixed Point - Select a number to lock it"}
              {selectedPowerUp === 'loopSkip' && " 💫 Loop Skip - Your next move won't affect neighbors"}
            </p>
            <button className="cancel-power-up" onClick={() => setSelectedPowerUp(null)}>Cancel</button>
          </div>
        )}
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
        <div className="moves-counter">Moves Left: {movesLeft}</div>
        
        <svg className="loop-container" viewBox="0 0 400 400">
          {/* Outer circle */}
          <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#ccc" strokeWidth="2" />
          
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

  // Render setup screen
  const renderSetup = () => {
    return (
      <div className="mobius-setup">
        <h2>Choose Difficulty</h2>
        <div className="difficulty-buttons">
          <button onClick={() => startGame('easy')}>Easy</button>
          <button onClick={() => startGame('medium')}>Medium</button>
          <button onClick={() => startGame('hard')}>Hard</button>
        </div>
        
        <div className="game-instructions">
          <h3>How to Play</h3>
          <p>Make all numbers in the loop equal to win.</p>
          <ul>
            <li>Click + or - to change a number</li>
            <li>When you increase a number, its left neighbor decreases by 1</li>
            <li>When you decrease a number, its right neighbor increases by 1</li>
            <li>Solve the puzzle before running out of moves</li>
            <li>Locked numbers (🔒) cannot be changed</li>
            <li>Use power-ups strategically to solve tougher puzzles</li>
          </ul>
        </div>
      </div>
    );
  };

  // Render win screen
  const renderWin = () => {
    return (
      <div className="mobius-result win">
        <h2>You Won! 🎉</h2>
        <p>You balanced the loop in {difficultyConfig[difficulty].moves - movesLeft} moves.</p>
        <button onClick={restartGame}>Play Again</button>
      </div>
    );
  };

  // Render lose screen
  const renderLose = () => {
    return (
      <div className="mobius-result lose">
        <h2>Game Over</h2>
        <p>You ran out of moves. Try again!</p>
        <button onClick={restartGame}>Try Again</button>
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
        {gameState === 'setup' && renderSetup()}
        
        {gameState === 'playing' && (
          <div className="game-playing">
            {renderGameBoard()}
            {renderPowerUps()}
          </div>
        )}
        
        {gameState === 'win' && renderWin()}
        {gameState === 'lose' && renderLose()}
      </div>

      <footer className="mobius-footer">
        <p>&copy; {new Date().getFullYear()} Gafo.Games. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Mobius;