'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import PrivateRoute from '@/components/PrivateRoute';
import { FaCalendarAlt, FaTasks, FaEnvelope, FaCross } from 'react-icons/fa';

export default function LeaderDashboardPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const loading = status === 'loading';

  if (loading) {
    return (
      // Container principal: fixed, tela cheia, bg preto com opacidade 75%
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
        {/* Ícone de Loading: centralizado, sem background próprio */}
        <FaCross 
          className="animate-bounce delay-75 text-9xl text-blue-200 p-2 rounded-md border-2 border-cyan-400"
        />
      </div>
    );
  }
  if (!user || user.role !== 'LEADER') {
    return (
      // Container principal: fixed, tela cheia, bg preto com opacidade 75%
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
        {/* Ícone de Loading: centralizado, sem background próprio */}
        <FaCross 
          className="animate-bounce delay-75 text-9xl text-blue-200 p-2 rounded-md border-2 border-cyan-400"
        />
      </div>
    );
  }

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-900 p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Painel do Líder</h1>
        </div>
        <div className="text-gray-200">
          <p className="mt-2">Olá, {user.name}!</p>
          {/*<p className="mt-2">Você está logado como: {user.role} </p>*/}
        </div>
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