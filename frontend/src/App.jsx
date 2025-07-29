import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import VideoRoom from './pages/VideoRoom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/video-room/:roomId" element={<VideoRoom />} />
      </Routes>
    </Router>
  );
}

export default App;

