import { useEffect } from 'react';
import useMessageStore from '../stores/messageStore';

const useUnreadMessages = () => {
  const { unreadCount, fetchUnreadCount } = useMessageStore();

  useEffect(() => {
    // Fetch initial unread count
    fetchUnreadCount();

    // Set up interval to periodically check for new messages
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // Check every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  return unreadCount;
};

export default useUnreadMessages;