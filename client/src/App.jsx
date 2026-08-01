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

  const handleJoin = (data) => {
    const id = typeof data === 'string' ? data : data.roomId;
    setRoomId(id);
    socket.emit('joinRoom', data);
    setIsInRoom(true);
  };

  const handlePlayAgain = () => {
    socket.emit('playAgain', { roomId });
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
              <h2>Waiting for others to join... ({gameState?.players?.length || 1}/{gameState?.playersCount || 2})</h2>
              <p>Share this Room Code: <strong>{roomId}</strong></p>
            </div>
          ) : (
            <div className="game-layout">
              <div className="board-section">
                <div className="status-panel">
                  <h2 className="turn-indicator">
                    {gameState.players[gameState.turn] === socket.id ? "Your Turn" : "Opponent's Turn"}
                  </h2>
                  
                  <div className="players-info">
                    {Array.from({ length: gameState.playersCount }).map((_, idx) => (
                      <div key={idx} className={`player-badge p${idx} ${gameState.turn === idx ? 'active' : ''}`}>
                        Player {idx + 1} {gameState.players[idx] === socket.id ? '(You)' : ''} 
                        <span className="score"> {gameState.scores ? gameState.scores[idx] : 0}/{gameState.sequencesToWin || 2}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {gameState.winner && (
                  <div className="victory-modal">
                    <div className="victory-content">
                      <h2>{gameState.winner === socket.id ? 'You Won! 🎉' : 'Opponent Won! 😢'}</h2>
                      <p>Sequences completed: {gameState.winner === socket.id ? gameState.scores[gameState.playerIndex] : gameState.scores[1 - gameState.playerIndex]}</p>
                      <button onClick={handlePlayAgain} className="play-again-btn">Play Again</button>
                    </div>
                  </div>
                )}

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
