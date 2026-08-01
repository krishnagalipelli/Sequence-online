import { useState } from 'react';

function Room({ onJoin }) {
  const [roomId, setRoomId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      onJoin(roomId.trim());
    }
  };

  return (
    <div className="room-container">
      <div className="room-card">
        <h2>Join or Create Game</h2>
        <p>Enter a room code to play with your friend.</p>
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Room Code (e.g. game123)" 
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            required
            autoFocus
          />
          <button type="submit">Play</button>
        </form>
      </div>
    </div>
  );
}

export default Room;
