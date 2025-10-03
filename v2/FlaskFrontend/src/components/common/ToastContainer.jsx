import { useToastStore } from '../../stores/toastStore';
import { useEffect, useState } from 'react';

const Toast = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);
  
  // Define background colors based on toast type
  const bgColor = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
  }[toast.type] || 'bg-blue-100 border-blue-400 text-blue-700';
  
  // Add more prominent styling for error messages
  const extraStyles = toast.type === 'error' 
    ? 'border-l-4 border-l-red-500 shadow-lg' 
    : toast.type === 'success' 
      ? 'border-l-4 border-l-green-500 shadow-md'
      : '';

  // Animation classes
  const animationClass = isExiting 
    ? 'animate-fade-out-right' 
    : 'animate-slide-in-right';

  // Handle auto-dismiss with exit animation
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        // Wait for animation to complete before actually removing
        setTimeout(() => onDismiss(toast.id), 300);
      }, toast.duration - 300); // Start animation before actual duration ends
      
      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.id, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    // Wait for animation to complete before removing from DOM
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div className="relative mb-2 max-w-md overflow-hidden pointer-events-auto">
      <div 
        className={`${bgColor} ${extraStyles} ${animationClass} border px-4 py-3 rounded-md shadow-md flex items-center justify-between`} 
        role="alert"
      >
        <div className="flex items-center">
          {toast.type === 'success' && (
            <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
          )}
          {toast.type === 'error' && (
            <svg className="w-5 h-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
            </svg>
          )}
          {toast.type === 'warning' && (
            <svg className="w-5 h-5 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
            </svg>
          )}
          {toast.type === 'info' && (
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd"></path>
            </svg>
          )}
          <span className="block sm:inline">{toast.message}</span>
        </div>
        {toast.dismissible && (
          <button
            onClick={handleDismiss}
            className="ml-4 hover:bg-gray-200 hover:bg-opacity-25 rounded-full p-1"
            aria-label="Dismiss"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        )}
      </div>
      
      {/* Progress bar for timed toasts */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 h-1 w-full">
          <div 
            className={`h-full ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' :
              toast.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ 
              width: '100%',
              animation: `shrink ${toast.duration / 1000}s linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
};

const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();
  
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col pointer-events-none">
      {toasts.map((toast) => (
        <Toast 
          key={toast.id} 
          toast={toast} 
          onDismiss={removeToast} 
        />
      ))}
    </div>
  );
};

export default ToastContainer;
