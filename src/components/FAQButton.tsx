'use client';

import { useState } from 'react';
import Modal from './Modal';
import { FaQuestion } from 'react-icons/fa';

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

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <button
        onClick={openModal}
        className="fixed bottom-4 right-4 bg-blue-500 opacity-75 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Ajuda e FAQ"
      >
        <FaQuestion size={24} />
      </button>

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
