// src/components/ChappalLanding.js
import React from 'react';
import { Link } from 'react-router-dom';
import './ChappalLanding.css';

const ChappalLanding = () => {
  return (
    <div className="chappal-landing-container">
      <div className="game-banner">
        <h1>Chappal vs Cockroach</h1>
        <p className="game-tagline">Battle cockroaches with your chappal in this exciting card game!</p>
      </div>
      
      <div className="game-description-section">
        <div className="game-description">
          <h2>About the Game</h2>
          <p>
            Chappal vs Cockroach is a fast-paced card game where players use their chappal cards to 
            defeat cockroach cards. Each player gets chappal cards with values from 2-8, and must 
            strategically play them against the revealed cockroach cards.
          </p>
          <p>
            The game runs for 3 rounds with different rules in each round, requiring players to adapt 
            their strategy. White chappals can only defeat white cockroaches, and dark chappals can only 
            defeat dark cockroaches.
          </p>
          <p>
            Watch out for dummy cards like safety pins, almonds, and more - they provide no points and 
            will cost you a chappal card when played against!
          </p>
        </div>
        
        <div className="game-rules">
          <h2>Game Rules</h2>
          <h3>Round Rules</h3>
          <ul>
            <li><strong>Round 1:</strong> Your chappal value must be HIGHER or EQUAL to the cockroach value.</li>
            <li><strong>Round 2:</strong> Your chappal value must be LOWER or EQUAL to the cockroach value.</li>
            <li><strong>Round 3:</strong> White chappal must be HIGHER or EQUAL; Dark chappal must be LOWER or EQUAL.</li>
          </ul>
          
          <h3>Winning</h3>
          <p>The player with the highest total score after all 3 rounds wins the game!</p>
        </div>
      </div>
      
      <div className="play-actions">
        <Link to="/" className="action-button secondary">Back to Games</Link>
        <Link to="/chappal-home" className="action-button primary">Play Now</Link>
      </div>
    </div>
  );
};

export default ChappalLanding;