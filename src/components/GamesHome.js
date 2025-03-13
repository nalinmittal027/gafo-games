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

  // Array of available games
  const games = [
    {
      id: 'chappal-vs-cockroach',
      name: 'Chappal vs Cockroach',
      description: 'Battle cockroaches with your chappal in this exciting card game!',
      thumbnail: '/images/chappal-vs-cockroach.jpg',
      route: '/chappal-home'
    },
    {
      id: 'coming-soon-1',
      name: 'Coming Soon',
      description: 'A new exciting game is in development!',
      thumbnail: '/images/coming-soon.jpg',
      route: '#',
      disabled: true
    },
    {
      id: 'coming-soon-2',
      name: 'Coming Soon',
      description: 'Another thrilling game experience on the way!',
      thumbnail: '/images/coming-soon.jpg',
      route: '#',
      disabled: true
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
        <h2 className="section-title">Our Games</h2>
        <div className="games-grid">
          {games.map((game) => (
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