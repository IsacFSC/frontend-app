'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getMySchedules, Schedule, uploadScheduleFile } from '../../../services/scheduleService';
import PrivateRoute from '@/components/PrivateRoute';
import { FaFileUpload, FaArrowLeft, FaCross } from 'react-icons/fa';
import { AxiosError } from 'axios';
import DownloadScheduleButton from '@/components/DownloadScheduleButton';
import Modal from '../../../components/Modal';
import toast, { Toaster } from 'react-hot-toast';
import ScheduleFilter from '@/components/ScheduleFilter';


interface UploadResponse {
  schedule: Schedule;
  conversationId: number;
}

interface ErrorResponse {
    message: string;
}

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

export default function LeaderScheduleManagementPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const loading = status === 'loading';
  const router = useRouter();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [selectedFileForUpload, setSelectedFileForUpload] = useState<File | null>(null);


  const fetchData = useCallback(async () => {
    if (user) {
      try {
        setSchedulesLoading(true);
        const mySchedules = await getMySchedules();
        // Ordena as escalas pela data mais recente
        const sortedSchedules = mySchedules.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        setSchedules(sortedSchedules);
      } catch (error) {
        const axiosError = error as import('axios').AxiosError;
        if (axiosError?.response?.status === 403) {
          toast.error('Sua sessão expirou ou você não tem permissão. Faça login novamente.');
          signOut();
        } else {
          toast.error('Falha ao buscar escalas. Tente novamente.');
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
    if (user.role !== Role.LEADER) {
      const targetDashboard = user.role === Role.ADMIN ? '/admin/dashboard' : '/dashboard';
      router.replace(targetDashboard);
      return;
    }
    fetchData();
  }, [user, loading, router, fetchData]);

  const handleOpenFileUploadModal = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setSelectedFileForUpload(null);
    setIsFileUploadModalOpen(true);
  };

  const handleCloseFileUploadModal = () => {
    setSelectedFileForUpload(null);
    setIsFileUploadModalOpen(false);
    setSelectedSchedule(null);
  };

  const handleFileUpload = async (file: File, scheduleId: number) => {
    if (!scheduleId) return;
    const toastId = toast.loading('Enviando arquivo...');
    try {
        const result = await uploadScheduleFile(scheduleId, file);
        toast.success('Arquivo enviado com sucesso!', { id: toastId });
        await fetchData();

    } catch (error) {
        const axiosError = error as AxiosError;
        const data = axiosError.response?.data as ErrorResponse;
        const errorMessage = data && typeof data.message === 'string' ? data.message : 'Falha ao enviar arquivo.';
        toast.error(errorMessage, { id: toastId });
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (!user || user.role !== Role.LEADER) {
    if (loading) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <FaCross 
            className="animate-bounce delay-75 text-9xl text-blue-200 p-2 rounded-md border-2 border-cyan-400"
          />
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirecionando...</p>
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
      <Toaster position="top-center" reverseOrder={false} />
      <div className="min-h-screen bg-gray-900 p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Gerenciamento de Suas Escalas</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleBack}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <FaArrowLeft className="mr-2" /> Voltar
            </button>
          </div>
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
                                  <strong>Fim:</strong> {new Date(schedule.endTime).toLocaleString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric'})}
                                </p>
                              </div>
                              <div className="flex items-center justify-center space-x-2 mt-4 md:mt-0">                              
                                  <DownloadScheduleButton schedule={schedule} />
                                  <button onClick={() => handleOpenFileUploadModal(schedule)} className="text-md text-white,
                                  border-0 rounded-md hover:scale-105 font-semibold duration-75 p-1.5 bg-cyan-600 hover:bg-cyan-800 shadow-sky-800 shadow-md flex items-center"
                                  title="Anexar Arquivo">
                                  <FaFileUpload />
                                  <span className='ml-1 hidden sm:block'> Anexar</span>
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
        {isFileUploadModalOpen && selectedSchedule && (
          <Modal isOpen={isFileUploadModalOpen} onClose={handleCloseFileUploadModal} title={`Anexar arquivo para ${selectedSchedule.name}`}>
            <div className="p-4">
              <p className="text-gray-400 mb-4">Selecione um arquivo (PDF ou imagem) para anexar a esta escala.</p>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setSelectedFileForUpload(e.target.files[0]);
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-md" />
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleCloseFileUploadModal}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (selectedFileForUpload) {
                      await handleFileUpload(selectedFileForUpload, selectedSchedule.id);
                      handleCloseFileUploadModal();
                    }
                  }}
                  disabled={!selectedFileForUpload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Enviar
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </PrivateRoute>
  );
}
