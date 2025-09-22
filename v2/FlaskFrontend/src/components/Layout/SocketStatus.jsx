import { useState, useEffect } from 'react';
import { useSocketStore } from '../../stores/socketStore';

const SocketStatus = () => {
  const { isConnected } = useSocketStore();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    // Update the component when the connection status changes
    setLastUpdated(new Date());
  }, [isConnected]);

  return (
    <div className="fixed bottom-4 right-4 bg-white p-3 rounded-md shadow-lg border border-gray-200 z-50">
      <div className="flex items-center gap-2">
        <div 
          className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
        ></div>
        <span className="text-sm">
          Socket: {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default SocketStatus;