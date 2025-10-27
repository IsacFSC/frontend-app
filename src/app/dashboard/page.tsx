'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getMySchedules, Schedule } from '../../services/scheduleService';
import { getUnreadMessagesCount } from '../../services/messagingService';
import PrivateRoute from '../../components/PrivateRoute';
import { FaEnvelope, FaSync, FaSignOutAlt } from 'react-icons/fa';
import DownloadScheduleButton from '@/components/DownloadScheduleButton';

// Função para transformar links em <a> (igual admin)
const linkify = (text: string) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const maxLength = 32;
  return text.split('\n').map((line, index) => (
    <div key={index}>
      {line.split(urlRegex).map((part, i) => {
        if (part.match(urlRegex)) {
          const display = part.length > maxLength ? part.slice(0, maxLength) + '...' : part;
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-900 font-bold hover:underline break-all max-w-[160px] sm:max-w-[240px] md:max-w-[320px] lg:max-w-[400px] bg-emerald-300 p-1 rounded"
              title={part}
            >
              {display}
            </a>
          );
        }
        return part;
      })}
    </div>
  ));
};

const formatSkill = (skill: string) => {
  if (!skill) return '';
  return skill.replace(/_/g, ' ');
};

enum Role {
  ADMIN = 'ADMIN',
  LEADER = 'LEADER',
  USER = 'USER',
}

const groupSchedulesByDate = (schedules: Schedule[]) => {
  const grouped: { [date: string]: Schedule[] } = {};
  schedules.forEach(schedule => {
    const d = new Date(schedule.startTime);
    // Usar UTC para evitar problemas de fuso horário
    const date = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(schedule);
  });
  return grouped;
};

