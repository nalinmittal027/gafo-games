// src/components/Game.js - Enhanced version with card graphics
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

// Card graphics - simple ASCII art for now
const CARD_GRAPHICS = {
  // Chappal card graphics
  chappal: `
   _________
  /         \\
 |  CHAPPAL  |
 |           |
 |    👡     |
 |           |
 |___________|
  `,
  // Cockroach card graphics
  cockroach: `
   _________
  /         \\
 | COCKROACH |
 |           |
 |    🪳     |
 |           |
 |___________|
  `,
  // Dummy cards graphics
  safetyPin: `
   _________
  /         \\
 |SAFETY PIN |
 |           |
 |    📌     |
 |           |
 |___________|
  `,
  almond: `
   _________
  /         \\
 |  ALMOND   |
 |           |
 |    🥜     |
 |           |
 |___________|
  `,
  button: `
   _________
  /         \\
 |  BUTTON   |
 |           |
 |    🔘     |
 |           |
 |___________|
  `,
  dogShit: `
   _________
  /         \\
 | DOG SHIT  |
 |           |
 |    💩     |
 |           |
 |___________|
  `,
  ant: `
   _________
  /         \\
 |    ANT    |
 |           |
 |    🐜     |
 |           |
 |___________|
  `,
};

const Game = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [gameState, setGameState] = useState({
    started: false,
    cockroachDeck: [],
    currentCockroach: null,
    discardPile: [],
    scores: {},
    waitingForNextCard: false,
    gameOver: false
  });
  const [countdown, setCountdown] = useState(3);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [joinAttempted, setJoinAttempted] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  // Normalized gameId for consistency
  const normalizedGameId = gameId?.trim().toUpperCase();

  // Join game function - separated for reuse
  const joinGame = useCallback((socket) => {
    const playerName = localStorage.getItem('playerName');
    // Check if this player created the game
    const isCreator = localStorage.getItem('gameCreator') === normalizedGameId;
    
    console.log(`Attempting to join game ${normalizedGameId} as ${playerName}, creator: ${isCreator}`);
    
    if (!playerName) {
      setError('Player name is required');
      return;
    }

    // Join the game room with creator status
    socket.emit('joinGame', { 
      gameId: normalizedGameId, 
      playerName,
      isCreator 
    });
    
    setJoinAttempted(true);
  }, [normalizedGameId]);

  // Connect to socket on component mount
  useEffect(() => {
    if (!normalizedGameId) {
      navigate('/');
      return;
    }
  
    const playerName = localStorage.getItem('playerName');
    if (!playerName) {
      localStorage.setItem('pendingGameId', normalizedGameId);
      navigate('/');
      return;
    }
  
    console.log(`Game component initialized for game: ${normalizedGameId}`);
    
    // Verify if this user is the creator of this game
    const isCreator = localStorage.getItem('gameCreator') === normalizedGameId;
    console.log('User is creator of this game:', isCreator);
    
    // Get the backend URL from environment variable or use local fallback
    const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    console.log('Connecting to socket at:', SOCKET_URL);
    
    // Test server connectivity
    fetch(`${SOCKET_URL}/ping`)
      .then(response => response.text())
      .then(data => console.log('Server ping response:', data))
      .catch(err => console.error('Server ping failed:', err));
    
    const newSocket = io(SOCKET_URL, {
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected successfully with ID:', newSocket.id);
      setConnected(true);
      setError('');
      
    // If the user is the creator, wait a bit before trying to join
    // This ensures the server has time to properly set up the game
    if (isCreator) {
      console.log('Creator is joining with short delay to ensure game is ready');
      setTimeout(() => {
        joinGame(newSocket);
      }, 500);
    } else {
      // Regular player joins immediately
      joinGame(newSocket);
    }
  });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Connection error: Unable to connect to game server');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      setConnected(true);
      setReconnecting(false);
      setError('');
      
      // Rejoin the game after reconnection
      joinGame(newSocket);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt ${attemptNumber}`);
      setReconnecting(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
      if (reason === 'io server disconnect') {
        // The server has forcefully disconnected the socket
        console.log('Reconnecting...');
        newSocket.connect();
      }
    });

    // Listen for game updates
    newSocket.on('gameState', (state) => {
      console.log('Received game state:', state);
      setGameState(state);
    });

    newSocket.on('playerList', (playerList) => {
      console.log('Received player list:', playerList);
      setPlayers(playerList);
    });

    newSocket.on('currentPlayer', (player) => {
      console.log('Received current player:', player);
      setCurrentPlayer(player);
      
      // Once we have player data, we're successfully joined
      setError('');
    });

    newSocket.on('hostStatus', (status) => {
      console.log('Received host status:', status);
      setIsHost(status.isHost);
    });

    newSocket.on('error', (errorMsg) => {
      console.error('Received error:', errorMsg);
      setError(errorMsg.message);
      
      // Special handling for "Game not found" error
      if (errorMsg.message === 'Game not found') {
        const isCreator = localStorage.getItem('gameCreator') === normalizedGameId;
        
        if (isCreator) {
          console.log('Game not found but we should be creator, creating it now...');
          const playerName = localStorage.getItem('playerName');
          if (playerName) {
            console.log('Requesting creation of game with ID:', normalizedGameId);
            newSocket.emit('createGame', { 
              playerName, 
              requestedId: normalizedGameId,
              forceCreate: true  // Special flag to force creation
            });
            
            // Add a listener for game creation confirmation
            newSocket.once('gameCreated', ({ gameId: createdId }) => {
              console.log('Game was created with ID:', createdId);
              if (createdId === normalizedGameId) {
                console.log('Successfully created and joined game');
                setError(''); // Clear the error
                joinGame(newSocket); // Try joining again
              }
            });
          }
        }
      }
    });

    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      console.log('Disconnecting socket');
      if (newSocket) newSocket.disconnect();
    };
  }, [normalizedGameId, navigate, joinGame]);

  // Function to attempt joining the game again
  const retryJoin = () => {
    if (socket && socket.connected) {
      console.log('Retrying game join...');
      joinGame(socket);
    } else {
      setError('Socket not connected. Please refresh the page.');
    }
  };

  const startGame = () => {
    if (socket && isHost) {
      console.log('Requesting to start game');
      socket.emit('startGame', { gameId: normalizedGameId });
    } else {
      console.log('Not allowed to start game, host status:', isHost);
    }
  };

  const playChappalCard = (cardIndex) => {
    if (socket && gameState.started && !gameState.waitingForNextCard && !gameState.gameOver) {
      socket.emit('playChappal', { 
        gameId: normalizedGameId, 
        playerName: currentPlayer.name, 
        cardIndex 
      });
    }
  };

  // Countdown timer for next cockroach card
// This code should be updated in your Game.js component

// Specifically, update the useEffect that handles the countdown timer:

// Countdown timer for next cockroach card
useEffect(() => {
  let timer;
  // Only run timer when in waiting state
  if (gameState.started && gameState.waitingForNextCard && !gameState.gameOver) {
    console.log("Starting countdown timer");
    timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          console.log("Timer reached zero, drawing next card");
          clearInterval(timer);
          socket.emit('nextCockroach', { gameId: normalizedGameId });
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
  }
  
  return () => {
    if (timer) {
      clearInterval(timer);
    }
  };
}, [gameState.started, gameState.waitingForNextCard, gameState.gameOver, socket, normalizedGameId]);


  // Function to get appropriate card graphic
  const getCardGraphic = (card) => {
    if (!card) return null;
    
    if (card.type === 'chappal') {
      return (
        <div className="card-graphic">
          <div className="card-image chappal-image">👡</div>
          <div className="card-value">{card.value}</div>
        </div>
      );
    } else if (card.type === 'cockroach') {
      return (
        <div className="card-graphic">
          <div className="card-image cockroach-image">🪳</div>
          <div className="card-value">{card.value}</div>
        </div>
      );
    } else if (card.type === 'dummy') {
      const dummyGraphics = {
        'safetyPin': '📌',
        'almond': '🥜',
        'button': '🔘',
        'dogShit': '💩',
        'ant': '🐜'
      };
      
      return (
        <div className="card-graphic">
          <div className="card-image dummy-image">{dummyGraphics[card.subtype] || '❓'}</div>
          <div className="card-name">{card.subtype}</div>
        </div>
      );
    }
    
    // Default fallback
    return <div className="card-value">{card.value}</div>;
  };

  // Display connection status if not connected
  if (!connected) {
    return (
      <div className="game-container">
        <header className="game-header">
          <h1>Chappal vs Cockroach</h1>
        </header>
        <div className="connecting-message">
          <h2>{reconnecting ? 'Reconnecting...' : 'Connecting to game...'}</h2>
          <p>Please wait while we connect to the game server.</p>
          {error && <div className="error-message">{error}</div>}
          <button onClick={() => navigate('/')} className="back-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Display error with retry option
  if (error === 'Game not found' && joinAttempted) {
    return (
      <div className="game-container">
        <header className="game-header">
          <h1>Chappal vs Cockroach</h1>
        </header>
        <div className="error-container">
          <h2>Game Not Found</h2>
          <p>The game with ID <strong>{normalizedGameId}</strong> could not be found.</p>
          <div className="error-actions">
            <button onClick={retryJoin} className="retry-button">
              Retry Join
            </button>
            <button onClick={() => navigate('/')} className="back-button">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <header className="game-header">
        <h1>Chappal vs Cockroach</h1>
        <div className="game-info">
          <p>Game ID: <span className="game-id">{normalizedGameId}</span></p>
          <button onClick={() => {
            const fullUrl = `${window.location.origin}/game/${normalizedGameId}`;
            navigator.clipboard.writeText(fullUrl);
            alert('Game link copied to clipboard!');
          }}>
            Share Game Link
          </button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {!gameState.started && (
        <div className="waiting-room">
          <h2>Waiting Room</h2>
          <div className="game-status">
            <p>Socket connected: {socket?.connected ? 'Yes' : 'No'}</p>
            <p>Players: {players.length}</p>
            <p>You are {isHost ? 'the host' : 'a player'}</p>
          </div>
          
          <div className="player-list">
            <h3>Players:</h3>
            {players.length === 0 ? (
              <p className="no-players">No players have joined yet.</p>
            ) : (
              <ul>
                {players.map((player) => (
                  <li key={player.id} className={player.isHost ? 'host-player' : ''}>
                    {player.name} {player.id === currentPlayer?.id ? '(You)' : ''}
                    {player.isHost ? ' (Host)' : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {isHost && players.length >= 2 && (
            <div className="host-controls">
              <p>You are the host and can start the game.</p>
              <button className="start-game-btn" onClick={startGame}>
                Start Game ({players.length} players)
              </button>
            </div>
          )}
          
          {isHost && players.length < 2 && (
            <div className="host-controls">
              <p>You are the host.</p>
              <p>Waiting for at least one more player to join...</p>
              <p>Share this link with other players:</p>
              <div className="share-link">
                {window.location.origin}/game/{normalizedGameId}
              </div>
            </div>
          )}
          
          {!isHost && (
            <p>Waiting for the host to start the game...</p>
          )}
          
          <button onClick={() => navigate('/')} className="back-button">
            Back to Home
          </button>
        </div>
      )}

{gameState.started && !gameState.gameOver && (
  <div className="game-board">
    <div className="player-info">
      <h3>Your Score: {gameState.scores[currentPlayer?.name] || 0}</h3>
    </div>

    <div className="center-area">
  <div className="cockroach-deck">
    <h3>Cockroach Deck ({gameState.cockroachDeck} remaining)</h3>
    <div className="card card-back"></div>
  </div>

  {gameState.currentCockroach && (
    <div className="current-cockroach">
      <h3>Current Cockroach</h3>
      <div className="card cockroach-card">
        {gameState.currentCockroach.type === 'dummy' ? (
          <div className="dummy-card-content">
            <div className="card-image">
              {gameState.currentCockroach.subtype === 'safetyPin' && '📌'}
              {gameState.currentCockroach.subtype === 'almond' && '🥜'}
              {gameState.currentCockroach.subtype === 'button' && '🔘'}
              {gameState.currentCockroach.subtype === 'dogShit' && '💩'}
              {gameState.currentCockroach.subtype === 'ant' && '🐜'}
            </div>
            <div className="card-name">{gameState.currentCockroach.subtype}</div>
          </div>
        ) : (
          <>
            <div className="cockroach-image">🪳</div>
            <div className="card-value">{gameState.currentCockroach.value}</div>
          </>
        )}
      </div>
    </div>
  )}

  {gameState.waitingForNextCard && (
    <div className="countdown">
      Next card in: {countdown}s
    </div>
  )}
</div>

    {/* Move player's hand right after center area */}
    <div className="player-hand">
      <h3>Your Chappal Cards:</h3>
      <div className="hand">
        {currentPlayer?.chappalCards?.map((card, index) => (
          <div
            key={index}
            className={`card chappal-card ${gameState.waitingForNextCard ? 'disabled' : ''}`}
            onClick={() => playChappalCard(index)}
          >
            <div className="chappal-image">👡</div>
            <div className="card-value">{card.value}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="opponent-area">
      <h3>Other Players:</h3>
      <div className="opponents">
        {players
          .filter(player => player.id !== currentPlayer?.id)
          .map(player => (
            <div key={player.id} className="opponent">
              <p>{player.name}: {gameState.scores[player.name] || 0} points</p>
              <div className="opponent-cards">
                {player.chappalCards?.map((_, index) => (
                  <div key={index} className="card card-back small"></div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  </div>
)}

      {gameState.gameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <div className="final-scores">
            <h3>Final Scores:</h3>
            <ul>
              {Object.entries(gameState.scores)
                .sort(([, a], [, b]) => b - a)
                .map(([name, score], index) => (
                  <li key={name}>
                    {index + 1}. {name}: {score} points
                    {name === currentPlayer?.name ? ' (You)' : ''}
                  </li>
                ))}
            </ul>
          </div>
          <button onClick={() => navigate('/')} className="back-to-home">Back to Home</button>
        </div>
      )}

      <style>{`
        .game-status {
          background-color: #f5f5f5;
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 15px;
          font-size: 14px;
        }
        .no-players {
          font-style: italic;
          color: #666;
        }
        .error-container {
          text-align: center;
          padding: 30px;
          background-color: #ffebee;
          border-radius: 8px;
          margin: 20px 0;
        }
        .error-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 20px;
        }
        .retry-button {
          background-color: #2196F3;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
        }
        
        /* Card graphics styling */
        .card-image {
          font-size: 40px;
          margin-bottom: 10px;
        }
        
        .card-value {
          font-size: 24px;
          font-weight: bold;
        }
        
        .card-name {
          font-size: 16px;
          margin-top: 5px;
        }
        
        .cockroach-card {
          background: linear-gradient(145deg, #8B4513, #A0522D);
        }
        
        .chappal-card {
          background: linear-gradient(145deg, #4682B4, #5F9EA0);
        }
        
        .dummy-card-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

export default Game;