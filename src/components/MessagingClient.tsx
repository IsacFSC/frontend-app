import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { FaArrowLeft, FaComments, FaCross, FaDownload } from 'react-icons/fa';
import { getConversations, getMessages, createMessage, createConversation, Conversation, Message, downloadFile, deleteConversation, markConversationAsRead } from '../services/messagingService';
import { getUsers, User } from '../services/userService';
import NewConversationModal from './NewConversationModal';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface MessagingClientProps {
  userRole: 'ADMIN' | 'LEADER' | 'USER';
}

export default function MessagingClient({ userRole }: MessagingClientProps) {
  console.log('userRole', userRole);
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = status === 'authenticated';
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Browser's File API
  const [view, setView] = useState<'conversations' | 'messages'>('conversations');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedConversations = await getConversations();
      // normalize hasUnreadMessages default and sort
      setConversations(fetchedConversations.map(c => ({ ...c, hasUnreadMessages: !!c.hasUnreadMessages })));
      setError(null);
    } catch (err) {
      setError('Falha ao buscar conversas.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const fetchedUsers = await getUsers();
      if (user) {
        setUsers(fetchedUsers.filter(u => u.id !== Number(user.id)));
      } else {
        setUsers(fetchedUsers);
      }
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
      fetchUsers();
    }
  }, [fetchConversations, fetchUsers, isAuthenticated]);

  useEffect(() => {
    const onConvCreated = (e: Event) => {
      fetchConversations();
      const conv = (e as CustomEvent).detail;
      if (conv && conv.id) {
        // auto-open the new conversation
        handleSelectConversation(conv);
      }
    };
    const onMsgCreated = (e: Event) => {
      const msg = (e as CustomEvent).detail;
        if (msg && selectedConversation && msg.conversationId === selectedConversation.id) {
        // refresh messages for the open conversation
        handleSelectConversation(selectedConversation, true); // isRefresh = true
      } else {
        // Move conversation with new message to the top and mark as unread
        setConversations(prev => {
          const convo = prev.find(c => c.id === msg.conversationId);
          if (!convo) {
            fetchConversations(); // Fetch if conversation is new to this user
            return prev;
          }
          const updatedConvo = { ...convo, hasUnreadMessages: true };
          const otherConvos = prev.filter(c => c.id !== msg.conversationId);
          return [updatedConvo, ...otherConvos];
        });
      }
    };

    window.addEventListener('messaging:conversationCreated', onConvCreated as EventListener);
    window.addEventListener('messaging:messageCreated', onMsgCreated as EventListener);
    return () => {
      window.removeEventListener('messaging:conversationCreated', onConvCreated as EventListener);
      window.removeEventListener('messaging:messageCreated', onMsgCreated as EventListener);
    };
  }, [fetchConversations, selectedConversation]);

  const handleSelectConversation = async (conversation: Conversation, isRefresh = false) => {
    if (!isRefresh) {
      setView('messages');
    }
    setSelectedConversation(conversation);
    try {
      const fetchedMessages = await getMessages(conversation.id);
      setMessages(fetchedMessages);
      // mark messages as read on the server for this conversation
      try {
        await markConversationAsRead(conversation.id);
        // Notify other parts of the app that messages have been read
        window.dispatchEvent(new CustomEvent('messaging:messagesRead'));
      } catch (e) {
        console.error('Falha ao marcar mensagens como lidas', e);
      }
      // clear local unread flag for this conversation
      setConversations(prev => prev.map(c => c.id === conversation.id ? { ...c, hasUnreadMessages: false } : c))
    } catch (error) {
      console.error('Falha ao buscar mensagens.', error);
      setError('Falha ao buscar mensagens.');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation) return;
    if (!newMessage.trim() && !selectedFile) return;

    try {
      if (selectedFile && selectedConversation) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        await fetch(`/api/messaging/conversations/${selectedConversation.id}/upload`, {
          method: 'POST',
          body: formData,
        });
        setSelectedFile(null);
      } else {
        await createMessage(selectedConversation.id, newMessage);
        setNewMessage('');
      }
      const fetchedMessages = await getMessages(selectedConversation.id);
      setMessages(fetchedMessages);
      setSuccessMessage('Mensagem enviada com sucesso!');
    } catch (error) {
      console.error('Falha ao enviar mensagem.', error);
      setError('Falha ao enviar mensagem.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleSendNewConversation = async (recipientId: number, subject: string, message: string) => {
    try {
      await createConversation(subject, message, recipientId);
      fetchConversations();
      setSuccessMessage('Conversa iniciada com sucesso!');
      setIsNewConversationModalOpen(false);
    } catch (error) {
      setError('Falha ao iniciar conversa.');
      throw error;
    }
  };

  const handleDeleteConversation = async (conversationId: number) => {
    if (window.confirm('Tem certeza que deseja deletar esta conversa?')) {
      try {
        await deleteConversation(conversationId);
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null);
          setView('conversations');
        }
        setSuccessMessage('Conversa deletada com sucesso!');
        // Notify other parts of the app that messages have been read
        window.dispatchEvent(new CustomEvent('messaging:messagesRead'));
      } catch (error) {
        console.error('Falha ao deletar conversa.', error);
        setError('Falha ao deletar conversa.');
      } finally {
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  };

  const handleDownload = async (fileId: number, fileName: string) => {
    try {
      const blob = await downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Falha ao baixar o arquivo.", error);
    }
  };

  const handleBack = () => {
    if (view === 'messages') {
      setView('conversations');
      setSelectedConversation(null);
    } else {
      router.back();
    }
  };

  return (
    <div className="h-screen flex flex-col p-4 md:p-8 bg-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-100">Mensagens</h1>
        <div className="flex flex-col gap-4 md:flex-row md:justify-end">
          <button
            onClick={() => setIsNewConversationModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded mr-4 w-full inline-flex justify-center"
          >
            <FaComments className="mr-2 inline-flex text-gray-200" />
            Nova Conversa
          </button>
          <button
            onClick={handleBack}
            className="bg-gray-500 hover:bg-gray-700 text-white text-sm py-2 px-4 inline-flex rounded justify-center"
          >
           <FaArrowLeft className="mr-2 mt-1 inline-flex text-sm" />
            Voltar
          </button>
        </div>
      </div>

      {loading && 
        // Container principal: fixed, tela cheia, bg preto com opacidade 75%
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          {/* Ícone de Loading: centralizado, sem background próprio */}
          <FaCross 
            className="animate-bounce delay-75 text-9xl text-blue-200 p-2 rounded-md border-2 border-cyan-400"
          />
        </div>
      }
      {error && <p className="text-red-500">{error}</p>}
      {successMessage && <p className="text-green-500">{successMessage}</p>}

      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden bg-gray-800">
        <div className={`md:col-span-1 ${view === 'messages' && 'hidden md:block'}`}>
          <h2 className="text-xl font-bold mb-4 text-gray-800">Conversas</h2>
          <div className="bg-red-800 flex-grow shadow-md rounded-lg p-4">
            {conversations.length > 0 ? (
              <ul>
                {conversations.map((convo) => (
                  <li
                    key={convo.id}
                    className={`cursor-pointer p-2 hover:bg-gray-200 rounded-md transition-colors flex justify-between items-center ${
                      convo.hasUnreadMessages ? 'font-bold bg-emerald-900 text-white' : 'text-gray-200'
                    }`}>
                    <div onClick={() => handleSelectConversation(convo)} className="flex-grow">
                      {convo.subject} - {convo.participants.map(p => p.name).find(name => name !== user?.name) || 'Sem Participantes'}
                      {selectedConversation?.id === convo.id && <span className="text-blue-500 ml-2 font-extrabold">●</span>}
                      {convo.messages && convo.messages.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Última mensagem: {new Date(convo.messages[convo.messages.length - 1].createdAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(convo.id);
                      }}
                      className="text-red-800 bg-red-300 hover:bg-red-400 border-0 rounded-md font-semibold hover:scale-110 duration-75 p-1 shadow-red-800 shadow-md flex items-center"
                      aria-label="Deletar conversa"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dark:text-gray-400">Nenhuma conversa encontrada.</p>
            )}
          </div>
        </div>

        <div className={`md:col-span-2 ${view === 'conversations' && 'hidden md:block'}`}>
          {selectedConversation ? (
            <div className="flex flex-col h-[70vh] overflow-y-scroll">
              <div className="flex items-center mb-4">
                <button onClick={() => setView('conversations')} className="md:hidden mr-4 text-gray-800 dark:text-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-xl font-bold text-gray-200">{selectedConversation.subject}</h2>
              </div>
              <div className="flex-grow bg-gray-800 shadow-md rounded-lg p-4 overflow-y-auto mb-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`mb-2 flex items-end gap-2 ${msg.authorId === Number(user?.id) ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg shadow-md ${msg.authorId === Number(user?.id) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                      <p className="font-bold">{msg.author?.name || 'Participante'}</p>
                      {msg.file ? (
                        msg.file.mimeType.startsWith('image/') ? (
                          <Image src={`/api/messaging/download/${msg.file.id}`} alt={msg.file.fileName} className="max-w-xs rounded-lg" width={300} height={300} />
                        ) : (
                          <button 
                            onClick={() => msg.file && handleDownload(msg.file.id, msg.file.fileName)} 
                            className="text-blue-200 hover:underline flex items-center"
                          >
                            <FaDownload className="mr-2" />
                            {msg.file.fileName}
                          </button>
                        )
                      ) : (
                        <p>{msg.content}</p>
                      )}
                       <p className="text-xs text-gray-200">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="shadow appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-300 bg-gray-800 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Digite uma mensagem..."
                />
                 <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="sr-only"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="bg-transparent hover:bg-gray-500 text-white font-bold py-3 px-3 border-gray-600 border-2 rounded ml-2 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                  </svg>
                  <span className="not-sr-only"></span>
                </label>
                {/* Show filename only when a file is selected; otherwise keep only the icon */}
                {selectedFile && (
                  <div className="ml-3 px-2 py-1 rounded text-sm flex items-center bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                    {selectedFile.name}
                  </div>
                )}
                <button onClick={handleSendMessage} className="bg-blue-700 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded ml-2">
                  <svg className="icone-enviar" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">Selecione uma conversa para ver as mensagens.</p>
            </div>
          )}
        </div>
      </div>
      <NewConversationModal
        isOpen={isNewConversationModalOpen}
        onClose={() => setIsNewConversationModalOpen(false)}
        users={users}
        onSend={handleSendNewConversation}
        title="Nova Conversa"
      />
    </div>
  );
}