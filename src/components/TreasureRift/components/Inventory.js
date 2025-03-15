// src/components/TreasureRift/components/Inventory.js
import React from 'react';

const Inventory = ({ foundItems, mapOrientation, compassOrientation, rotateMap, rotateCompass }) => {
  if (!foundItems.map && !foundItems.compass && !foundItems.shipwreck) {
    return null;
  }

  return (
    <div className="game-inventory">
      {foundItems.map && (
        <div 
          className="inventory-item map"
          style={{ transform: `rotate(${mapOrientation}deg)` }}
          onClick={rotateMap}
        >
          <span className="item-icon">🗺️</span>
          <span className="item-label">Map (click to rotate)</span>
        </div>
      )}
      
      {foundItems.compass && (
        <div 
          className="inventory-item compass"
          style={{ transform: `rotate(${compassOrientation}deg)` }}
          onClick={rotateCompass}
        >
          <span className="item-icon">🧭</span>
          <span className="item-label">Compass (click to rotate)</span>
        </div>
      )}
      
      {foundItems.shipwreck && (
        <div className="inventory-item shipwreck">
          <span className="item-icon">⚓</span>
          <span className="item-label">Shipwreck</span>
        </div>
      )}
    </div>
  );
};

export default Inventory;