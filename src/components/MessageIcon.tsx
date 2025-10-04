
'use client';

import { useEffect, useState } from 'react';
import { FaEnvelope } from 'react-icons/fa';
import { getUnreadMessagesCount } from '../services/messagingService';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function MessageIcon() {
  const { user } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const fetchUnreadCount = async () => {
        try {
          const count = await getUnreadMessagesCount();
          setUnreadCount(count);
        } catch (error) {
          console.error('Failed to fetch unread messages count:', error);
        }
      };

      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [user]);

  const handleClick = () => {
    if (user?.role === 'ADMIN') {
      router.push('/admin/messaging');
    } else if (user?.role === 'LEADER') {
      router.push('/leader/messaging');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="relative bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
    >
      <FaEnvelope />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>
  );
}
