import { useState } from 'react';
import { createConversation } from '../services/messagingService';
import { Schedule } from '../services/scheduleService';
import { User } from '../services/userService';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: Schedule | null;
  recipient: User | null;
}

export default function MessageModal({ isOpen, onClose, schedule, recipient }: MessageModalProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedule || !recipient || !message.trim()) {
      setError('Mensagem, escala e destinatário são obrigatórios.');
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const subject = `Dúvida sobre a escala: ${schedule.name}`;
      await createConversation(subject, message, recipient.id);
      setSuccess('Mensagem enviada com sucesso!');
      setMessage('');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2000);
    } catch (err) {
      setError('Falha ao enviar a mensagem. Tente novamente.');
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
        <div className="bg-gray-100 p-6 rounded-xl shadow-lg border border-gray-200 w-full max-w-md">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Enviar mensagem</h3>
          <form onSubmit={handleSubmit}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-24 p-2 border border-gray-300 rounded mb-4 bg-gray-100 text-gray-800"
              placeholder="Digite sua mensagem..."
              required
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-300 text-gray-800 font-bold hover:bg-gray-400">Cancelar</button>
              <button type="submit" disabled={isSending} className="px-4 py-2 rounded bg-gray-800 text-gray-100 font-bold hover:bg-gray-900">
                {isSending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
            {error && <p className="text-red-500 mt-2">{error}</p>}
            {success && <p className="text-green-500 mt-2">{success}</p>}
          </form>
        </div>
      </div>
  );
}
