// src/components/MultiplayerGames.js
import React from 'react';
import { Link } from 'react-router-dom';
import './MultiplayerGames.css';

const MultiplayerGames = () => {
  // Array of multiplayer games
  const multiplayerGames = [
    {
      id: 'chappal-vs-cockroach',
      name: 'Chappal vs Cockroach',
      description: 'Fast-paced reflex and strategy game.',
      thumbnail: '/images/chappal-vs-cockroach.jpg',
      route: '/chappal-vs-cockroach',
      buyLink: 'https://www.amazon.in/Nightingame-Chappal-Cockroach-Players-Birthday/dp/B0CTQ4585P/ref=sr_1_5?crid=D55OS4I99KC3&dib=eyJ2IjoiMSJ9.NgpzpoI1dw0nYS6ha7hpk6mJe7sHWAs28E7HoDDb5o_4nAfRRJv6RhxWHi3xHGIeKfW2ZiLHEsbIZ4fV1AOsUNtf-SUn9VtI0dW_sIlSbvJWydCf9Ej0CKqYReT-K6ny6Gx793HIIF_u3anN3zhPr_GT-iV1mJvFa5WfvILyWdjMC6mS1pudAnes-39UMjlBOIlsvr-mJxJxV6dQuVJrjUkir64PE7ELjZ1E-Iaf1P5-s3Rw5dplDt6omWtr4tmi3OQZe2VhIHSdUg3MTG_ANy_UJibFcORRc-MZA2U9aw5jfCwDCLj22arDW1JsLDTgjtPl-VPVpgjyNf7uG5LhOR9lVyCg-_kyMNFkKyC2yuO71PcE-26Zsx2jquyYdcER9SEXG2hl12lV3s-Yj8ZTtIn1smbIa_zgfEcCjxzBrB0qNbYzyz_IAcKVwJ_a8BEK.kpNl5FSIma5Qw31uADYJO67ItP1qhXa9fhsHvo031aA&dib_tag=se&keywords=chappal+vs+cockroach+card+game&qid=1741981671&sprefix=chappal+vs+co%2Caps%2C227&sr=8-5',
      detailedDescription: 'A fast-paced card game where players race to squash cockroaches with their chappals. Requires quick reflexes and strategic thinking. Perfect for parties and family game nights.',
      playerCount: '2-6 players',
      playTime: '15-20 minutes',
      ageRange: '8+'
    },
    {
      id: 'sangram',
      name: 'Sangram',
      description: 'A tactical battle of wits and warriors.',
      thumbnail: '/images/sangram-thumbnail.jpg',
      route: '/sangram',
      buyLink: 'https://www.amazon.in/Nightingame-Sangram-Friends-Colonisers-Mindblowing/dp/B0C8686HBY/ref=sr_1_1_sspa?crid=3VB121VZWCOYN&dib=eyJ2IjoiMSJ9._n4aOoZGSrddP3S5c7CgOIJe1B91O7T93tISPcCXXhZi_l0GkNcAwIA2mP8Y-3X33VGSMKgVkr2V1j5j2xsrCzz8oqygcWcBuEassz5khxGlTaq_5eFlBQvrlrPLasWWU1wC3jpLJIr2CpNbWlJnzFnwQMnGEn7MOwFqi6OCowCA6NnJxcAgDhxQp4zLm212X4hB7KsFZyBAjnXDW4bXaP5-n7cAYN8-KaMALcyLVlCWkdLn3WX8IO-8bkGSzdsS8_qBJd7P9rAIRfBQ2c7DTUAauCgiSkL2mxK1r8JiBF8.wxGVHIAU45X99G2U1a9M2ouF4UkXopPu-SSWhQNtlxw&dib_tag=se&keywords=sangram+board+game&qid=1741981716&sprefix=sangram%2Caps%2C264&sr=8-1-spons&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&psc=1',
      detailedDescription: 'A strategic board game inspired by ancient Indian warfare. Players command armies, deploy tactics, and outmaneuver opponents to secure victory. Features beautiful artwork and deep strategic gameplay.',
      playerCount: '2-4 players',
      playTime: '45-60 minutes',
      ageRange: '10+'
    },
    {
      id: 'shortcut-longcut',
      name: 'Shortcut Longcut',
      description: 'Race to the finish with clever twists.',
      thumbnail: '/images/shortcut-longcut-thumbnail.jpg',
      route: '/shortcut-longcut',
      buyLink: 'https://www.amazon.in/Shortcut-Longcut-College-Friends-Players/dp/B0BCJZRJNF/ref=sr_1_3?crid=25GETRHI2Q7FJ&dib=eyJ2IjoiMSJ9.isqnhKjb3FNRn_ntNRmdi7XPaHxwDPJB4Cz6KONcm5o4I2XfiLHht2JGKH24zS1MIwVd_g2DAZFIx7HI9yxbbSw-HA_V_bHNBuZAvHxG_3Q.wTrcGb1TsLH1exEBdWhj8lkdlDXlD-SP5RdcejLmhow&dib_tag=se&keywords=shortcut+longcut&qid=1741981790&sprefix=shortcut+longcu%2Caps%2C329&sr=8-3',
      detailedDescription: 'A race-to-the-finish board game with unpredictable twists and turns. Players navigate a winding path filled with shortcuts and longcuts, racing to be the first to reach the end. Features dynamic gameplay that changes with each play session.',
      playerCount: '2-6 players',
      playTime: '30-45 minutes',
      ageRange: '8+'
    },
    {
      id: 'true-wizard',
      name: 'True Wizard',
      description: 'Only the smartest mage wins!',
      thumbnail: '/images/true-wizard-thumbnail.jpg',
      route: '/true-wizard',
      buyLink: 'https://www.amazon.in/Wizard-Potter-Players-Adults-Families/dp/B0BMT514J7/ref=sr_1_5?crid=3P1POCLFPY8NQ&dib=eyJ2IjoiMSJ9.6u70p5jxfg59347z1fupTqdavyd8Es5Ufe-jHm8poWxnDMG5ddtbUAsz2YX9J3QikITOpvIjwZwZnegCfmOaoqX_wbN8VsQAwoCnBmtY_Ur49T9oNrLJUZdgVnz3U8DAJVUuEOsg-k2YMYk6S204t9-m2V09VYNnNyf-ztzzcgk0yTGnXGxRy23CoecqS_d6Iwl3kyxyXDb-MyXFqaEPbQJt-UxHySYgfUqBHqlqIHBMYu2GBrVGtfQDfr1wqEX6gPkJ45a4XDLUxK1KoPvVxbLrfBmmg12A_kOJa0AHbF7V0luMVw7w9K6F8ajXFABvl_LUvNDE-DTRTUbb_llHDwnqcRFKiOZkOnnXYcJAZnu4M-2gIy6l4YXvpdK4d_zJcRNcAFy_dUPce2-uoBUe8xfRtrLlpSkogtQreiO3q7nzmpx2aBcYBYJqZ6nh8rmB.mlHnT6eEJ6jHAfDm0BBDhjghoOUTseFcHeMksyV7NUs&dib_tag=se&keywords=true+wizard+board+game&qid=1741981759&sprefix=true+wizard%2Caps%2C236&sr=8-5',
      detailedDescription: 'A magical strategy game where players take on the role of wizards competing to prove their magical prowess. Cast spells, solve puzzles, and outwit your opponents to become the True Wizard. Features beautiful artwork and engaging gameplay.',
      playerCount: '3-6 players',
      playTime: '40-60 minutes',
      ageRange: '10+'
    }
  ];

  return (
    <div className="multiplayer-games-container">
      <header className="page-header">
        <div className="header-content">
          <h1>Multiplayer Games</h1>
          <p className="page-description">Play Together, Compete Forever</p>
          <Link to="/" className="back-to-home">Back to Home</Link>
        </div>
      </header>

      <section className="games-showcase">
        <div className="games-grid">
          {multiplayerGames.map((game) => (
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
                    <span className="game-detail">{game.playerCount}</span>
                    <span className="game-detail">{game.playTime}</span>
                    <span className="game-detail">{game.ageRange}</span>
                  </div>
                  
                  <p className="game-expanded-description">{game.detailedDescription}</p>
                  
                  <div className="game-cta">
                    Play Now
                  </div>
                </div>
              </Link>
              
              {/* Buy button for multiplayer games */}
              {game.buyLink && (
                <a 
                  href={game.buyLink} 
                  className="buy-physical-button"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Buy Physical Game
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="buy-games-cta">
        <h2>Own the experience—get the real board game delivered to you!</h2>
        <div className="buy-options">
          <a 
            href="https://www.nightingame.com" 
            className="buy-option nightingame"
            target="_blank"
            rel="noopener noreferrer"
          >
            Buy from Nightingame
          </a>
          <a 
            href="https://www.amazon.in/s?k=nightingame" 
            className="buy-option amazon"
            target="_blank"
            rel="noopener noreferrer"
          >
            Buy from Amazon
          </a>
        </div>
      </section>

      <footer className="page-footer">
        <p>&copy; {new Date().getFullYear()} Gafo.Games. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MultiplayerGames;