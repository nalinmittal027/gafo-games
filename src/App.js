import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import GamesHome from './components/GamesHome';
import ChappalLanding from './components/ChappalLanding';
import Home from './components/Home';
import Game from './components/Game';
import GridLock from './components/GridLock/GridLock';
import TreasureRift from './components/TreasureRift/TreasureRift';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Main Games Homepage */}
          <Route path="/" element={<GamesHome />} />
          
          {/* Chappal vs Cockroach Routes */}
          <Route path="/chappal-vs-cockroach" element={<ChappalLanding />} />
          <Route path="/chappal-home" element={<Home />} />
          <Route path="/game/:gameId" element={<Game />} />
          
          {/* Grid Lock Route */}
          <Route path="/grid-lock" element={<GridLock />} />
          
          {/* Treasure Rift Route */}
          <Route path="/treasure-rift" element={<TreasureRift />} />
          
          {/* Redirect any other paths to the homepage */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;