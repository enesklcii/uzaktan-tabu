// 📁 Dosya: frontend/src/components/Lobby.jsx

import React, { useState } from 'react';
import socket from '../socket';

const Lobby = ({ onJoinSuccess }) => {
  const [roomId, setRoomId] = useState('');
  const [team, setTeam] = useState(null);
  const [error, setError] = useState('');

  const createRoom = () => {
    socket.emit('createRoom');
    socket.on('roomCreated', ({ roomId }) => {
      setRoomId(roomId);
      setTeam('A');
      onJoinSuccess({ roomId, team: 'A' });
    });
  };

  const joinRoom = () => {
    if (roomId.trim() === '') return;
    socket.emit('joinRoom', roomId);
    socket.on('joinedRoom', ({ roomId, team }) => {
      setTeam(team);
      onJoinSuccess({ roomId, team });
    });
    socket.on('joinError', (msg) => {
      setError(msg);
    });
  };

  return (
    <div>
      <h2>🎮 Tabu Lobisi</h2>
      <button onClick={createRoom}>Oda Oluştur</button>

      <div>
        <input
          type="text"
          placeholder="Oda Kodu"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button onClick={joinRoom}>Odaya Katıl</button>
      </div>

      {team && <p>Takım: {team}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Lobby;
