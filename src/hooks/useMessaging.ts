
'use client';

import { useEffect, useState, useCallback } from 'react';
import { getUnreadMessagesCount } from '../services/messagingService';
import { useAuth } from './useAuth';

export const useMessaging = () => {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const count = await getUnreadMessagesCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread messages count:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUnreadCount();

    const handleMessageCreated = () => {
      fetchUnreadCount();
    };

    window.addEventListener('messaging:messageCreated', handleMessageCreated);

    return () => {
      window.removeEventListener('messaging:messageCreated', handleMessageCreated);
    };
  }, [fetchUnreadCount]);

  return { unreadCount, refreshUnreadCount: fetchUnreadCount };
};
