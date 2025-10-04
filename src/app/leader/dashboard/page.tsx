'use client';

import Link from 'next/link';
import { useAuth } from '../../../hooks/useAuth';
import PrivateRoute from '@/components/PrivateRoute';
import { FaSignOutAlt, FaCalendarAlt, FaTasks, FaEnvelope } from 'react-icons/fa';
import MessageIcon from '@/components/MessageIcon';

export default function LeaderDashboardPage() {
  const { user, signOut, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando autenticação...</p>
      </div>
    );
  }
  if (!user || user.role !== 'LEADER') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirecionando...</p>
      </div>
    );
  }

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-900 p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Painel do Líder</h1>
          <div className="flex items-center gap-4">
            <MessageIcon />
            <button
              onClick={signOut}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <FaSignOutAlt className="mr-2" /> Sair
            </button>
          </div>
        </div>
        <p className="mt-2 text-gray-200">Olá, {user?.name}!</p>
        <p className="mt-2 text-gray-200">Você está logado como: {user?.role}</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/leader/schedules" className="bg-teal-200 hover:bg-teal-400 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center"><FaCalendarAlt className="mr-2" /> Gerenciamento de Suas Escalas</h2>
            <p className="mt-2 text-gray-700">Visualize e gerencie suas escalas, incluindo o upload de arquivos.</p>
          </Link>
          <Link href="/leader/tasks" className="bg-teal-200 hover:bg-teal-400 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center"><FaTasks className="mr-2" /> Gerenciamento de Tarefas</h2>
            <p className="mt-2 text-gray-700">Criar, atualizar e atribuir tarefas.</p>
          </Link>
          <Link href="/leader/messaging" className="bg-teal-200 hover:bg-teal-400 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center"><FaEnvelope className="mr-2" /> Mensagens</h2>
            <p className="mt-2 text-gray-700">Enviar e receber mensagens.</p>
          </Link>
        </div>
      </div>
    </PrivateRoute>
  );
}