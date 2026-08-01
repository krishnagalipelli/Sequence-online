const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const SequenceGame = require('./game');

const app = express();
app.use(cors());

// Serve static files from React app in production
app.use(express.static(path.join(__dirname, '../client/dist')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const games = {}; // roomId -> SequenceGame instance

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', (data) => {
    let roomId = typeof data === 'string' ? data : data.roomId;
    let sequencesToWin = typeof data === 'string' ? 2 : data.sequencesToWin;
    let playersCount = typeof data === 'string' ? 2 : data.playersCount;

    if (!games[roomId]) {
      games[roomId] = new SequenceGame();
      if (sequencesToWin) {
        games[roomId].sequencesToWin = parseInt(sequencesToWin) || 2;
      }
      if (playersCount) {
        games[roomId].playersCount = parseInt(playersCount) || 2;
      }
    }
    const game = games[roomId];
    
    if (game.players.length >= game.playersCount) {
      socket.emit('roomFull');
      return;
    }

    socket.join(roomId);
    socket.roomId = roomId; // Store for disconnect
    
    game.addPlayer(socket.id);
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    if (game.players.length === game.playersCount) {
      game.startGame();
    }

    // Send individual state
    game.players.forEach(pId => {
      io.to(pId).emit('gameState', game.getGameState(pId));
    });
  });

  socket.on('playMove', ({ roomId, card, row, col }) => {
    const game = games[roomId];
    if (game && game.started) {
      const success = game.playMove(socket.id, card, row, col);
      if (success) {
        // Send individual state
        game.players.forEach(pId => {
          io.to(pId).emit('gameState', game.getGameState(pId));
        });
      }
    }
  });

  socket.on('playAgain', ({ roomId }) => {
    const game = games[roomId];
    if (game && game.started && game.winner) {
      game.startGame(); // resets state and winner
      game.players.forEach(pId => {
        io.to(pId).emit('gameState', game.getGameState(pId));
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const roomId = socket.roomId;
    if (roomId && games[roomId]) {
      const game = games[roomId];
      game.removePlayer(socket.id);
      
      // Notify remaining players
      io.to(roomId).emit('playerLeft');
      
      // If room is empty, clean it up
      if (game.players.length === 0) {
        delete games[roomId];
      }
    }
  });
});

// Fallback for React Router (if needed)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
