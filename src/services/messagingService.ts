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

export interface FileData {
  id: number;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface Message {
  id: number;
  content: string;
  createdAt: string;
  authorId: number; 
  author?: User;
  conversationId: number;
  file?: FileData;
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
  } catch {
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
  } catch {
    // ignore
  }
  return data;
};

export const createGroupConversation = async (subject: string, participantIds: number[]): Promise<Conversation> => {
  const { data } = await api.post('/messaging/conversations', { subject, participantIds });
  return data;
};

export const uploadFile = async (conversationId: number, file: globalThis.File): Promise<Message> => {
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
  } catch {}
  return data;
};

export const downloadFile = async (fileId: number) => {
  try {
    const { data } = await api.get(`/messaging/download/${fileId}`, {
      responseType: 'blob',
    });
    return data;
  } catch (error: unknown) {
    // Se for erro HTTP, tenta extrair mensagem de erro
    const err = error as { response?: { data?: Blob } };
    if (err.response?.data) {
      const reader = new FileReader();
      const blob = err.response.data;
      
      return new Promise((resolve, reject) => {
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result as string);
            reject(new Error(errorData.error || 'Erro ao baixar arquivo'));
          } catch {
            reject(new Error('Erro ao baixar arquivo'));
          }
        };
        reader.onerror = () => reject(new Error('Erro ao baixar arquivo'));
        reader.readAsText(blob);
      });
    }
    throw error;
  }
};

export const deleteConversation = async (conversationId: number): Promise<void> => {
  await api.delete(`/messaging/conversations/${conversationId}`);
};

export const markConversationAsRead = async (conversationId: number): Promise<void> => {
  await api.post(`/messaging/conversations/${conversationId}/read`);
};
