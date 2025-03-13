// src/components/Home.js - Enhanced Game Creation Flow
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import io from 'socket.io-client';

const Home = () => {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socketStatus, setSocketStatus] = useState('disconnected');
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
          navigate(`/game/${urlGameId}`);
          return;
        } else {
          // We have game ID but need a name, store ID for later
          setGameId(urlGameId);
        }
      }
    }

    // Check for pending game ID from previous navigation
    const pendingGameId = localStorage.getItem('pendingGameId');
    if (pendingGameId) {
      setGameId(pendingGameId);
    }

    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
    }

    // Setup socket connection
    const connectSocket = () => {
      const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      console.log('Connecting to socket at:', SOCKET_URL);
      
      setSocketStatus('connecting');
      
      // Test the connection first with a fetch
      fetch(`${SOCKET_URL}/ping`)
        .then(response => response.text())
        .then(data => console.log('Server ping response:', data))
        .catch(err => {
          console.error('Server ping failed:', err);
          setSocketStatus('ping-failed');
        });
      
      const newSocket = io(SOCKET_URL, { 
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 10000,
        transports: ['websocket', 'polling']
      });
      
      newSocket.on('connect', () => {
        console.log('Socket connected successfully with ID:', newSocket.id);
        setSocketStatus('connected');
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError('Unable to connect to game server. Please try again.');
        setSocketStatus('error');
        setLoading(false);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setSocketStatus('disconnected');
      });

      // Listen for responses
      newSocket.on('gameCreated', ({ gameId }) => {
        console.log('Game created with ID:', gameId);
        
        // IMPORTANT: Set creator status BEFORE navigating
        localStorage.setItem('gameCreator', gameId);
        
        // Clear any pending game ID
        localStorage.removeItem('pendingGameId');
        
        // Give the server a moment to set up the game before joining
        setTimeout(() => {
          setLoading(false);
          navigate(`/game/${gameId}`);
        }, 500);
      });

      newSocket.on('gameExists', ({ exists, gameId: foundGameId }) => {
        console.log('Game exists response:', exists, foundGameId);
        setLoading(false);
        if (exists) {
          localStorage.removeItem('gameCreator'); // Not the creator
          localStorage.removeItem('pendingGameId'); // Clear pending ID
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

  // Function to test the connection
  const testConnection = () => {
    const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    console.log('Testing server connection to:', SOCKET_URL);
    
    fetch(`${SOCKET_URL}/ping`)
      .then(response => response.text())
      .then(data => {
        console.log('Server ping response:', data);
        alert(`Server responded: ${data}`);
      })
      .catch(err => {
        console.error('Server ping failed:', err);
        alert(`Failed to connect to server: ${err.message}`);
      });
  };

  const handleCreateGame = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');
    localStorage.setItem('playerName', playerName);
    
    if (socket && socket.connected) {
      console.log('Requesting to create game for:', playerName);
      // Clear any previous creator status
      localStorage.removeItem('gameCreator');
      socket.emit('createGame', { playerName });
    } else {
      console.error('Socket not connected, socket state:', socket?.connected);
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
    
    if (socket && socket.connected) {
      const trimmedId = gameId.trim().toUpperCase();
      console.log('Checking if game exists:', trimmedId);
      // Clear any previous creator status
      localStorage.removeItem('gameCreator');
      socket.emit('checkGame', { gameId: trimmedId });
    } else {
      console.error('Socket not connected, socket state:', socket?.connected);
      setError('Connection error. Please refresh the page.');
      setLoading(false);
    }
  };

  const generateGameLink = () => {
    if (!gameId.trim()) {
      setError('Please enter a game ID to generate a link');
      return;
    }
    
    const trimmedId = gameId.trim().toUpperCase();
    const gameLink = `${window.location.origin}/game/${trimmedId}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(gameLink)
      .then(() => {
        alert(`Game link copied to clipboard: ${gameLink}`);
      })
      .catch(err => {
        console.error('Could not copy link:', err);
        alert(`Game link (copy manually): ${gameLink}`);
      });
  };

  return (
    <div className="home-container">
      {/* Added navigation back to the games page */}
      <div className="back-to-games">
        <Link to="/" className="back-link">
          &larr; Back to Games
        </Link>
      </div>
      
      <h1>Chappal vs Cockroach</h1>
      
      <div className="socket-status">
        Connection: <span className={`status-${socketStatus}`}>{socketStatus}</span>
        <button onClick={testConnection} className="test-connection-btn">
          Test Connection
        </button>
      </div>
      
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
          disabled={loading || socketStatus !== 'connected'}
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
        <div className="join-actions">
          <button 
            className="join-game-btn" 
            onClick={handleJoinGame}
            disabled={loading || socketStatus !== 'connected'}
          >
            {loading ? 'Joining...' : 'Join Game'}
          </button>
          <button 
            className="generate-link-btn" 
            onClick={generateGameLink}
            disabled={!gameId.trim()}
          >
            Generate Game Link
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      <div className="game-rules">
        <h2>Game Rules</h2>
        <div className="rules-container">
          <h3>Game Mechanics</h3>
          <ul>
            <li>Each player gets chappal cards with values from 2-8.</li>
            <li>Each chappal card has two sides: white and dark.</li>
            <li>The game runs for 3 rounds with different rules in each round.</li>
            <li>In each round, cockroach cards (white or dark) are revealed one by one.</li>
            <li>Players must play a matching color chappal to defeat a cockroach.</li>
            <li>White chappal can only defeat white cockroach; dark chappal can only defeat dark cockroach.</li>
            <li>Dummy cards (safetypin, almond, etc.) provide no points and discard your chappal when played.</li>
          </ul>
          
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
      
      <style>{`
        /* Existing styles */
        .socket-status {
          margin: 10px 0 20px;
          font-size: 14px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
        }
        .status-connected { color: green; font-weight: bold; }
        .status-connecting { color: orange; }
        .status-disconnected, .status-error, .status-ping-failed { color: red; }
        .test-connection-btn {
          background-color: #607d8b;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 5px 10px;
          font-size: 12px;
          cursor: pointer;
        }
        .join-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }
        .generate-link-btn {
          background-color: #673AB7;
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          flex: 1;
        }
        .join-game-btn {
          flex: 1;
        }
        .game-rules {
          margin-top: 40px;
          text-align: left;
        }
        .rules-container {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 10px;
          margin-top: 15px;
        }
        .rules-container h3 {
          color: #FF5722;
          margin-top: 15px;
          margin-bottom: 10px;
        }
        .rules-container ul {
          padding-left: 20px;
        }
        .rules-container li {
          margin-bottom: 8px;
        }
        
        /* New styles for back navigation */
        .back-to-games {
          margin-bottom: 20px;
          text-align: left;
        }
        
        .back-link {
          display: inline-flex;
          align-items: center;
          color: #666;
          text-decoration: none;
          padding: 8px 12px;
          border-radius: 5px;
          transition: all 0.3s;
          font-weight: 600;
        }
        
        .back-link:hover {
          background-color: #f5f5f5;
          color: #ff5722;
          transform: translateX(-3px);
        }
        
        /* Ensure responsive layout for the back button */
        @media (max-width: 768px) {
          .back-to-games {
            margin-bottom: 15px;
          }
          
          .back-link {
            font-size: 0.9rem;
            padding: 6px 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;