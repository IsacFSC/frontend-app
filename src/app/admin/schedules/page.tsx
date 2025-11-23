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
import type { Schedule } from '../../../services/scheduleService';
import PrivateRoute from '@/components/PrivateRoute';
import { FaPlus, FaArrowLeft, FaTasks, FaUsers, FaEdit, FaTrash, FaCross, FaFileUpload } from 'react-icons/fa';
import DownloadScheduleButton from '@/components/DownloadScheduleButton';
import toast, { Toaster } from 'react-hot-toast';

import ConfirmationModal from '../../../components/ConfirmationModal';



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

  const [searchTerm, setSearchTerm] = useState('');

  const [dateFilter, setDateFilter] = useState('');



  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);

  const [selectedFileForUpload, setSelectedFileForUpload] = useState<File | null>(null);

  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<number | null>(null);



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

    } catch (err) {

      toast.error('Falha ao buscar dados. Tente novamente mais tarde.');

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

    const toastId = toast.loading('Enviando arquivo...');

    try {

      await uploadScheduleFile(scheduleId, file);

      toast.success('Arquivo enviado com sucesso!', { id: toastId });

      await fetchAllData(); 

    } catch (error) {

      const axiosError = error as AxiosError;

      const data = axiosError.response?.data as ErrorResponse

      const errorMessage = data && typeof data.message === 'string' ? data.message : 'Falha ao enviar arquivo.';

      toast.error(errorMessage, { id: toastId });

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



  const handleFormSubmit = async (data: ScheduleFormData) => {

    const toastId = toast.loading(selectedSchedule ? 'Atualizando escala...' : 'Criando escala...');

    try {

      if (selectedSchedule) {

        const { file: _unused, ...dataWithoutFile } = data;

        await updateSchedule(selectedSchedule.id, dataWithoutFile);

        toast.success('Escala atualizada com sucesso!', { id: toastId });

      } else {

        const { file: _unusedFile, ...scheduleDataWithoutFile } = data;

        await createSchedule(scheduleDataWithoutFile);

        toast.success('Escala criada com sucesso!', { id: toastId });

      }

      await fetchAllData();

      handleCloseFormModal();

    } catch (error) {

      console.error('[ESCALA ERROR]', error as Error);

      toast.error('Falha ao salvar a escala.', { id: toastId });

    }

  };



  const handleDelete = (id: number) => {

    setItemToDelete(id);

    setIsConfirmModalOpen(true);

  };



  const executeDelete = async () => {

    if (itemToDelete === null) return;



    const toastId = toast.loading('Deletando escala...');

    try {

      await deleteSchedule(itemToDelete);

      toast.success('Escala deletada com sucesso!', { id: toastId });

      await fetchAllData();

    } catch (error) {

      toast.error('Falha ao deletar a escala.', { id: toastId });

      console.error('[DELETE ERROR]', error);

    } finally {

      setItemToDelete(null);

    }

  };



  const handleAddUserToSchedule = async (userId: number, skill: string) => {

    if (!selectedSchedule) return;

    const toastId = toast.loading('Adicionando usuário...');

    try {

      await addUserToSchedule(selectedSchedule.id, userId, skill);

      toast.success('Usuário adicionado com sucesso!', { id: toastId });

      // Optimistically update UI

      const userToAdd = allUsers.find(u => u.id === userId);

      if (userToAdd) {

        setSelectedSchedule(prev => prev ? { ...prev, users: [...prev.users, { userId, skill, user: userToAdd, scheduleId: prev.id, assignedAt: new Date().toISOString() }] } : null);

      }

      await fetchAllData(); // Re-fetch to ensure UI is fully in sync

    } catch (error) {

      toast.error('Falha ao adicionar usuário à escala.', { id: toastId });

      console.error('[ADD USER ERROR]', error);

    }

  };



  const handleRemoveUserFromSchedule = async (userId: number) => {

    if (!selectedSchedule) return;

    const toastId = toast.loading('Removendo usuário...');

    try {

      await removeUserFromSchedule(selectedSchedule.id, userId);

      toast.success('Usuário removido com sucesso!', { id: toastId });

      // Optimistically update UI

      setSelectedSchedule(prev => prev ? { ...prev, users: prev.users.filter(u => u.userId !== userId) } : null);

      await fetchAllData(); // Re-fetch to ensure UI is in sync

    } catch (error) {

      toast.error('Falha ao remover usuário da escala.', { id: toastId });

      console.error('[REMOVE USER ERROR]', error);

    }

  };



  const handleAssignTask = async (taskId: number) => {

    if (!selectedSchedule) return;

    const toastId = toast.loading('Atribuindo tarefa...');

    try {

      await assignTaskToSchedule(taskId, selectedSchedule.id);

      toast.success('Tarefa atribuída com sucesso!', { id: toastId });

      await fetchAllData();

    } catch (error: unknown) {

      const axiosError = error as AxiosError;

      const errorMessage = axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data ? (axiosError.response.data as ErrorResponse).message : 'Falha ao atribuir tarefa.';

      toast.error(errorMessage, { id: toastId });

    }

  };



  const handleUnassignTask = async (taskId: number) => {

    if (!selectedSchedule) return;

    const toastId = toast.loading('Desatribuindo tarefa...');

    try {

      await unassignTaskFromSchedule(taskId);

      toast.success('Tarefa desatribuída com sucesso!', { id: toastId });

      await fetchAllData();

    } catch (error: unknown) {

      const axiosError = error as AxiosError;

      const errorMessage = axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data ? (axiosError.response.data as ErrorResponse).message : 'Falha ao desatribuir tarefa.';

      toast.error(errorMessage, { id: toastId });

    }

  };



  const handleBack = () => {

    router.back();

  };



  if (!isAuthenticated || user?.role !== 'ADMIN') {

    return

    // Container principal: fixed, tela cheia, bg preto com opacidade 75%

    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">

      {/* Ícone de Loading: centralizado, sem background próprio */}

      <FaCross 

        className="animate-bounce delay-75 text-9xl text-blue-200 p-2 rounded-md border-2 border-cyan-400"

      />

    </div>;

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

        <Toaster position="top-center" reverseOrder={false} />

        <div className="flex justify-between items-center mb-6">

          <h1 className="text-3xl font-bold text-gray-200 justify-center">Gerenciar Escalas</h1>

          <div className="flex flex-col md:flex-row md:space-x-0  md:space-y-0 gap-3 space-y-2"> 

            <button

              onClick={handleBack}

              className="md:w-fit justify-center bg-gray-500 hover:bg-gray-700,

               text-white text-sm py-2 px-4 rounded flex items-center"

            >

              <FaArrowLeft className="mr-2 text-sm" /> Voltar

            </button>

            <button onClick={() => handleOpenFormModal()}

              className="md:w-fit justify-center bg-blue-500 hover:bg-blue-700,

               text-white text-sm py-2 px-4 rounded flex items-center">

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

          // Container principal: fixed, tela cheia, bg preto com opacidade 75%

          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">

            {/* Ícone de Loading: centralizado, sem background próprio */}

            <FaCross 

              className="animate-bounce delay-75 text-9xl text-blue-200 p-2 rounded-md border-2 border-cyan-400"

            />

          </div>



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

                        <div key={schedule.id} className="p-6 rounded-lg shadow-blue-600 shadow-lg bg-violet-200 hover:bg-violet-300 transition-shadow">

                          <div className="flex justify-between md:items-center flex-col md:flex-row">

                            <div className="flex-1">

                              <h3 className="text-xl font-bold text-gray-900 flex items-center justify-center space-x-2 mt-4 md:mt-0 uppercase">{schedule.name}</h3>

                              <p className="text-gray-700 flex items-center justify-center space-x-2 mt-4 md:mt-0">{schedule.description}</p>

                              <p className="text-sm text-gray-600 mt-2 md:inline-flex text-center">

                                <strong>Início:</strong> {new Date(schedule.startTime).toLocaleString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric'})} {/*, hour: '2-digit', minute: '2-digit'*/}

                              </p>

                              <p className="text-sm text-gray-600 mt-2 md:inline-flex text-center sm:ml-4">

                                <strong>Fim:</strong> {new Date(schedule.endTime).toLocaleString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric'})} {/*, hour: '2-digit', minute: '2-digit'*/}

                              </p>

                            </div>

                            <div className="flex items-center justify-center space-x-2 mt-4 md:mt-0">

                              <button onClick={() => handleOpenTaskModal(schedule)} className="text-md text-white,

                                border-0 rounded-md hover:scale-105 font-semibold duration-75 p-1.5 bg-emerald-900 hover:bg-emerald-950 shadow-sky-800 shadow-md flex items-center"

                                title="Gerenciar tarefas">

                                <FaTasks />

                                <span className='ml-1 hidden sm:block'> Músicas</span>

                              </button>

                              <button onClick={() => handleOpenUserModal(schedule)} className="text-md text-white,

                                border-0 rounded-md hover:scale-105 font-semibold duration-75 p-1.5 bg-blue-900 hover:bg-blue-950 shadow-sky-800 shadow-md flex items-center"

                                title="Gerenciar usuários">

                                <FaUsers />

                                <span className='ml-1 hidden sm:block'> Ministros</span>

                              </button>

                              <DownloadScheduleButton schedule={schedule} />

                              <button onClick={() => handleOpenFormModal(schedule)} className="text-md text-white,

                                border-0 rounded-md hover:scale-105 font-semibold duration-75 p-1.5 bg-indigo-900 hover:bg-indigo-950 shadow-sky-800 shadow-md flex items-center"

                                title="Editar">

                                <FaEdit />

                                <span className='ml-1 hidden sm:block'> Editar</span>

                              </button>

                              <button onClick={() => handleOpenFileUploadModal(schedule)} className="text-md text-white,

                                border-0 rounded-md hover:scale-105 font-semibold duration-75 p-1.5 bg-cyan-600 hover:bg-cyan-800 shadow-sky-800 shadow-md flex items-center"

                                title="Anexar Arquivo">

                                <FaFileUpload />

                                <span className='ml-1 hidden sm:block'> Anexar</span>

                              </button>

                              <button onClick={() => handleDelete(schedule.id)} className="text-md text-white ,

                              border-0 rounded-md hover:scale-105 font-semibold duration-75 p-1.5 bg-red-800 hover:bg-red-950 shadow-sky-800 shadow-md flex items-center"

                              title="Deletar">

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

        <ConfirmationModal

          isOpen={isConfirmModalOpen}

          onClose={() => setIsConfirmModalOpen(false)}

          onConfirm={executeDelete}

          title="Confirmar Exclusão"

          message="Você tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."

        />

      </div>

    </PrivateRoute>

  );

}
