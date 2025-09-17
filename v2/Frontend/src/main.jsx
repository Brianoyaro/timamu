import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import useAuthStore from './stores/authStore'

// Initialize auth state from stored tokens
useAuthStore.getState().initializeAuth();

createRoot(document.getElementById('root')).render(<App />)
