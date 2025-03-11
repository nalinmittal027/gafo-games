// src/components/Game.js - Enhanced version with dark/white card graphics
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

// Card graphics - simple ASCII art for now
const CARD_GRAPHICS = {
  // Chappal card graphics
  chappalWhite: `
   _________
  /         \\
 |  WHITE    |
 |  CHAPPAL  |
 |    👡     |
 |           |
 |___________|
  `,
  chappalDark: `
   _________
  /         \\
 |  DARK     |
 |  CHAPPAL  |
 |    👡     |
 |           |
 |___________|
  `,
  // Cockroach card graphics
  cockroachWhite: `
   _________
  /         \\
 | WHITE     |
 | COCKROACH |
 |    🪳     |
 |           |
 |___________|
  `,
  cockroachDark: `
   _________
  /         \\
 | DARK      |
 | COCKROACH |
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
    roundScores: {},
    currentRound: 1,
    waitingForNextCard: false,
    waitingForNextRound: false,
    gameOver: false
  });
  const [countdown, setCountdown] = useState(3);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [joinAttempted, setJoinAttempted] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [playedCards, setPlayedCards] = useState([]);
  const [pointsAnimation, setPointsAnimation] = useState(null);
  const [cardFeedback, setCardFeedback] = useState(null);

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

  // Function to handle discarding the current card (Bug Fix #3)
  const discardCurrentCard = () => {
    if (socket && gameState.showDiscardPrompt && gameState.currentCockroach) {
      socket.emit('discardCurrentCard', { gameId: normalizedGameId });
    }
  };

  // Effect to clear played cards when a new card is drawn
  useEffect(() => {
    // Clear played cards when a new card is drawn or when waiting for next card
    if (gameState.waitingForNextCard || !gameState.currentCockroach) {
      setPlayedCards([]);
    }
  }, [gameState.waitingForNextCard, gameState.currentCockroach]);

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
      
      // Reset countdown when a new card is shown
      if (state.waitingForNextCard) {
        setCountdown(3);
      }
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

    newSocket.on('cardPlayed', ({ playerName, cardInfo }) => {
      console.log(`${playerName} played a card:`, cardInfo);
      setPlayedCards(prev => [...prev, { playerName, cardInfo, timestamp: Date.now() }]);
    });
    
    newSocket.on('pointsAwarded', ({ playerName, points, round }) => {
      console.log(`${playerName} scored ${points} points in round ${round}`);
      // Show animation for points
      setPointsAnimation({
        playerName,
        points,
        timestamp: Date.now()
      });
      
      // Clear animation after 2 seconds
      setTimeout(() => {
        setPointsAnimation(null);
      }, 2000);
    });

    newSocket.on('cardFeedback', ({ message, type }) => {
      console.log(`Card feedback received: ${message} (${type})`);
      setCardFeedback({
        message,
        type,
        timestamp: Date.now()
      });
      
      // Clear feedback after 2 seconds
      setTimeout(() => {
        setCardFeedback(null);
      }, 2000);
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
      console.log('Requesting to start game or next round');
      socket.emit('startGame', { gameId: normalizedGameId });
    } else {
      console.log('Not allowed to start game, host status:', isHost);
    }
  };

  const playChappalCard = (cardIndex, isFlipped) => {
    if (socket && gameState.started && !gameState.waitingForNextCard && !gameState.gameOver && !gameState.waitingForNextRound) {
      socket.emit('playChappal', { 
        gameId: normalizedGameId, 
        playerName: currentPlayer.name, 
        cardIndex,
        isFlipped  // Pass whether the card is flipped (dark side)
      });
    }
  };

  // Countdown timer for next cockroach card
  useEffect(() => {
    let timer;
    // Only run timer when in waiting state
    if (gameState.started && gameState.waitingForNextCard && !gameState.gameOver && !gameState.waitingForNextRound) {
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
  }, [gameState.started, gameState.waitingForNextCard, gameState.gameOver, gameState.waitingForNextRound, socket, normalizedGameId]);

  // Function to get the current round rule text
  const getRoundRuleText = () => {
    switch (gameState.currentRound) {
      case 1:
        return "Round 1: HIGHER or EQUAL rule";
      case 2:
        return "Round 2: LOWER or EQUAL rule";
      case 3:
        return "Round 3: White Chappal (HIGHER), Dark Chappal (LOWER)";
      default:
        return "";
    }
  };

  // Function to get appropriate card graphic
  const getCardGraphic = (card, isFlipped) => {
    if (!card) return null;
    
    if (card.type === 'chappal') {
      return (
        <div className={`card-graphic chappal-${isFlipped ? 'dark' : 'white'}`}>
          <div className="card-image chappal-image">👡</div>
          <div className="card-value">{card.value}</div>
          <div className="card-color">{isFlipped ? 'Dark' : 'White'}</div>
        </div>
      );
    } else if (card.type === 'cockroach') {
      return (
        <div className={`card-graphic cockroach-${card.color}`}>
          <div className="card-image cockroach-image">🪳</div>
          <div className="card-value">{card.value}</div>
          <div className="card-color">{card.color.charAt(0).toUpperCase() + card.color.slice(1)}</div>
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
        <div className="card-graphic dummy-card">
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

      {gameState.started && !gameState.gameOver && !gameState.waitingForNextRound && (
        <div className="game-board">
          <div className="scoreboard">
            <h3>Round {gameState.currentRound} of 3</h3>
            <div className="round-rule">{getRoundRuleText()}</div>
            <div className="score-table">
              <table>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Round 1</th>
                    <th>Round 2</th>
                    <th>Round 3</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(gameState.scores).map(playerName => (
                    <tr key={playerName} className={playerName === currentPlayer?.name ? 'current-player-row' : ''}>
                      <td>{playerName} {playerName === currentPlayer?.name ? '(You)' : ''}</td>
                      <td>{gameState.roundScores?.[playerName]?.[0] || 0}</td>
                      <td>{gameState.roundScores?.[playerName]?.[1] || 0}</td>
                      <td>{gameState.roundScores?.[playerName]?.[2] || 0}</td>
                      <td className="total-score">{gameState.scores[playerName] || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="center-area">
            <div className="cockroach-deck">
              <h3>Cockroach Deck ({gameState.cockroachDeck} remaining)</h3>
              <div className="card card-back"></div>
            </div>

            {gameState.currentCockroach && (
              <div className="current-cockroach">
                <h3>Current Card</h3>
                <div 
                  className={`card ${gameState.currentCockroach.type === 'cockroach' ? 
                    `cockroach-card ${gameState.currentCockroach.color}-card` : 'dummy-card'}`}
                  onClick={gameState.showDiscardPrompt ? discardCurrentCard : undefined}
                >
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
                      <div className="card-color">
                        {gameState.currentCockroach.color === 'dark' ? 'Dark' : 'White'}
                      </div>
                    </>
                  )}
                  
                 {gameState.showDiscardPrompt && (
  <div className="discard-prompt-container">
    <button 
      className="discard-button"
      onClick={discardCurrentCard}
    >
      Click to discard
    </button>
  </div>
)}

{/* display card feedback to the player */}
{cardFeedback && (
  <div className={`card-feedback ${cardFeedback.type}`}>
    {cardFeedback.message}
  </div>
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

          {/* Display played cards */}
          {playedCards.length > 0 && (
            <div className="played-cards">
              <h4>Played Cards:</h4>
              <div className="played-cards-container">
                {playedCards.map((play, index) => (
                  <div key={index} className="played-card">
                    <div className={`mini-card chappal-${play.cardInfo.playedColor === 'dark' ? 'dark' : 'white'}`}>
                      <div className="mini-card-value">{play.cardInfo.value}</div>
                    </div>
                    <div className="played-by">{play.playerName}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Points animation */}
          {pointsAnimation && (
            <div className="points-animation">
              <div className="points-text">
                {pointsAnimation.playerName}: +{pointsAnimation.points} points!
              </div>
            </div>
          )}

          {/* Player's hand */}
          <div className="player-hand">
            <h3>Your Chappal Cards:</h3>
            <div className="hand">
              {currentPlayer?.chappalCards?.map((card, index) => (
                <div key={index} className="chappal-card-container">
                  <div
                    className={`card chappal-card ${gameState.waitingForNextCard ? 'disabled' : ''}`}
                  >
                    <div className="chappal-image">👡</div>
                    <div className="card-value">{card.value}</div>
                  </div>
                  <div className="chappal-card-buttons">
                    <button
                      className="play-white-btn"
                      onClick={() => playChappalCard(index, false)}
                      disabled={gameState.waitingForNextCard}
                    >
                      Play White
                    </button>
                    <button
                      className="play-dark-btn"
                      onClick={() => playChappalCard(index, true)}
                      disabled={gameState.waitingForNextCard}
                    >
                      Play Dark
                    </button>
                  </div>
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
                      {Array.from({ length: player.chappalCards?.length || 0 }).map((_, index) => (
                        <div key={index} className="card card-back small"></div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {gameState.waitingForNextRound && !gameState.gameOver && (
        <div className="round-transition">
          <h2>Round {gameState.currentRound} Completed!</h2>
          <div className="round-scores">
            <h3>Current Scores:</h3>
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Round {gameState.currentRound}</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(gameState.scores).map(playerName => (
                  <tr key={playerName} className={playerName === currentPlayer?.name ? 'current-player-row' : ''}>
                    <td>{playerName} {playerName === currentPlayer?.name ? '(You)' : ''}</td>
                    <td>{gameState.roundScores[playerName][gameState.currentRound - 1]}</td>
                    <td>{gameState.scores[playerName]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {isHost && (
            <div className="host-controls">
              <h3>Ready for Round {gameState.currentRound + 1}?</h3>
              <button onClick={startGame} className="start-round-btn">
                Start Round {gameState.currentRound + 1}
              </button>
            </div>
          )}
          
          {!isHost && (
            <p className="waiting-for-host">Waiting for the host to start the next round...</p>
          )}
        </div>
      )}

      {gameState.gameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <div className="final-scores">
            <h3>Final Scores:</h3>
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Round 1</th>
                  <th>Round 2</th>
                  <th>Round 3</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(gameState.scores)
                  .sort(([, a], [, b]) => b - a)
                  .map(([name], index) => (
                    <tr key={name} className={name === currentPlayer?.name ? 'current-player-row' : ''}>
                      <td>{index + 1}. {name} {name === currentPlayer?.name ? '(You)' : ''}</td>
                      <td>{gameState.roundScores[name][0] || 0}</td>
                      <td>{gameState.roundScores[name][1] || 0}</td>
                      <td>{gameState.roundScores[name][2] || 0}</td>
                      <td className="total-score">{gameState.scores[name]}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
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
        
        .card-color {
          font-size: 14px;
          margin-top: 5px;
          padding: 2px 8px;
          border-radius: 10px;
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .cockroach-card.dark-card {
          background: linear-gradient(145deg, #5D4037, #795548);
        }
        
        .cockroach-card.white-card {
          background: linear-gradient(145deg, #B0BEC5, #CFD8DC);
          color: #333;
        }
        
        .chappal-card {
          background: linear-gradient(145deg, #4682B4, #5F9EA0);
          color: white;
        }
        
        .chappal-card-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 0 10px;
        }
        
        .chappal-card-buttons {
          display: flex;
          gap: 5px;
          margin-top: 10px;
        }
        
        .play-white-btn {
          background-color: #ECEFF1;
          color: #333;
          border: none;
          padding: 5px 10px;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
        }
        
        .play-dark-btn {
          background-color: #5D4037;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
        }
        
        .play-white-btn:disabled, .play-dark-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .dummy-card-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        
        .dummy-card {
          background: linear-gradient(145deg, #FF9800, #FFA726);
          color: white;
        }
        
        .scoreboard {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 20px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }
        
        .round-rule {
          background-color: #303F9F;
          color: white;
          padding: 10px;
          border-radius: 5px;
          text-align: center;
          margin: 10px 0;
          font-weight: bold;
        }
        
        .score-table {
          overflow-x: auto;
        }
        
        .score-table table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        .score-table th, .score-table td {
          padding: 10px;
          text-align: center;
          border: 1px solid #ddd;
        }
        
        .score-table th {
          background-color: #303F9F;
          color: white;
        }
        
        .current-player-row {
          background-color: rgba(33, 150, 243, 0.1);
          font-weight: bold;
        }
        
        .total-score {
          font-weight: bold;
          color: #2196F3;
        }
        
        .round-transition {
          text-align: center;
          padding: 30px;
          background-color: rgba(33, 150, 243, 0.1);
          border-radius: 10px;
          margin: 20px 0;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        .round-scores {
          max-width: 600px;
          margin: 20px auto;
        }
        
        .round-scores table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .round-scores th, .round-scores td {
          padding: 10px;
          text-align: center;
          border: 1px solid #ddd;
        }
        
        .round-scores th {
          background-color: #303F9F;
          color: white;
        }
        
        .start-round-btn {
          background-color: #FF5722;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 20px;
          transition: all 0.3s;
        }
        
        .start-round-btn:hover {
          background-color: #E64A19;
          transform: translateY(-2px);
        }
        
        .waiting-for-host {
          margin-top: 20px;
          font-style: italic;
          color: #666;
        }

        /* Discard prompt styles */
        .discard-prompt {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 12px;
          font-weight: bold;
          animation: pulse 1s infinite;
          pointer-events: none;
        }
        
        /* Played cards styles */
        .played-cards {
          margin-top: 15px;
          text-align: center;
        }
        
        .played-cards h4 {
          margin-bottom: 10px;
        }
        
        .played-cards-container {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .played-card {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .mini-card {
          width: 60px;
          height: 90px;
          border-radius: 8px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 5px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .mini-card-value {
          font-size: 18px;
          font-weight: bold;
          background-color: rgba(255, 255, 255, 0.2);
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .chappal-white {
          background: linear-gradient(145deg, #4682B4, #5F9EA0);
          color: white;
        }
        
        .chappal-dark {
          background: linear-gradient(145deg, #5D4037, #795548);
          color: white;
        }
        
        .played-by {
          font-size: 12px;
          font-weight: bold;
        }
        
        /* Points animation */
        .points-animation {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1000;
          pointer-events: none;
        }
        
        .points-text {
          background-color: #4CAF50;
          color: white;
          padding: 15px 25px;
          border-radius: 10px;
          font-size: 24px;
          font-weight: bold;
          animation: pointsAppear 2s ease-out;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
  .discard-prompt-container {
    position: absolute;
    top: -50px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
  }
  
  .discard-button {
    background-color: #ff5722;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    animation: pulse 1s infinite;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    white-space: nowrap;
  }
  
  /* Card feedback styles */
  .card-feedback {
    position: fixed;
    top: 30%;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: bold;
    color: white;
    z-index: 1000;
    text-align: center;
    animation: fadeInOut 2s ease-in-out;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
  
  .card-feedback.success {
    background-color: #4CAF50;
  }
  
  .card-feedback.error {
    background-color: #f44336;
  }
  
  .card-feedback.info {
    background-color: #2196F3;
  }
  
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translate(-50%, -10px); }
    10% { opacity: 1; transform: translate(-50%, 0); }
    80% { opacity: 1; transform: translate(-50%, 0); }
    100% { opacity: 0; transform: translate(-50%, 10px); }
  }

        @keyframes pointsAppear {
          0% { transform: scale(0.5); opacity: 0; }
          20% { transform: scale(1.2); opacity: 1; }
          80% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Game;