'use client';

import { useEffect, useState, useCallback } from 'react';
// (removed unused Link import)
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getMySchedules, Schedule } from '../../services/scheduleService';
import PrivateRoute from '../../components/PrivateRoute';
import { FaCross } from 'react-icons/fa';
import DownloadScheduleButton from '@/components/DownloadScheduleButton';
import ScheduleFilter from '@/components/ScheduleFilter';

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
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  

  const fetchData = useCallback(async () => {
    if (user) {
      try {
        setSchedulesLoading(true);
  const mySchedules = await getMySchedules();
  const sortedSchedules = mySchedules.sort((a: Schedule, b: Schedule) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        setSchedules(sortedSchedules);
      } catch (error) {
        const axiosError = error as import('axios').AxiosError;
        if (axiosError?.response?.status === 403) {
          try {
            const { default: fastSignOut } = await import('@/lib/fastSignOut');
            fastSignOut(router);
          } catch (_e) {
            signOut();
          }
        } else {
        }
        console.error("Falha ao buscar escalas", error);
      } finally {
        setSchedulesLoading(false);
      }
    }
  }, [user, router]);

  useEffect(() => {
    if (loading) return; 
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

  

  if (loading || !user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
        <FaCross 
          className="animate-bounce delay-75 text-9xl text-blue-200 p-2 rounded-md border-2 border-cyan-400"
        />
      </div>
    );
  }

  const filteredSchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.startTime);
    const matchesSearchTerm = schedule.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = scheduleDate.getUTCFullYear() === currentDate.getFullYear() &&
                        scheduleDate.getUTCMonth() === currentDate.getMonth();
    
    return matchesSearchTerm && matchesDate;
  });

  const groupedSchedules = groupSchedulesByDate(filteredSchedules);

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-900 p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Painel do Usuário</h1>
        </div>
        <p className="mt-2 text-gray-200">Bem-vindo, {user.name}!</p>

        <div className="flex flex-col md:flex-row gap-8 mt-8">
          <main className="flex-1 order-2 md:order-1">
            {schedulesLoading ? (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
                <FaCross 
                  className="animate-bounce delay-75 text-9xl text-blue-200 p-2 rounded-md border-2 border-cyan-400"
                />
              </div>
            ) : (
              <div className="space-y-8">
                <h2 className="text-2xl font-semibold mb-4 text-white">Suas Escalas</h2>
                {Object.keys(groupedSchedules).length > 0 ? (
                  Object.keys(groupedSchedules).map(date => (
                    <div key={date}>
                      <h3 className="text-xl font-semibold text-gray-200 mb-4 border-b-2 pb-2">{date}</h3>
                      <div className="space-y-4">
                        {groupedSchedules[date].map(schedule => (
                          <div key={schedule.id} className="p-6 rounded-lg shadow-blue-600 shadow-lg bg-violet-200 hover:bg-violet-300 transition-shadow">
                            <div className="flex justify-between md:items-center flex-col md:flex-row">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center justify-center space-x-2 mt-4 md:mt-0 uppercase">{schedule.name}</h3>
                                <p className="text-gray-700 flex items-center justify-center space-x-2 mt-4 md:mt-0">{schedule.description}</p>
                                <p className="text-sm text-gray-600 mt-2 md:inline-flex text-center">
                                  <strong>Início:</strong> {new Date(schedule.startTime).toLocaleString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric'})}
                                </p>
                                <p className="text-sm text-gray-600 mt-2 md:inline-flex text-center sm:ml-4">
                                  <strong>Fim:</strong> {new Date(schedule.endTime).toLocaleString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <div className="flex items-center justify-center space-x-2 mt-4 md:mt-0">
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
                                <strong>Obs:</strong> Executem as músicas com excelência, atenção para os horarios de ensaio que acontecem as 19:30h nas quintas feiras, poderão haver mudanças conforme orientações do líder. Chegar com antecedência nos cultos 30 minutos antes do início dos cultos, poderão haver mudanças conforme orientações do líder. Sê tu uma benção!
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )) 
                ) : (
                  <p className="text-gray-400">Nenhuma escala encontrada.</p>
                )}
              </div>
            )}
          </main>
          <ScheduleFilter
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
          />
        </div>
      </div>
    </PrivateRoute>
  );
}