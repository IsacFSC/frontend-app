
'use client';

import { useEffect, useState, useCallback } from 'react';
import { FaEnvelope } from 'react-icons/fa';
import { getUnreadMessagesCount } from '../services/messagingService';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function MessageIcon() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await getUnreadMessagesCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread messages count:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();

      window.addEventListener('messaging:messageCreated', fetchUnreadCount);
      window.addEventListener('messaging:messagesRead', fetchUnreadCount);
      return () => {
        window.removeEventListener('messaging:messageCreated', fetchUnreadCount);
        window.removeEventListener('messaging:messagesRead', fetchUnreadCount);
      };
    }
  }, [user, fetchUnreadCount]);

  const handleClick = () => {
    if (user?.role === 'ADMIN') {
      router.push('/admin/messaging');
    } else if (user?.role === 'LEADER') {
      router.push('/leader/messaging');
    } else {
      // default for regular users
      router.push('/dashboard/messages');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="relative bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
    >
      <FaEnvelope className='w-6 h-6'/>
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>
  );
}
