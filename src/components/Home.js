// src/components/Home.js - Critical Error Fixes
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import io from 'socket.io-client';

const Home = () => {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Check if we have a game ID in the URL (for direct links)
    const pathParts = location.pathname.split('/');
    if (pathParts.length > 2 && pathParts[1] === 'game') {
      const urlGameId = pathParts[2];
      // If there's a game ID in the URL, save it and redirect when ready
      if (urlGameId) {
        console.log('Found game ID in URL:', urlGameId);
        
        const savedName = localStorage.getItem('playerName');
        if (savedName) {
          // We have both name and game ID, redirect immediately
          localStorage.removeItem('gameCreator');
          navigate(`/game/${urlGameId}`);
          return;
        } else {
          // We have game ID but need a name, store ID for later
          setGameId(urlGameId);
        }
      }
    }

    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
    }

    // Setup socket connection
    const connectSocket = () => {
      const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      console.log('Connecting to socket at:', SOCKET_URL);
      
      // Test the connection first with a fetch
      fetch(`${SOCKET_URL}/ping`)
        .then(response => response.text())
        .catch(err => console.error('Server ping failed:', err));
      
      const newSocket = io(SOCKET_URL, { 
        forceNew: true,
        reconnectionAttempts: 5,
        timeout: 10000
      });
      
      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError('Unable to connect to game server. Please try again.');
        setLoading(false);
      });

      // Listen for responses
      newSocket.on('gameCreated', ({ gameId }) => {
        console.log('Game created with ID:', gameId);
        setLoading(false);
        // Mark this player as the creator for this game
        localStorage.setItem('gameCreator', gameId);
        navigate(`/game/${gameId}`);
      });

      newSocket.on('gameExists', ({ exists, gameId: foundGameId }) => {
        console.log('Game exists response:', exists, foundGameId);
        setLoading(false);
        if (exists) {
          localStorage.removeItem('gameCreator'); // Not the creator
          navigate(`/game/${foundGameId}`);
        } else {
          setError('Game not found. Please check the Game ID');
        }
      });

      newSocket.on('error', (error) => {
        console.error('Received error:', error);
        setLoading(false);
        setError(error.message || 'An error occurred');
      });

      setSocket(newSocket);
      return newSocket;
    };

    const newSocket = connectSocket();

    // Clean up on unmount
    return () => {
      console.log('Disconnecting socket');
      if (newSocket) newSocket.disconnect();
    };
  }, [navigate, location.pathname]);

  const handleCreateGame = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');
    localStorage.setItem('playerName', playerName);
    
    if (socket) {
      console.log('Requesting to create game for:', playerName);
      // Clear any previous creator status
      localStorage.removeItem('gameCreator');
      socket.emit('createGame', { playerName });
    } else {
      setError('Connection error. Please refresh the page.');
      setLoading(false);
    }
  };

  const handleJoinGame = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!gameId.trim()) {
      setError('Please enter a game ID');
      return;
    }

    setLoading(true);
    setError('');
    localStorage.setItem('playerName', playerName);
    
    if (socket) {
      const trimmedId = gameId.trim().toUpperCase();
      console.log('Checking if game exists:', trimmedId);
      // Clear any previous creator status
      localStorage.removeItem('gameCreator');
      socket.emit('checkGame', { gameId: trimmedId });
    } else {
      setError('Connection error. Please refresh the page.');
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <h1>Chappal vs Cockroach</h1>
      <div className="form-group">
        <label htmlFor="playerName">Your Name:</label>
        <input
          type="text"
          id="playerName"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          disabled={loading}
        />
      </div>

      <div className="button-group">
        <button 
          className="create-game-btn" 
          onClick={handleCreateGame}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create a Game'}
        </button>
      </div>

      <div className="join-section">
        <h2>Join Existing Game</h2>
        <div className="form-group">
          <label htmlFor="gameId">Game ID:</label>
          <input
            type="text"
            id="gameId"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Enter game ID"
            disabled={loading}
          />
        </div>
        <button 
          className="join-game-btn" 
          onClick={handleJoinGame}
          disabled={loading}
        >
          {loading ? 'Joining...' : 'Join Game'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Home;