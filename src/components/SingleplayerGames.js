// src/components/SingleplayerGames.js
import React from 'react';
import { Link } from 'react-router-dom';
import './SingleplayerGames.css';

const SingleplayerGames = () => {
  // Array of single player games
  const singleplayerGames = [
    {
      id: 'grid-lock',
      name: 'Grid Lock',
      description: 'A logic puzzle that traps your mind in the best way.',
      thumbnail: '/images/grid-lock-thumbnail.jpg',
      route: '/grid-lock',
      detailedDescription: 'Grid Lock is a challenging logic puzzle where players fill a grid with letters based on numerical clues. Each puzzle requires deductive reasoning and clever word handling. Perfect for puzzle enthusiasts looking for a mental challenge.',
      difficulty: 'Medium to Hard',
      playTime: '15-30 minutes per puzzle',
      ageRange: '12+'
    },
    {
      id: 'treasure-rift',
      name: 'Treasure Rift',
      description: 'Decode the hidden paths to riches.',
      thumbnail: '/images/treasure-rift-thumbnail.jpg',
      route: '/treasure-rift',
      detailedDescription: 'Navigate dangerous waters, avoid pirates, and follow cryptic clues to discover hidden treasure in this adventure puzzle game. Features beautiful illustrations and progressively challenging levels that test your deduction skills.',
      difficulty: 'Progressive',
      playTime: '20-40 minutes per adventure',
      ageRange: '10+'
    },
    {
      id: 'mobius',
      name: 'Mobius',
      description: 'A never-ending challenge of patterns and loops.',
      thumbnail: '/images/mobius-thumbnail.jpg',
      route: '/mobius',
      detailedDescription: 'Inspired by the endless Möbius strip, this puzzle game challenges players to create and connect patterns that loop infinitely. With increasing complexity across levels, Mobius offers a visually stunning and intellectually stimulating experience.',
      difficulty: 'Easy to Expert',
      playTime: '10-20 minutes per level',
      ageRange: '8+'
    }
  ];

  return (
    <div className="singleplayer-games-container">
      <header className="page-header">
        <div className="header-content">
          <h1>Single Player Games</h1>
          <p className="page-description">Challenge Yourself, One Move at a Time</p>
          <Link to="/" className="back-to-home">Back to Home</Link>
        </div>
      </header>

      <section className="games-showcase">
        <div className="games-grid">
          {singleplayerGames.map((game) => (
            <div key={game.id} className="game-card-container">
              <Link to={game.route} className="game-card">
                <div className="game-thumbnail">
                  <img 
                    src={game.thumbnail} 
                    alt={game.name} 
                    onError={(e) => {
                      e.target.src = '/images/default-game.jpg';
                      e.target.onerror = null;
                    }} 
                  />
                </div>
                <div className="game-info">
                  <h2 className="game-title">{game.name}</h2>
                  <p className="game-description">{game.description}</p>
                  
                  <div className="game-details">
                    <span className="game-detail">{game.difficulty}</span>
                    <span className="game-detail">{game.playTime}</span>
                    <span className="game-detail">{game.ageRange}</span>
                  </div>
                  
                  <p className="game-expanded-description">{game.detailedDescription}</p>
                  
                  <div className="game-cta">
                    Play Now
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="more-games">
        <h2>Looking for a social experience?</h2>
        <p>Check out our multiplayer games to enjoy with friends and family!</p>
        <Link to="/multiplayer-games" className="more-games-link">View Multiplayer Games</Link>
      </section>

      <footer className="page-footer">
        <p>&copy; {new Date().getFullYear()} Gafo.Games. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default SingleplayerGames;