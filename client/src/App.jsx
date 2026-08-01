import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Room from './components/Room';
import Board from './components/Board';
import Hand from './components/Hand';
import './App.css';

const socket = io(import.meta.env.VITE_SERVER_URL || '/');

function App() {
  const [gameState, setGameState] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    socket.on('gameState', (state) => {
      setGameState(state);
      setError('');
    });

    socket.on('roomFull', () => {
      setError('Room is full.');
      setIsInRoom(false);
    });

    socket.on('playerLeft', () => {
      setError('Opponent left the game.');
      setGameState(null);
    });

    return () => {
      socket.off('gameState');
      socket.off('roomFull');
      socket.off('playerLeft');
    };
  }, []);

  const handleJoin = (id) => {
    setRoomId(id);
    socket.emit('joinRoom', id);
    setIsInRoom(true);
  };

  const handlePlayMove = (card, row, col) => {
    socket.emit('playMove', { roomId, card, row, col });
  };

  return (
    <div className="app-container">
      <header>
        <h1>Sequence</h1>
        {isInRoom && <div className="room-info">Room: {roomId}</div>}
      </header>

      {error && <div className="error-banner">{error}</div>}

      {!isInRoom ? (
        <Room onJoin={handleJoin} />
      ) : (
        <main className="game-area">
          {!gameState || !gameState.started ? (
            <div className="waiting-message">
              <h2>Waiting for opponent...</h2>
              <p>Open another tab or device and join Room <strong>{roomId}</strong></p>
            </div>
          ) : (
            <div className="game-layout">
              <div className="board-section">
                <div className="status-panel">
                  {gameState.winner ? (
                    <h2 className="winner-msg">
                      {gameState.winner === socket.id ? 'You Won! 🎉' : 'Opponent Won! 😢'}
                    </h2>
                  ) : (
                    <h2 className="turn-indicator">
                      {gameState.players[gameState.turn] === socket.id ? "Your Turn" : "Opponent's Turn"}
                    </h2>
                  )}
                  
                  <div className="players-info">
                    <div className={`player-badge p0 ${gameState.turn === 0 ? 'active' : ''}`}>
                      Player 1 {gameState.players[0] === socket.id ? '(You)' : ''}
                    </div>
                    <div className={`player-badge p1 ${gameState.turn === 1 ? 'active' : ''}`}>
                      Player 2 {gameState.players[1] === socket.id ? '(You)' : ''}
                    </div>
                  </div>
                </div>

                <Board 
                  gameState={gameState} 
                  playerId={socket.id} 
                  onPlayMove={handlePlayMove}
                />
              </div>
              
              <div className="hand-section">
                <Hand 
                  cards={gameState.myHand} 
                  isMyTurn={gameState.players[gameState.turn] === socket.id && !gameState.winner}
                />
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

export default App;
