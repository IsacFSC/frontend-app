'use client';

import Link from 'next/link';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import PrivateRoute from '@/components/PrivateRoute';
import { FaSignOutAlt, FaUsers, FaCalendarAlt, FaEnvelope, FaTasks } from 'react-icons/fa';
import MessageIcon from '@/components/MessageIcon';

export default function AdminDashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-900 p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Painel do Administrador</h1>
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
          <Link href="/admin/users" className="bg-teal-200 hover:bg-teal-400 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center"><FaUsers className="mr-2" /> Gerenciamento de Usuários</h2>
            <p className="mt-2 text-gray-700">Criar, editar e gerenciar usuários.</p>
          </Link>
          <Link href="/admin/schedules" className="bg-teal-200 hover:bg-teal-400 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center"><FaCalendarAlt className="mr-2" /> Gerenciamento de Escalas</h2>
            <p className="mt-2 text-gray-700">Criar e gerenciar agendas, atribuir usuários e tarefas.</p>
          </Link>
          <Link href="/admin/messaging" className="bg-teal-200 hover:bg-teal-400 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center"><FaEnvelope className="mr-2" /> Mensagens</h2>
            <p className="mt-2 text-gray-700">Enviar e receber mensagens.</p>
          </Link>
          <Link href="/admin/tasks" className="bg-teal-200 hover:bg-teal-400 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center"><FaTasks className="mr-2" /> Aprovação de Tarefas</h2>
            <p className="mt-2 text-gray-700">Aprovar ou rejeitar tarefas pendentes.</p>
          </Link>
        </div>
      </div>
    </PrivateRoute>
  );
}