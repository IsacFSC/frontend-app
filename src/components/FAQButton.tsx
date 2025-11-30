'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Modal from './Modal';
import { FaQuestion } from 'react-icons/fa';
import { FaTimes } from 'react-icons/fa';

const faqData = [
  {
    question: 'Como posso ver minhas escalas?',
    answer: 'Você pode ver suas escalas na seção "Minhas Escalas" no painel principal. As escalas futuras e passadas estarão listadas lá.',
  },
  {
    question: 'Como faço para visualizar os detalhes de uma escala?',
    answer: 'Clique em uma escala na lista para ver os detalhes, incluindo a data, hora, e os membros da equipe escalados.',
  },
  {
    question: 'É possível baixar a escala em PDF?',
    answer: 'Sim, ao visualizar os detalhes de uma escala, você encontrará um botão para baixar a escala em formato PDF.',
  },
  {
    question: 'Como funciona o sistema de mensagens?',
    answer: 'O sistema de mensagens permite que você converse com outros usuários. Você pode iniciar uma nova conversa ou responder a mensagens existentes na seção de mensagens.',
  },
  {
    question: 'Como posso atualizar meu perfil?',
    answer: 'Atualmente, a atualização de perfil é feita pela administração. Entre em contato com um administrador para alterar suas informações.',
  },
  {
    question: 'O que fazer se eu esquecer minha senha?',
    answer: 'Entre em contato com o suporte ou um administrador para redefinir sua senha.',
  },
  {
    question: 'Como criar uma nova tarefa?* (Somente para líderes e administradores)',
    answer: 'Vá para a seção de tarefas e clique no botão "Criar Nova Tarefa". Preencha os detalhes necessários e salve.',
  },
  {
    question: 'Posso atribuir tarefas a outros usuários?* (Somente para líderes e administradores)',
    answer: 'Sim, ao criar ou editar uma tarefa, você pode selecionar um usuário para atribuir a tarefa.',
  },
  {
    question: 'Como gerenciar usuários na plataforma?* (Somente para administradores)',
    answer: 'Na seção de gerenciamento de usuários, você pode adicionar, editar ou remover usuários conforme necessário.',
  },
  {
    question: 'Como faço upload de arquivos para uma escala?* (Somente para líderes)',
    answer: 'Ao criar ou editar uma escala, você verá uma opção para fazer upload de arquivos relacionados à escala.',
  },
  {
    question: 'Quem devo contatar para suporte adicional?',
    answer: 'Para suporte adicional, entre em contato com o administrador do sistema ou equipe de suporte designada.',
  },
  {
    question: 'Como posso fornecer feedback sobre a plataforma?',
    answer: 'Você pode enviar feedback diretamente para a equipe de desenvolvimento através do e-mail de suporte ou formulário de feedback disponível na plataforma.',
  },
];

export default function FAQButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const draggingRef = useRef(false);
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Local storage keys
  const STORAGE_KEY_HIDDEN = 'faq-hidden'; // will be stored in sessionStorage
  const STORAGE_KEY_POS = 'faq-pos'; // keep position in localStorage

  const { data: _session, status } = useSession();

  useEffect(() => {
    try {
      const h = sessionStorage.getItem(STORAGE_KEY_HIDDEN);
      if (h === 'true') setHidden(true);
      const p = localStorage.getItem(STORAGE_KEY_POS);
      if (p) {
        const parsed = JSON.parse(p);
        if (typeof parsed.left === 'number' && typeof parsed.top === 'number') {
          setPos(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // save position changes
    if (pos) {
      try {
        localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(pos));
      } catch {
        // ignore
      }
    }
  }, [pos]);

  useEffect(() => {
    try {
      // persist hidden only for current browser session
      sessionStorage.setItem(STORAGE_KEY_HIDDEN, hidden ? 'true' : 'false');
    } catch {
      // ignore
    }
  }, [hidden]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Start dragging
    const btn = buttonRef.current;
    if (!btn) return;
    draggingRef.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    const rect = btn.getBoundingClientRect();
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!draggingRef.current) return;
    // calculate new left/top clamped to viewport
    const left = Math.min(Math.max(0, e.clientX - offsetRef.current.x), window.innerWidth - 56);
    const top = Math.min(Math.max(0, e.clientY - offsetRef.current.y), window.innerHeight - 56);
    setPos({ left, top });
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try { (e.target as Element).releasePointerCapture?.(e.pointerId); } catch {
      // ignore
    }
  };

  useEffect(() => {
    // Attach global pointermove/up while dragging
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const handleCloseButton = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    setHidden(true);
  };

  // Reset handler removed (not currently used). To reset position double-click the button.

  // ensure FAQ reappears when user logs in again
  useEffect(() => {
    if (status === 'authenticated') {
      setHidden(false);
      try { sessionStorage.removeItem(STORAGE_KEY_HIDDEN); } catch {
        // ignore
      }
    }
  }, [status]);

  return (
    <>
      {!hidden && (
        <button
          ref={buttonRef}
          onDoubleClick={openModal}
          onPointerDown={handlePointerDown}
          className="fixed bg-blue-500 opacity-90 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          aria-label="Ajuda e FAQ"
          style={pos ? { left: pos.left, top: pos.top, right: 'auto', bottom: 'auto', width: 56, height: 56 } : { right: 16, bottom: 16, width: 56, height: 56 }}
        >
          <FaQuestion size={20} />
          {/* small close button - not a nested <button> to avoid invalid HTML */}
          <div
            onClick={handleCloseButton}
            role="button"
            tabIndex={0}
            onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') handleCloseButton(); }}
            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center cursor-pointer"
            aria-label="Fechar FAQ"
            title="Fechar"
            style={{ transform: 'translate(50%, -50%)' }}
          >
            <FaTimes size={10} />
          </div>
          {/* reset position by double-clicking the FAQ button */}
        </button>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Perguntas Frequentes">
        <div className="space-y-4 overflow-scroll max-h-96 pr-2">
          {faqData.map((item, index) => (
            <div key={index}>
              <h4 className="font-bold text-gray-200">{item.question}</h4>
              <p className="text-gray-400">{item.answer}</p>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
