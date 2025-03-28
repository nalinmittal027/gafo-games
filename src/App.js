// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import GamesHome from './components/GamesHome';
import ChappalLanding from './components/ChappalLanding';
import Home from './components/Home';
import Game from './components/Game';
import GridLock from './components/GridLock/GridLock';
import TreasureRift from './components/TreasureRift/TreasureRift';
import Mobius from './components/Mobius/Mobius';
import MultiplayerGames from './components/MultiplayerGames';
import SingleplayerGames from './components/SingleplayerGames';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Main Games Homepage */}
          <Route path="/" element={<GamesHome />} />
          
          {/* Multiplayer and Singleplayer Category Pages */}
          <Route path="/multiplayer-games" element={<MultiplayerGames />} />
          <Route path="/singleplayer-games" element={<SingleplayerGames />} />
          
          {/* Chappal vs Cockroach Routes */}
          <Route path="/chappal-vs-cockroach" element={<ChappalLanding />} />
          <Route path="/chappal-home" element={<Home />} />
          <Route path="/game/:gameId" element={<Game />} />
          
          {/* Singleplayer Game Routes */}
          <Route path="/grid-lock" element={<GridLock />} />
          <Route path="/treasure-rift" element={<TreasureRift />} />
          <Route path="/mobius" element={<Mobius />} />
          
          {/* Multiplayer Game Routes (placeholders) */}
          <Route path="/sangram" element={<Navigate to="/" replace />} /> {/* Placeholder - update when component exists */}
          <Route path="/shortcut-longcut" element={<Navigate to="/" replace />} /> {/* Placeholder - update when component exists */}
          <Route path="/true-wizard" element={<Navigate to="/" replace />} /> {/* Placeholder - update when component exists */}
          
          {/* Redirect any other paths to the homepage */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;