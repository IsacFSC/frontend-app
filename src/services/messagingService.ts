import { api } from './api';

export interface Conversation {
  id: number;
  subject: string;
  createdAt: string;
  updatedAt: string;
  participants: any[];
  messages: any[];
  hasUnreadMessages?: boolean;
}

export interface Message {
  id: number;
  content: string;
  createdAt: string;
  authorId: number;
  author: any;
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
  return data;
};

export const createMessage = async (conversationId: number, content: string): Promise<Message> => {
  const { data } = await api.post(`/messaging/conversations/${conversationId}/messages`, { content });
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
  return data;
};

export const downloadFile = async (fileName: string) => {
  const { data } = await api.get(`/messaging/download/${fileName}`, {
    responseType: 'blob',
  });
  return data;
};
