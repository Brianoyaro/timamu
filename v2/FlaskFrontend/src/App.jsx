import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'

function App() {
  const { loadUser } = useAuthStore((state) => ({
    loadUser: state.loadUser
  }));

  // Load user data on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return null; // This component is now just for initialization, rendering is handled by Router
}

export default App
