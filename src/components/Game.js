// src/components/Game.js - Critical Error Fixes
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

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
  const [attemptedJoin, setAttemptedJoin] = useState(false);

  // Connect to socket on component mount
  useEffect(() => {
    const playerName = localStorage.getItem('playerName');
    // Check if this player created the game
    const isCreator = localStorage.getItem('gameCreator') === gameId;
    
    if (!playerName) {
      localStorage.setItem('pendingGameId', gameId);
      navigate('/');
      return;
    }

    console.log('Connecting to socket, creator status:', isCreator, 'for game:', gameId);
    
    // Get the backend URL from environment variable or use local fallback
    const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    
    // First test connectivity with a fetch
    fetch(`${SOCKET_URL}/ping`)
      .then(response => response.text())
      .then(data => console.log('Server ping response:', data))
      .catch(err => console.error('Server ping failed:', err));
    
    const newSocket = io(SOCKET_URL, {
      forceNew: true,
      reconnectionAttempts: 5,
      timeout: 10000
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      setConnected(true);
      setAttemptedJoin(true);
      
      // Join the game room with creator status
      newSocket.emit('joinGame', { 
        gameId, 
        playerName,
        isCreator 
      });
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Connection error: Unable to connect to game server');
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
      
      // If we get "game not found" error, check if we're supposed to be the creator
      if (errorMsg.message === 'Game not found' && isCreator) {
        console.log('Game not found but we should be creator, creating it now...');
        newSocket.emit('createGame', { playerName });
      }
    });

    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      console.log('Disconnecting socket');
      if (newSocket) newSocket.disconnect();
    };
  }, [gameId, navigate]);

  // Special effect to handle case where game isn't found but we should create it
  useEffect(() => {
    if (connected && attemptedJoin && error === 'Game not found' && socket) {
      const playerName = localStorage.getItem('playerName');
      const isCreator = localStorage.getItem('gameCreator') === gameId;
      
      if (isCreator && playerName) {
        console.log('Attempting to create the game as we should be the creator');
        socket.emit('createGame', { playerName });
        setError('');
      }
    }
  }, [connected, attemptedJoin, error, socket, gameId]);

  const startGame = () => {
    if (socket && isHost) {
      console.log('Requesting to start game');
      socket.emit('startGame', { gameId });
    } else {
      console.log('Not allowed to start game, host status:', isHost);
    }
  };

  const playChappalCard = (cardIndex) => {
    if (socket && gameState.started && !gameState.waitingForNextCard && !gameState.gameOver) {
      socket.emit('playChappal', { 
        gameId, 
        playerName: currentPlayer.name, 
        cardIndex 
      });
    }
  };

  // Countdown timer for next cockroach card
  useEffect(() => {
    let timer;
    if (gameState.started && gameState.waitingForNextCard && !gameState.gameOver) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            socket.emit('nextCockroach', { gameId });
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState.started, gameState.waitingForNextCard, gameState.gameOver, socket, gameId]);

  // Display connection status if not connected
  if (!connected) {
    return (
      <div className="game-container">
        <header className="game-header">
          <h1>Chappal vs Cockroach</h1>
        </header>
        <div className="connecting-message">
          <h2>Connecting to game...</h2>
          <p>Please wait while we connect to the game server.</p>
          {error && <div className="error-message">{error}</div>}
          <button onClick={() => navigate('/')} className="back-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <header className="game-header">
        <h1>Chappal vs Cockroach</h1>
        <div className="game-info">
          <p>Game ID: <span className="game-id">{gameId}</span></p>
          <button onClick={() => {
            const fullUrl = `${window.location.origin}/game/${gameId}`;
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
          <div className="player-list">
            <h3>Players:</h3>
            <ul>
              {players.map((player) => (
                <li key={player.id} className={player.isHost ? 'host-player' : ''}>
                  {player.name} {player.id === currentPlayer?.id ? '(You)' : ''}
                  {player.isHost ? ' (Host)' : ''}
                </li>
              ))}
            </ul>
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
                {window.location.origin}/game/{gameId}
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
                  {gameState.currentCockroach.value}
                </div>
              </div>
            )}

            {gameState.waitingForNextCard && (
              <div className="countdown">
                Next card in: {countdown}s
              </div>
            )}
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

          <div className="player-hand">
            <h3>Your Chappal Cards:</h3>
            <div className="hand">
              {currentPlayer?.chappalCards?.map((card, index) => (
                <div
                  key={index}
                  className={`card chappal-card ${gameState.waitingForNextCard ? 'disabled' : ''}`}
                  onClick={() => playChappalCard(index)}
                >
                  {card.value}
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
    </div>
  );
};

export default Game;