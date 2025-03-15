// src/components/TreasureRift/components/GameOverlay.js
import React from 'react';
import { Link } from 'react-router-dom';

const GameOverlay = ({ gameStatus, message, initializeGame }) => {
  if (gameStatus === 'playing') {
    return null;
  }

  return (
    <div className={`game-over-overlay ${gameStatus}`}>
      <div className="game-over-content">
        <h2>{gameStatus === 'won' ? 'Victory!' : 'Game Over!'}</h2>
        <p>{message}</p>
        <div className="game-over-buttons">
          <button className="restart-button" onClick={initializeGame}>Play Again</button>
          <Link to="/" className="home-button">Back to Games</Link>
        </div>
      </div>
    </div>
  );
};

export default GameOverlay;