export default function DashboardPage() {
    const { data: session, status } = useSession();
  const user = session?.user;
  const loading = status === 'loading';
  const router = useRouter();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (user) {
      try {
        setSchedulesLoading(true);
        const [mySchedules, unreadCount] = await Promise.all([
          getMySchedules(),
          getUnreadMessagesCount(),
        ]);
        // Ordena as escalas pela data mais recente
        const sortedSchedules = mySchedules.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        setSchedules(sortedSchedules);
        setFilteredSchedules(sortedSchedules); // Atualiza também as escalas filtradas
        setUnreadMessagesCount(unreadCount);
      } catch (error) {
        const axiosError = error as import('axios').AxiosError;
        if (axiosError?.response?.status === 403) {
          // A sessão expirou, deslogar o usuário silenciosamente.
          signOut();
        } else {
          // Apenas logar o erro no console, sem exibir alerta para o usuário.
        }
        console.error("Falha ao buscar escalas", error);
      } finally {
        setSchedulesLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    if (loading) return; // Aguarda autenticação
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== Role.USER) {
      const targetDashboard = user.role === Role.ADMIN ? '/admin/dashboard' : '/leader/dashboard';
      router.replace(targetDashboard);
      return;
    }
    fetchData();
  }, [user, loading, router, fetchData]);

  // Efeito para lidar com atualizações em tempo real do contador de mensagens
  useEffect(() => {
    if (user) {
      // Quando uma nova mensagem é criada ou lida, busca novamente a contagem
      const refetchCount = () => {
        getUnreadMessagesCount().then(setUnreadMessagesCount).catch(console.error);
      };

      window.addEventListener('messaging:messageCreated', refetchCount);
      window.addEventListener('messaging:messagesRead', refetchCount);

      return () => {
        window.removeEventListener('messaging:messageCreated', refetchCount);
        window.removeEventListener('messaging:messagesRead', refetchCount);
      };
    }
  }, [user]);

  useEffect(() => {
    const filtered = schedules.filter(schedule => {
      const matchesSearchTerm = schedule.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!dateFilter) {
        return matchesSearchTerm;
      };

      const scheduleDate = new Date(schedule.startTime);
      const filterDate = new Date(dateFilter);
      const matchesDate = scheduleDate.getUTCFullYear() === filterDate.getUTCFullYear() &&
                          scheduleDate.getUTCMonth() === filterDate.getUTCMonth() &&
                          scheduleDate.getUTCDate() === filterDate.getUTCDate();
      return matchesSearchTerm && matchesDate;
    });
    setFilteredSchedules(filtered);
  }, [searchTerm, dateFilter, schedules]);


  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchData();
    } finally {
      setIsRefreshing(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Carregando...</p>
      </div>
    );
  }

  const groupedSchedules = groupSchedulesByDate(filteredSchedules);

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-900 p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Painel do Usuário</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/dashboard/messages" className="relative bg-emerald-500 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded text-center flex items-center">
              <FaEnvelope className="mr-2" />
              Mensagens
              {unreadMessagesCount > 0 && (
                <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs">
                  {unreadMessagesCount}
                </span>
              )}
            </Link>
            <button
              onClick={handleRefresh}
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center ${isRefreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={isRefreshing}
            >
              <FaSync className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> Atualizar
            </button>
            <button
              onClick={signOut}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <FaSignOutAlt className="mr-2" /> Sair
            </button>
          </div>
        </div>
        <p className="mt-2 text-gray-200">Bem-vindo, {user.name}!</p>
        <p className="mt-2 text-gray-200">Você está logado como: {user.role}</p>

        {isRefreshing && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-transparent p-4 rounded">
              <svg className="animate-spin h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <span className="text-gray-400">Buscar por nome da Escala:</span>
            <input
              type="text"
              placeholder="Buscar escalas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded-md"
            />
          </div>
          <div className="flex-1">
            <span className="text-gray-400">Filtrar por data do dia da Escala:</span>
            <input
              type="date"
              placeholder="Filtrar por data..."
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded-md"
            />
          </div>
        </div>

        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
          >
            Limpar Filtro de Data
          </button>
        )}

        {schedulesLoading ? (
    <p className="mt-8">Carregando suas escalas...</p>
        ) : (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">Suas Escalas</h2>
            <div className="space-y-8">
              {Object.keys(groupedSchedules).length > 0 ? (
                Object.keys(groupedSchedules).map(date => (
                  <div key={date}>
                    <h3 className="text-xl font-semibold text-gray-200 mb-4 border-b-2 pb-2">{date}</h3>
                    <div className="space-y-4">
                      {groupedSchedules[date].map(schedule => (
                        <div key={schedule.id} className="p-6 rounded-lg shadow-blue-600 shadow-lg bg-orange-200 hover:bg-orange-300 transition-shadow">
                          <div className="flex justify-between items-start flex-wrap">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900">{schedule.name}</h3>
                              <p className="text-gray-700 mt-2">{schedule.description}</p>
                              <p className="text-sm text-gray-600 mt-4">
                                <strong>Início:</strong> {new Date(schedule.startTime).toLocaleString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} - <strong>Fim:</strong> {new Date(schedule.endTime).toLocaleString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 mt-4 md:mt-0">                              
                                <DownloadScheduleButton schedule={schedule} />                           
                            </div>
                          </div>
                          <div className="mt-4">
                            <h4 className="font-semibold text-gray-900">Usuários nesta escala:</h4>
                            <ul className="list-disc list-inside">
                              {schedule.users.map(userOnSchedule => (
                                <li key={userOnSchedule.userId} className="text-gray-800">{userOnSchedule.user.name} - {formatSkill(userOnSchedule.skill)}</li>
                              ))}
                            </ul>
                          </div>
                          {schedule.tasks && schedule.tasks.length > 0 && (
                            <div className="mt-4">
                              <h4 className="font-semibold text-gray-900">Tarefas nesta escala:</h4>
                              <ul className="list-disc list-inside">
                                {schedule.tasks.map(task => (
                                  <li key={task.id} className="text-gray-800 mb-2">
                                    <div className="font-bold text-lg mb-1 inline">{task.name}</div>
                                    <div className="space-y-1">
                                      {task.description && linkify(task.description)}
                                    </div>                                    
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="mt-4 pt-4 border-t border-gray-400">
                            <p className="text-sm text-gray-700">
                              <strong>Obs:</strong> Executem as músicas com excelência, atenção para os horarios de ensaio que acontecem as 19:30h nas quintas feiras, poderão haver mudanças conforme orientações do líder. Chegar com antecedência nos cultos 30 minutos antes do início dos cultos, poderão have mudanças conforme orientações do líder. Sê tu uma benção!
                            </p>
                          </div>
                          {/* O ScheduleFileManagement parece ser para o admin, removido da visão do usuário comum */}
                          {/* <ScheduleFileManagement scheduleId={schedule.id} /> */}
                        </div>
                      ))}
                    </div>
                  </div>
                )) 
              ) : (
                <p className="text-gray-400">Nenhuma escala encontrada.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </PrivateRoute>
  );
}