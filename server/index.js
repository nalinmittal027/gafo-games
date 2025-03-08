const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(cors());

// Add this to debug connection issues
app.get('/ping', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.send('pong');
});

// Game state storage
const games = {};

// Debug endpoint to list all active games
app.get('/games', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const gamesList = {};
  
  for (const gameId in games) {
    gamesList[gameId] = {
      started: games[gameId].started,
      playerCount: games[gameId].players.length,
      createdAt: games[gameId].created
    };
  }
  
  res.json(gamesList);
});

// Debug endpoint to get details about a specific game
app.get('/game/:id', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  // Convert to uppercase for consistent lookup
  const gameId = req.params.id.toUpperCase();
  const game = games[gameId];
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  // Return safer version without sensitive data
  const safeGame = {
    id: game.id,
    started: game.started,
    created: game.created,
    players: game.players.map(p => ({ 
      name: p.name, 
      isHost: p.isHost,
      cardCount: p.chappalCards?.length || 0
    })),
    cockroachDeckSize: game.cockroachDeck.length,
    hasCurrentCockroach: !!game.currentCockroach,
    scores: game.scores,
    waitingForNextCard: game.waitingForNextCard,
    gameOver: game.gameOver
  };
  
  res.json(safeGame);
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Generate Cockroach deck with improved distribution (1-9) and dummy cards
const generateCockroachDeck = (playerCount) => {
  const deck = [];
  const cardCount = {
    2: 18,
    3: 24,
    4: 30,
    5: 35,
    6: 40,
    7: 45,
    8: 50
  }[playerCount] || 18;

  // Calculate number of regular cards and dummy cards
  const regularCardCount = Math.floor(cardCount * 0.75); // 75% regular cards
  const dummyCardCount = cardCount - regularCardCount;   // 25% dummy cards
  
  console.log(`Generating deck with ${regularCardCount} regular cards and ${dummyCardCount} dummy cards`);

  // Create regular cockroach cards (numbers 1-9 with equal distribution)
  const cardsPerNumber = Math.ceil(regularCardCount / 9);
  for (let i = 1; i <= 9; i++) {
    for (let j = 0; j < cardsPerNumber; j++) {
      if (deck.length < regularCardCount) {
        deck.push({ 
          type: 'cockroach',
          value: i, 
          id: uuidv4() 
        });
      }
    }
  }

  // Add dummy cards
  const dummyTypes = ['safetyPin', 'almond', 'button', 'dogShit', 'ant'];
  for (let i = 0; i < dummyCardCount; i++) {
    const subtype = dummyTypes[i % dummyTypes.length];
    deck.push({
      type: 'dummy',
      subtype: subtype,
      id: uuidv4()
    });
  }

  // Shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  console.log(`Generated deck of ${deck.length} cards`);
  return deck.slice(0, cardCount);
};

// Generate Chappal cards with values 2-8
const generateChappalCards = () => {
  const cards = [];
  for (let i = 2; i <= 8; i++) {
    cards.push({ 
      type: 'chappal',
      value: i, 
      id: uuidv4() 
    });
  }
  return cards;
};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Create a new game
  socket.on('createGame', ({ playerName, requestedId }) => {
    const trimmedName = playerName.trim();
    
    if (!trimmedName) {
      socket.emit('error', { message: 'Player name cannot be empty' });
      return;
    }
    
    // Use requested ID if provided, otherwise generate one
    let gameId = requestedId;
    if (!gameId) {
      // Generate a simpler game ID that's easier to type and remember
      gameId = Math.random().toString(36).substring(2, 7).toUpperCase();
    }
    
    console.log(`Creating new game with ID: "${gameId}"`);
    
    // Check if this game ID already exists
    if (games[gameId]) {
      console.log(`Game ID collision detected: ${gameId}`);
      socket.emit('error', { message: 'Please try again' });
      return;
    }
    
    // Create the game with this socket as host
    games[gameId] = {
      id: gameId,
      players: [{
        id: socket.id,
        name: trimmedName,
        chappalCards: [],
        isHost: true
      }],
      creatorId: socket.id,
      created: Date.now(),
      started: false,
      cockroachDeck: [],
      currentCockroach: null,
      discardPile: [],
      scores: {},
      waitingForNextCard: false,
      gameOver: false
    };
  
    // Initialize player score
    games[gameId].scores[trimmedName] = 0;
    
    // Join the game room
    socket.join(gameId);
    
    console.log(`Game created: ${gameId} by ${trimmedName}`);
    socket.emit('gameCreated', { gameId });
  });

  // Check if game exists
  socket.on('checkGame', ({ gameId }) => {
    console.log(`Checking game - Received ID: "${gameId}"`);
    console.log(`Game ID type: ${typeof gameId}`);
    console.log(`Game ID length: ${gameId?.length}`);
    
    if (!gameId) {
      console.log('No game ID provided');
      socket.emit('gameExists', { exists: false });
      return;
    }
    
    // Normalize game ID for consistency
    const trimmedId = gameId.trim().toUpperCase();
    console.log(`Normalized game ID: ${trimmedId}`);
    
    const game = games[trimmedId];
    const exists = !!game;
    
    if (exists) {
      console.log(`Game found: ${trimmedId}, started: ${game.started}`);
      
      // Only allow joining games that haven't started
      if (game.started) {
        socket.emit('error', { message: 'Game has already started' });
        return;
      }
      
      socket.emit('gameExists', { 
        exists: true, 
        gameId: trimmedId 
      });
    } else {
      console.log(`Game not found: ${trimmedId}`);
      socket.emit('gameExists', { exists: false });
    }
  });

  // Join an existing game
  socket.on('joinGame', ({ gameId, playerName, isCreator }) => {
    console.log(`Join attempt: ${playerName} to ${gameId}, creator: ${isCreator}`);
    
    if (!gameId || !playerName) {
      socket.emit('error', { message: 'Invalid game ID or player name' });
      return;
    }
    
    // Normalize game ID and name for consistency
    const trimmedId = gameId.trim().toUpperCase();
    const trimmedName = playerName.trim();
    
    console.log(`Normalized game ID: ${trimmedId}`);
    
    const game = games[trimmedId];
    
    if (!game) {
      console.log(`Game not found: ${trimmedId}`);
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (game.started) {
      socket.emit('error', { message: 'Game already started' });
      return;
    }

    if (game.players.length >= 8) {
      socket.emit('error', { message: 'Game is full' });
      return;
    }

    // Join the game room
    socket.join(trimmedId);

    // Handle creator status logic
    let playerIsHost = false;
    
    // If this is the creator reconnecting or the original creator
    if (isCreator === true) {
      console.log(`Player ${trimmedName} is joining as the creator`);
      playerIsHost = true;
      game.creatorId = socket.id;
    } else if (socket.id === game.creatorId) {
      console.log(`Player ${trimmedName} is the original creator`);
      playerIsHost = true;
    }
    // If no host exists, make this player the host
    else if (!game.players.some(p => p.isHost)) {
      console.log(`No host exists, making ${trimmedName} the host`);
      playerIsHost = true;
      game.creatorId = socket.id;
    }

    // Check if player already exists (by name)
    const existingPlayerIndex = game.players.findIndex(p => p.name === trimmedName);
    
    if (existingPlayerIndex === -1) {
      // Add new player to the game
      game.players.push({
        id: socket.id,
        name: trimmedName,
        chappalCards: [],
        isHost: playerIsHost
      });
      
      // Initialize player score
      game.scores[trimmedName] = 0;
    } else {
      // Update existing player's socket ID and host status if needed
      game.players[existingPlayerIndex].id = socket.id;
      if (playerIsHost) {
        game.players[existingPlayerIndex].isHost = true;
      }
    }

    // Make sure at least one player is a host
    const hasHost = game.players.some(p => p.isHost);
    if (!hasHost && game.players.length > 0) {
      console.log(`Ensuring a host exists, setting ${game.players[0].name}`);
      game.players[0].isHost = true;
      game.creatorId = game.players[0].id;
      
      if (game.players[0].id === socket.id) {
        playerIsHost = true;
      }
    }

    // Inform the client about their host status
    socket.emit('hostStatus', { isHost: playerIsHost });
    console.log(`Set host status for ${trimmedName}: ${playerIsHost}`);

    // Send current player info
    const currentPlayer = game.players.find(p => p.id === socket.id);
    socket.emit('currentPlayer', currentPlayer);

    // Send updated player list to all players in the game
    io.to(trimmedId).emit('playerList', game.players);
    
    // Ensure discardPile is defined and initialized
    if (!Array.isArray(game.discardPile)) {
      game.discardPile = [];
    }
    
    // Send game state
    io.to(trimmedId).emit('gameState', {
      started: game.started,
      cockroachDeck: game.cockroachDeck.length,
      currentCockroach: game.currentCockroach,
      discardPile: game.discardPile.length,
      scores: game.scores,
      waitingForNextCard: game.waitingForNextCard,
      gameOver: game.gameOver
    });

    console.log(`${trimmedName} joined game ${trimmedId}, host: ${playerIsHost}`);
  });

  // Start the game
  socket.on('startGame', ({ gameId }) => {
    console.log(`Attempt to start game: ${gameId}`);
    
    // Normalize game ID
    const trimmedId = gameId.trim().toUpperCase();
    const game = games[trimmedId];
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (game.started) {
      socket.emit('error', { message: 'Game already started' });
      return;
    }

    if (game.players.length < 2) {
      socket.emit('error', { message: 'Need at least 2 players to start' });
      return;
    }

    if (game.players.length > 8) {
      socket.emit('error', { message: 'Maximum 8 players allowed' });
      return;
    }

    // Check if requesting socket is the game host
    const player = game.players.find(p => p.id === socket.id);
    
    if (!player || !player.isHost) {
      console.log('Only host can start game');
      socket.emit('error', { message: 'Only the host can start the game' });
      return;
    }

    console.log(`Starting game ${trimmedId} with ${game.players.length} players`);
    
    // Generate and distribute cards
    game.started = true;
    game.cockroachDeck = generateCockroachDeck(game.players.length);
    
    // Give each player their Chappal cards
    game.players.forEach(player => {
      player.chappalCards = generateChappalCards();
    });

    // Initialize waiting for next card
    game.waitingForNextCard = true;
    
    // Ensure discardPile is initialized
    if (!Array.isArray(game.discardPile)) {
      game.discardPile = [];
    }

    // Send updated game state to all players
    io.to(trimmedId).emit('gameState', {
      started: game.started,
      cockroachDeck: game.cockroachDeck.length,
      currentCockroach: game.currentCockroach,
      discardPile: game.discardPile.length,
      scores: game.scores,
      waitingForNextCard: game.waitingForNextCard,
      gameOver: game.gameOver
    });

    // Update each player with their cards
    game.players.forEach(player => {
      io.to(player.id).emit('currentPlayer', player);
    });

    // Send player list to everyone
    io.to(trimmedId).emit('playerList', game.players);

    console.log(`Game ${trimmedId} started with ${game.players.length} players`);
  });

  // Draw next cockroach card
  socket.on('nextCockroach', ({ gameId }) => {
    // Normalize game ID
    const trimmedId = gameId.trim().toUpperCase();
    const game = games[trimmedId];
    
    if (!game || !game.started || !game.waitingForNextCard) {
      return;
    }
  
    // Check if there are cockroach cards left
    if (game.cockroachDeck.length === 0) {
      game.gameOver = true;
      io.to(trimmedId).emit('gameState', {
        started: game.started,
        cockroachDeck: game.cockroachDeck.length,
        currentCockroach: game.currentCockroach,
        discardPile: game.discardPile.length || 0,
        scores: game.scores,
        waitingForNextCard: false,
        gameOver: game.gameOver
      });
      return;
    }
  
    // Draw the next cockroach card
    game.currentCockroach = game.cockroachDeck.pop();
    game.waitingForNextCard = false;
  
    // Log what type of card was drawn
    if (game.currentCockroach.type === 'dummy') {
      console.log(`Game ${trimmedId}: Drew a dummy card: ${game.currentCockroach.subtype}`);
    } else {
      console.log(`Game ${trimmedId}: Drew a cockroach card with value ${game.currentCockroach.value}`);
    }
  
    // Send updated game state to all players
    io.to(trimmedId).emit('gameState', {
      started: game.started,
      cockroachDeck: game.cockroachDeck.length,
      currentCockroach: game.currentCockroach,
      discardPile: game.discardPile.length || 0,
      scores: game.scores,
      waitingForNextCard: false,
      gameOver: game.gameOver
    });

    console.log(`Game ${trimmedId}: New cockroach card drawn: ${game.currentCockroach.value}`);
  });

  // Play chappal card
  socket.on('playChappal', ({ gameId, playerName, cardIndex }) => {
    // Normalize game ID
    const trimmedId = gameId.trim().toUpperCase();
    const game = games[trimmedId];
    
    if (!game || !game.started || game.waitingForNextCard || game.gameOver) {
      return;
    }
  
    const player = game.players.find(p => p.name === playerName);
    if (!player || player.id !== socket.id) {
      return;
    }
  
    if (cardIndex < 0 || cardIndex >= player.chappalCards.length) {
      return;
    }
  
    const chappalCard = player.chappalCards[cardIndex];
    const cockroachCard = game.currentCockroach;
  
    // Remove the played chappal card
    player.chappalCards.splice(cardIndex, 1);
  
    // Process the play - special handling for dummy cards
    if (cockroachCard.type === 'dummy') {
      // Player automatically wins against dummy cards
      game.scores[playerName] += 1; // Award 1 point for dummy cards
      console.log(`${playerName} found ${cockroachCard.subtype} and scored 1 point!`);
    } else if (chappalCard.value >= cockroachCard.value) {
      // Player scores points for regular cockroach
      game.scores[playerName] += cockroachCard.value;
      console.log(`${playerName} scored ${cockroachCard.value} points!`);
    }
  
    // Ensure discardPile is initialized
    if (!Array.isArray(game.discardPile)) {
      game.discardPile = [];
    }
    
    // Add both cards to discard pile
    game.discardPile.push(chappalCard, cockroachCard);
    game.currentCockroach = null;
  
    // Check if the game is over
    const allChappalCardsPlayed = game.players.every(p => p.chappalCards.length === 0);
    
    if (allChappalCardsPlayed || game.cockroachDeck.length === 0) {
      game.gameOver = true;
    } else {
      // Prepare for next card
      game.waitingForNextCard = true;
    }
  
    // Send updated game state to all players
    io.to(trimmedId).emit('gameState', {
      started: game.started,
      cockroachDeck: game.cockroachDeck.length,
      currentCockroach: game.currentCockroach,
      discardPile: game.discardPile.length,
      scores: game.scores,
      waitingForNextCard: game.waitingForNextCard,
      gameOver: game.gameOver
    });
  
    // Update player's hand
    io.to(player.id).emit('currentPlayer', player);
  
    // Update player list for everyone
    io.to(trimmedId).emit('playerList', game.players);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find games that this socket is participating in
    for (const gameId in games) {
      const game = games[gameId];
      const playerIndex = game.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        const playerName = game.players[playerIndex].name;
        const wasHost = game.players[playerIndex].isHost;
        
        // Remove player from the game
        game.players.splice(playerIndex, 1);
        
        // If no players left, delete the game
        if (game.players.length === 0) {
          delete games[gameId];
          console.log(`Game ${gameId} deleted as all players left`);
        } else if (wasHost && !game.started) {
          // If the host left and game hasn't started, assign new host
          if (game.players.length > 0) {
            game.players[0].isHost = true;
            game.creatorId = game.players[0].id;
            
            // Notify the new host
            io.to(game.players[0].id).emit('hostStatus', { isHost: true });
            console.log(`New host assigned for game ${gameId}: ${game.players[0].name}`);
          }
          
          // Update player list for remaining players
          io.to(gameId).emit('playerList', game.players);
        } else {
          // Update player list for remaining players
          io.to(gameId).emit('playerList', game.players);
        }
        
        console.log(`${playerName} left game ${gameId}`);
      }
    }
  });
});

app.get('/games/debug', (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  const gamesList = Object.keys(games).map(id => ({
    id: id,
    idLength: id.length,
    normalized: id.toUpperCase(),
    players: games[id].players.length,
    started: games[id].started,
    createdAt: new Date(games[id].created).toISOString()
  }));
  
  res.json({
    totalGames: gamesList.length,
    games: gamesList,
    gamesObject: games
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});