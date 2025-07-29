import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function Home() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');

  const joinRoom = () => {
    if (roomId.trim()) {
      navigate(`/video-room/${roomId}`);
    }
  };

  return (
    <div>
      <h2>Join a Video Room</h2>
      <input type="text" value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Room ID" />
      <button onClick={joinRoom}>Join</button>
    </div>
  );
}

export default Home;

