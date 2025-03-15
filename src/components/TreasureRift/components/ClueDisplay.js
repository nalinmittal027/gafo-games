// src/components/TreasureRift/components/ClueDisplay.js
import React from 'react';

const ClueDisplay = ({ gamePhase, foundItems, mapClue, treasureClues }) => {
  if (gamePhase === 1) return null;
    
  return (
    <div className="game-clues">
      <h3>Clues</h3>
      {gamePhase === 2 && foundItems.map && (
        <div className="clue-section">
          <h4>Map Clue</h4>
          <p>{mapClue}</p>
        </div>
      )}
      
      {gamePhase === 3 && foundItems.map && foundItems.compass && (
        <div className="clue-section">
          <h4>Visual Clue</h4>
          <p>Rotate the Map and Compass until they align correctly to reveal the Shipwreck's location.</p>
        </div>
      )}
      
      {gamePhase === 4 && foundItems.shipwreck && (
        <div className="clue-section">
          <h4>Scroll Clues</h4>
          <ul>
            {treasureClues.map((clue, index) => (
              <li key={index}>{clue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ClueDisplay;