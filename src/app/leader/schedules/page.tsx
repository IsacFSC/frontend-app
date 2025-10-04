'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getMySchedules, downloadScheduleFile, Schedule, updateSchedule, uploadScheduleFile } from '../../../services/scheduleService';
import { getUnreadMessagesCount } from '../../../services/messagingService';
import PrivateRoute from '@/components/PrivateRoute';
import { FaEnvelope, FaSync, FaSignOutAlt, FaDownload, FaFileUpload, FaArrowLeft } from 'react-icons/fa';
import { Menu } from '@headlessui/react';
import Modal from '../../../components/Modal';
import ScheduleForm from '../../../components/ScheduleForm';
import { AxiosError } from 'axios';

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
    const date = new Date(schedule.startTime).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(schedule);
  });
  return grouped;
};

export default function LeaderScheduleManagementPage() {
  const { user, isAuthenticated, signOut, loading } = useAuth();
  const router = useRouter();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    if (user) {
      try {
        setSchedulesLoading(true);
        const mySchedules = await getMySchedules();
        // Ordena as escalas pela data mais recente
        const sortedSchedules = mySchedules.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        setSchedules(sortedSchedules);
        setFilteredSchedules(mySchedules);
      } catch (error) {
        const axiosError = error as import('axios').AxiosError;
        if (axiosError?.response?.status === 403) {
          alert('Sua sessão expirou ou você não tem permissão. Faça login novamente.');
          signOut();
        } else {
          alert('Falha ao buscar escalas. Tente novamente.');
        }
        console.error("Falha ao buscar escalas", error);
      } finally {
        setSchedulesLoading(false);
      }
    }
  };

  useEffect(() => {
    if (loading) return; // Aguarda autenticação
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== Role.LEADER) {
      const targetDashboard = user.role === Role.ADMIN ? '/admin/dashboard' : '/dashboard';
      router.replace(targetDashboard);
      return;
    }
    fetchData();
  }, [user, loading, router]);

  useEffect(() => {
    const filtered = schedules.filter(schedule => {
      const matchesSearchTerm = schedule.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!dateFilter) {
        return matchesSearchTerm;
      }

      const scheduleDate = new Date(schedule.startTime);
      const filterDate = new Date(dateFilter);
      const matchesDate = scheduleDate.getUTCFullYear() === filterDate.getUTCFullYear() &&
                          scheduleDate.getUTCMonth() === filterDate.getUTCMonth() &&
                          scheduleDate.getUTCDate() === filterDate.getUTCDate();
      return matchesSearchTerm && matchesDate;
    });
    setFilteredSchedules(filtered);
  }, [searchTerm, dateFilter, schedules]);

  const handleDownload = async (scheduleId: number) => {
    try {
      await downloadScheduleFile(scheduleId);
      // A função downloadScheduleFile já trata o download,
      // então a notificação de sucesso pode não ser necessária aqui
      // ou pode ser mostrada antes do início do download.
    } catch (error) {
      console.error('Error downloading file:', error);
      showToast('Erro ao baixar o arquivo. Tente novamente.', 'error');
    }
  };

  // Toast simples
  function showToast(message: string, type: 'success' | 'error') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = `fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white font-bold ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  const handleRefresh = () => {
    fetchData();
  }

  const handleAttachFileClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedSchedule) return;
    try {
      setSchedulesLoading(true);
      await uploadScheduleFile(selectedSchedule.id, file);
      await fetchData(); 
      setSuccessMessage('Arquivo enviado com sucesso!');
      showToast('Arquivo enviado com sucesso!', 'success');
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = typeof axiosError.response?.data?.message === 'string' ? axiosError.response.data.message : 'Falha ao enviar arquivo.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSchedulesLoading(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (!user || user.role !== Role.LEADER) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p>Carregando autenticação...</p>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirecionando...</p>
      </div>
    );
  }

  const groupedSchedules = groupSchedulesByDate(filteredSchedules);

  return (
    <PrivateRoute>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={(e) => {
          if (e.target.files && e.target.files[0] && selectedSchedule) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />
      <div className="min-h-screen bg-gray-900 p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Gerenciamento de Suas Escalas</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleRefresh}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <FaSync className="mr-2" /> Atualizar
            </button>
            <button
              onClick={handleBack}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <FaArrowLeft className="mr-2" /> Voltar
            </button>
          </div>
        </div>
        <p className="mt-2 text-gray-200">Bem-vindo, {user.name}!</p>
        <p className="mt-2 text-gray-200">Você está logado como: {user.role}</p>

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
                                {new Date(schedule.startTime).toLocaleTimeString()} - {new Date(schedule.endTime).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 mt-4 md:mt-0">                              
                                <button
                                  onClick={() => handleDownload(schedule.id)}
                                  className='bg-blue-600 hover:bg-blue-700 text-white  rounded-3xl p-1.5 flex items-center'
                                >
                                  <FaDownload className="mr-2" /> Baixar Escala
                                </button>                              
                              <button onClick={() => handleAttachFileClick(schedule)} className="text-sm text-white bg-indigo-600 hover:bg-indigo-900 rounded-3xl p-1.5 flex items-center">
                                <FaFileUpload className="mr-2" /> Anexar / Editar Arquivo
                              </button>
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