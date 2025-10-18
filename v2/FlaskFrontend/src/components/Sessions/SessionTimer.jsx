import { useState, useEffect } from 'react';
import { FiClock, FiAlertCircle } from 'react-icons/fi';

const SessionTimer = ({ scheduledAt, status }) => {
  const [timeDisplay, setTimeDisplay] = useState('');
  const [colorClass, setColorClass] = useState('text-gray-600');
  const [warning, setWarning] = useState('');
  
  useEffect(() => {
    if (!scheduledAt || !['scheduled', 'started'].includes(status)) {
      return;
    }
    
    const calculateTimeDisplay = () => {
      const now = new Date();
      const sessionTime = new Date(scheduledAt);
      const diffMs = sessionTime - now;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (status === 'scheduled') {
        if (diffMins > 60) {
          // More than an hour away
          const hours = Math.floor(diffMins / 60);
          const mins = diffMins % 60;
          setTimeDisplay(`Starts in ${hours}h ${mins}m`);
          setColorClass('text-gray-600');
          setWarning('');
        } else if (diffMins > 15) {
          // 15-60 minutes away
          setTimeDisplay(`Starts in ${diffMins} minutes`);
          setColorClass('text-blue-600');
          setWarning('');
        } else if (diffMins > 0) {
          // 0-15 minutes away - can join
          setTimeDisplay(`Starts in ${diffMins} minutes`);
          setColorClass('text-blue-600 font-medium');
          setWarning('Join window open - ready to join!');
        } else if (diffMins >= -15) {
          // Started up to 15 minutes ago
          setTimeDisplay(`Started ${Math.abs(diffMins)} minutes ago`);
          setColorClass('text-orange-600 font-medium');
          setWarning('Session has started - join now');
        } else if (diffMins >= -60) {
          // Started 15-60 minutes ago
          setTimeDisplay(`Started ${Math.abs(diffMins)} minutes ago`);
          setColorClass('text-red-600 font-medium');
          setWarning('Late join - may result in session forfeiture');
        } else {
          // Started more than 60 minutes ago
          setTimeDisplay('Session window expired');
          setColorClass('text-red-600');
          setWarning('Unable to join - session expired');
        }
      } else if (status === 'started') {
        // If session is already started, show running time
        const startedAgo = Math.abs(diffMins);
        setTimeDisplay(`Running for ${startedAgo} minutes`);
        setColorClass('text-green-600 font-medium');
        setWarning('');
      }
    };
    
    calculateTimeDisplay();
    const timer = setInterval(calculateTimeDisplay, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [scheduledAt, status]);
  
  if (!timeDisplay) return null;
  
  return (
    <div>
      <div className={`flex items-center gap-1 ${colorClass}`}>
        <FiClock className="h-4 w-4" />
        <span>{timeDisplay}</span>
      </div>
      
      {warning && (
        <div className="flex items-center gap-1 text-xs mt-1">
          <FiAlertCircle className="h-3 w-3" /> 
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
};

export default SessionTimer;