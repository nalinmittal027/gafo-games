// src/components/GamesHome.js
import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './GamesHome.css';

const GamesHome = () => {
  // Reference to the games section for smooth scrolling
  const gamesSectionRef = useRef(null);
  
  // Function to scroll to games section
  const scrollToGames = () => {
    gamesSectionRef.current.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  // Add Quicksand font to the document head
  useEffect(() => {
    // Create link element for Quicksand font
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    
    // Add to head
    document.head.appendChild(link);
    
    // Clean up
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Array of game categories
  const gameCategories = [
    {
      id: 'multiplayer',
      name: 'Multiplayer Games',
      games: [
        {
          id: 'chappal-vs-cockroach',
          name: 'Chappal vs Cockroach',
          description: 'Battle cockroaches with your chappal in this exciting card game!',
          thumbnail: '/images/chappal-vs-cockroach.jpg',
          route: '/chappal-home'
        },
        {
          id: 'multiplayer-coming-soon-1',
          name: 'Coming Soon',
          description: 'A new multiplayer experience is on the way!',
          thumbnail: '/images/coming-soon.jpg',
          route: '#',
          disabled: true
        },
        {
          id: 'multiplayer-coming-soon-2',
          name: 'Coming Soon',
          description: 'Another thrilling multiplayer game in development!',
          thumbnail: '/images/coming-soon.jpg',
          route: '#',
          disabled: true
        }
      ]
    },
    {
      id: 'singleplayer',
      name: 'Single Player Games',
      games: [
        {
          id: 'grid-lock',
          name: 'Grid Lock',
          description: 'Solve the word puzzle by filling in missing letters based on numerical sums and constraints.',
          thumbnail: '/images/grid-lock.jpg',
          route: '/grid-lock',
          disabled: false
        },
        {
          id: 'singleplayer-coming-soon-1',
          name: 'Coming Soon',
          description: 'A new brain-teasing solo challenge is in development!',
          thumbnail: '/images/coming-soon.jpg',
          route: '#',
          disabled: true
        },
        {
          id: 'singleplayer-coming-soon-2',
          name: 'Coming Soon',
          description: 'Get ready for another immersive single-player experience!',
          thumbnail: '/images/coming-soon.jpg',
          route: '#',
          disabled: true
        }
      ]
    }
  ];

  return (
    <div className="games-home-container">
      {/* Hero section with GAFO title */}
      <section className="hero-section">
        <h1 className="gafo-title">GAFO</h1>
        <p className="gafo-tagline">Games are Forever</p>
        
        {/* Bouncing arrow */}
        <div className="scroll-arrow-container" onClick={scrollToGames}>
          <div className="scroll-arrow">↓</div>
        </div>
      </section>

      {/* Games section */}
      <section className="games-section" ref={gamesSectionRef}>
        {gameCategories.map((category) => (
          <div key={category.id} className="game-category">
            <h2 className="category-title">{category.name}</h2>
            <div className="games-grid">
              {category.games.map((game) => (
                <Link 
                  to={game.route} 
                  key={game.id}
                  className={`game-card ${game.disabled ? 'disabled' : ''}`}
                  onClick={(e) => game.disabled && e.preventDefault()}
                >
                  <div className="game-thumbnail">
                    <img 
                      src={game.thumbnail} 
                      alt={game.name} 
                      onError={(e) => {
                        // Fallback for missing images
                        e.target.src = '/images/default-game.jpg';
                        e.target.onerror = null;
                      }} 
                    />
                  </div>
                  <div className="game-info">
                    <h3 className="game-title">{game.name}</h3>
                    <p className="game-description">{game.description}</p>
                    <div className="game-cta">
                      {game.disabled ? 'Coming Soon' : 'Play Now'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <footer className="games-home-footer">
        <p>&copy; {new Date().getFullYear()} Gafo.Games. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">About Us</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact</a>
        </div>
      </footer>
    </div>
  );
};

export default GamesHome;