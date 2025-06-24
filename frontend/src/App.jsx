// 📁 Dosya: frontend/src/App.jsx

import React, { useState } from 'react';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);

  const handleJoinSuccess = ({ roomId, team }) => {
    setRoomInfo({ roomId, team });
    setJoined(true);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🟪 Uzaktan Tabu</h1>
      {!joined ? (
        <Lobby onJoinSuccess={handleJoinSuccess} />
      ) : (
        <GameRoom roomInfo={roomInfo} />
      )}
    </div>
  );
};

export default App;
