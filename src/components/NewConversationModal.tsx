
'use client';

import { useState } from 'react';
import { User } from '../services/userService';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onSend: (recipientId: number, subject: string, message: string) => Promise<void>;
  title: string;
  userRole: string;
}

export default function NewConversationModal({ isOpen, onClose, users, onSend, title, userRole }: NewConversationModalProps) {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !subject.trim() || !message.trim()) {
      setError(`${userRole}, subject, and message are required.`);
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await onSend(parseInt(selectedUser, 10), subject, message);
      onClose();
    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-100 mb-4">{title}</h3>
        <form onSubmit={handleSubmit}>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full p-2 border border-gray-700 rounded mb-4 bg-gray-600 text-gray-200"
            required
          >
            <option value="">Selecione o destinatário</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-2 border border-gray-700 rounded mb-4 bg-gray-600 text-gray-200"
            placeholder="Assunto"
            required
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-24 p-2 border border-gray-700 rounded mb-4 bg-gray-600 text-gray-100"
            placeholder="Mensagem"
            required
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-300 text-gray-800 font-bold hover:bg-gray-400">Cancelar</button>
            <button type="submit" disabled={isSending} className="px-4 py-2 rounded bg-blue-500 text-gray-100 font-bold hover:bg-blue-600">
              {isSending ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
}
