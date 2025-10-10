import { api } from './api';
import { User } from './userService';

export interface Conversation {
  id: number;
  subject: string;
  createdAt: string;
  updatedAt: string;
  participants: User[];
  messages: Message[];
  hasUnreadMessages?: boolean;
}

export interface Message {
  id: number;
  content: string;
  createdAt: string;
  authorId: number; 
  author?: User;
  conversationId: number;
  file?: string;
  fileMimeType?: string;
}

export const getConversations = async (): Promise<Conversation[]> => {
  const { data } = await api.get('/messaging/conversations');
  return data;
};

export const getUnreadMessagesCount = async (): Promise<number> => {
  const { data } = await api.get('/messaging/conversations/unread-count');
  return data;
};

export const getMessages = async (conversationId: number): Promise<Message[]> => {
  const { data } = await api.get(`/messaging/conversations/${conversationId}/messages`);
  return data;
};

export const createConversation = async (subject: string, message: string, recipientId: number): Promise<Conversation> => {
  const { data } = await api.post('/messaging/conversations', { subject, message, recipientId });
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('messaging:conversationCreated', { detail: data }));
    }
  } catch (_e) {
    // ignore
  }
  return data;
};

export const createMessage = async (conversationId: number, content: string): Promise<Message> => {
  const { data } = await api.post(`/messaging/conversations/${conversationId}/messages`, { content });
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('messaging:messageCreated', { detail: data }));
    }
  } catch (_e) {
    // ignore
  }
  return data;
};

export const uploadFile = async (conversationId: number, file: File): Promise<Message> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post(`/messaging/conversations/${conversationId}/messages/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('messaging:messageCreated', { detail: data }));
    }
  } catch (_e) {}
  return data;
};

export const downloadFile = async (fileName: string) => {
  const { data } = await api.get(`/messaging/download/${fileName}`, {
    responseType: 'blob',
  });
  return data;
};
