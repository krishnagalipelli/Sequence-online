import { useState } from 'react';

function Room({ onJoin }) {
  const [roomId, setRoomId] = useState('');
  const [sequencesToWin, setSequencesToWin] = useState(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      onJoin({ roomId: roomId.trim(), sequencesToWin });
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
          <div className="settings-group">
            <label>Sequences to Win:</label>
            <select value={sequencesToWin} onChange={e => setSequencesToWin(Number(e.target.value))}>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
          <button type="submit">Play</button>
        </form>
      </div>
    </div>
  );
}

export default Room;
