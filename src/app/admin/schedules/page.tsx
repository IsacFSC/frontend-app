'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  addUserToSchedule,
  removeUserFromSchedule,
  uploadScheduleFile, // Added
  Schedule,
} from '../../../services/scheduleService';
import { getUsers, User } from '../../../services/userService';
import { getTasks, assignTaskToSchedule, unassignTaskFromSchedule, Task } from '../../../services/taskService';
import Modal from '../../../components/Modal';
import ScheduleForm from '../../../components/ScheduleForm';
import ScheduleUserManagement from '../../../components/ScheduleUserManagement';
import ScheduleTaskManagement from '../../../components/ScheduleTaskManagement';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AxiosError } from 'axios';
import PrivateRoute from '@/components/PrivateRoute';
import { FaPlus, FaArrowLeft, FaTasks, FaUsers, FaEdit, FaTrash, FaCross } from 'react-icons/fa';
import DownloadScheduleButton from '@/components/DownloadScheduleButton';

interface ScheduleFormData {
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  file?: File;
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

export default function ScheduleManagementPage() {
    const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = status === 'authenticated';
  const router = useRouter();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedSchedules, fetchedUsers, fetchedTasksResponse] = await Promise.all([
        getSchedules(),
        getUsers(),
        getTasks({}),
      ]);
      const sortedSchedules = fetchedSchedules.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      setSchedules(sortedSchedules);
      setAllUsers(fetchedUsers);
      setAllTasks(fetchedTasksResponse.data);
      setError(null);
    } catch (err) {
      setError('Falha ao buscar dados. Tente novamente mais tarde.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchAllData();
    }
  }, [fetchAllData, isAuthenticated, user]);

  const handleFileUpload = async (file: File, scheduleId: number) => {
    if (!scheduleId) return;
    try {
      setLoading(true);
      const result = await uploadScheduleFile(scheduleId, file);
      const convoId = result?.conversationId;

      setSuccessMessage('Arquivo enviado com sucesso e conversa criada!');
      await fetchAllData(); 

      if (convoId) {
        router.push('/admin/messaging');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('messaging:conversationCreated', { detail: { id: convoId } }));
        }, 300);
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      const data = axiosError.response?.data as ErrorResponse
      const errorMessage = data && typeof data.message === 'string' ? data.message : 'Falha ao enviar arquivo.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };


  const handleOpenFormModal = (schedule: Schedule | null = null) => {
    setSelectedSchedule(schedule ? JSON.parse(JSON.stringify(schedule)) : null);
    setIsFormModalOpen(true);
  };
  const handleCloseFormModal = () => setIsFormModalOpen(false);

  const handleOpenUserModal = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsUserModalOpen(true);
  };
  const handleCloseUserModal = () => setIsUserModalOpen(false);

  const handleOpenTaskModal = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setIsTaskModalOpen(true);
  };
  const handleCloseTaskModal = () => setIsTaskModalOpen(false);

  const handleFormSubmit = async (data: ScheduleFormData) => {
    try {
      if (selectedSchedule) {
        const { file: _unused, ...dataWithoutFile } = data;
        await updateSchedule(selectedSchedule.id, dataWithoutFile);
        setSuccessMessage('Escala atualizada com sucesso!');
      } else {
        const { file: _unusedFile, ...scheduleDataWithoutFile } = data;
        await createSchedule(scheduleDataWithoutFile);
        setSuccessMessage('Escala criada com sucesso!');
      }
      await fetchAllData();
      handleCloseFormModal();
    } catch (error) {
      console.error('[ESCALA ERROR]', error as Error);
      setError('Falha ao salvar a escala.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Você tem certeza?')) {
      try {
        await deleteSchedule(id);
        setSuccessMessage('Escala deletada com sucesso!');
        await fetchAllData();
      } catch (error) {
        setError('Falha ao deletar a escala.');
        console.error('[DELETE ERROR]', error);
      } finally {
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  };

  const handleAddUserToSchedule = async (userId: number, skill: string) => {
    if (!selectedSchedule) return;
    try {
      await addUserToSchedule(selectedSchedule.id, userId, skill);
      setSuccessMessage('Usuário adicionado com sucesso!');
      // Optimistically update UI
      const userToAdd = allUsers.find(u => u.id === userId);
      if (userToAdd) {
        setSelectedSchedule(prev => prev ? { ...prev, users: [...prev.users, { userId, skill, user: userToAdd, scheduleId: prev.id, assignedAt: new Date().toISOString() }] } : null);
      }
      await fetchAllData(); // Re-fetch to ensure UI is fully in sync
    } catch (error) {
      setError('Falha ao adicionar usuário à escala.');
      console.error('[ADD USER ERROR]', error);
    }
  };

  const handleRemoveUserFromSchedule = async (userId: number) => {
    if (!selectedSchedule) return;
    try {
      await removeUserFromSchedule(selectedSchedule.id, userId);
      setSuccessMessage('Usuário removido com sucesso!');
      // Optimistically update UI
      setSelectedSchedule(prev => prev ? { ...prev, users: prev.users.filter(u => u.userId !== userId) } : null);
      await fetchAllData(); // Re-fetch to ensure UI is in sync
    } catch (error) {
      setError('Falha ao remover usuário da escala.');
      console.error('[REMOVE USER ERROR]', error);
    }
  };

  const handleAssignTask = async (taskId: number) => {
    if (!selectedSchedule) return;
    try {
      await assignTaskToSchedule(taskId, selectedSchedule.id);
      setSuccessMessage('Tarefa atribuída com sucesso!');
      await fetchAllData();
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data ? (axiosError.response.data as ErrorResponse).message : undefined;
      setError(typeof errorMessage === 'string' ? errorMessage : 'Falha ao atribuir tarefa.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleUnassignTask = async (taskId: number) => {
    if (!selectedSchedule) return;
    try {
      await unassignTaskFromSchedule(taskId);
      setSuccessMessage('Tarefa desatribuída com sucesso!');
      await fetchAllData();
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data ? (axiosError.response.data as ErrorResponse).message : undefined;
      setError(typeof errorMessage === 'string' ? errorMessage : 'Falha ao desatribuir tarefa.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <FaCross 
    className="animate-bounce delay-75 text-9xl text-blue-200 mx-auto my-40 bg-sky-900 rounded-3xl p-2 border-2 border-cyan-400" />;
  }

  const filteredSchedules = schedules.filter(schedule => {
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

  const groupedSchedules = groupSchedulesByDate(filteredSchedules);

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-gray-900 p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-200 justify-center">Gerenciar Escalas</h1>
          <div className="flex flex-col md:flex-row md:space-x-0  md:space-y-0 gap-3 space-y-2"> 
            <button
              onClick={handleBack}
              className="md:w-fit justify-center bg-gray-500 hover:bg-gray-700 text-white text-sm py-2 px-4 rounded flex items-center"
            >
              <FaArrowLeft className="mr-2 text-sm" /> Voltar
            </button>
            <button onClick={() => handleOpenFormModal()} className="md:w-fit justify-center bg-blue-500 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded flex items-center">
              <FaPlus className="mr-2" /> Criar Escala
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <span className="text-gray-400">Buscar:</span>
            <input
              type="text"
              placeholder="Buscar escalas pelo nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-700 bg-gray-800 text-white rounded-md"
            />
          </div>
          <div className="flex-1">
            <span className="text-gray-400">Filtrar por data do dia da Escala:</span>
            <input
              type="date"
              placeholder="Filtrar por data do dia da Escala..."
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

        {loading ? (
          <FaCross 
            className="animate-bounce delay-75 text-9xl text-blue-200 mx-auto my-40 bg-sky-900 rounded-3xl p-2 border-2 border-cyan-400"
          />

        ) : error ? (
          <p className="text-red-500">{error}</p>
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
                              <button onClick={() => handleOpenTaskModal(schedule)} className="text-sm text-white bg-emerald-700 hover:bg-emerald-500 border rounded-3xl p-1 flex items-center" title="Gerenciar tarefas">
                                <FaTasks />
                                <span className='ml-1 hidden sm:block'> Músicas</span>
                              </button>
                              <button onClick={() => handleOpenUserModal(schedule)} className="text-sm text-white bg-blue-700 hover:bg-blue-500 border rounded-3xl p-1 flex items-center" title="Gerenciar usuários">
                                <FaUsers />
                                <span className='ml-1 hidden sm:block'> Ministros</span>
                              </button>
                              <DownloadScheduleButton schedule={schedule} />
                              <button onClick={() => handleOpenFormModal(schedule)} className="text-sm text-white bg-indigo-600 hover:bg-indigo-900 border rounded-3xl p-1 flex items-center" title="Editar">
                                <FaEdit />
                                <span className='ml-1 hidden sm:block'> Editar</span>
                              </button>
                              <button onClick={() => handleDelete(schedule.id)} className="text-sm text-white bg-red-600 hover:bg-red-900 border rounded-3xl p-1 flex items-center" title="Deletar">
                                <FaTrash />
                                <span className='ml-1 hidden sm:block'> Deletar</span>
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
                              <h4 className="font-semibold text-gray-900">Músicas nesta escala:</h4>
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
          </div>
        )}

        {isFormModalOpen && (
          <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={selectedSchedule && isFormModalOpen ? 'Editar escala' : 'Criar escala'}>
            <ScheduleForm
              scheduleToEdit={selectedSchedule ? { ...selectedSchedule, file: null } : null}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseFormModal}
              successMessage={successMessage || undefined}
              onFileUpload={(file) => handleFileUpload(file, selectedSchedule?.id ?? 0)}
            />
          </Modal>
        )}

        {isUserModalOpen && selectedSchedule && (
          <Modal isOpen={isUserModalOpen} onClose={handleCloseUserModal} title={`Gerenciar usuários para ${selectedSchedule.name}`}>
            <ScheduleUserManagement
              schedule={selectedSchedule}
              allUsers={allUsers}
              onAddUser={handleAddUserToSchedule}
              onRemoveUser={handleRemoveUserFromSchedule}
            />
          </Modal>
        )}

        {isTaskModalOpen && selectedSchedule && (
          <Modal isOpen={isTaskModalOpen} onClose={handleCloseTaskModal} title={`Gerenciar tarefas para ${selectedSchedule.name}`}>
            <ScheduleTaskManagement schedule={selectedSchedule} allTasks={allTasks} onAssignTask={handleAssignTask} onUnassignTask={handleUnassignTask} onFileUpload={(file) => handleFileUpload(file, selectedSchedule?.id ?? 0)} />
          </Modal>
        )}
      </div>
    </PrivateRoute>
  );
}