import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import { useSocketStore } from './stores/socketStore'

function App() {
  const { loadUser, isAuthenticated, token } = useAuthStore((state) => ({
    loadUser: state.loadUser,
    isAuthenticated: state.isAuthenticated,
    token: state.token
  }));
  
  const { connect, disconnect } = useSocketStore();

  // Load user data on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Connect to socket when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('Connecting to socket server...');
      connect(token);
    } else {
      disconnect();
    }
    
    return () => {
      console.log('Disconnecting from socket server...');
      disconnect();
    };
  }, [isAuthenticated, token, connect, disconnect]);

  return null; // This component is now just for initialization, rendering is handled by Router
}

export default App
