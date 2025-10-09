'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useMessaging } from '../hooks/useMessaging';

interface MessagingContextType {
  unreadCount: number;
  refreshUnreadCount: () => void;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const MessagingProvider = ({ children }: { children: ReactNode }) => {
  const messaging = useMessaging();

  return (
    <MessagingContext.Provider value={messaging}>
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessagingContext = () => {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessagingContext must be used within a MessagingProvider');
  }
  return context;
};
