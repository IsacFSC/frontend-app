'use client';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

import { useEffect, useState, useCallback } from 'react';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  Task,
  TaskStatus,
} from '../../../services/taskService';
import Modal from '../../../components/Modal';
import TaskForm from '../../../components/TaskForm';
import DescriptionWithReadMore from '../../../components/DescriptionWithReadMore';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PrivateRoute from '@/components/PrivateRoute';
import { FaPlus, FaArrowLeft, FaSearch, FaTimes, FaEdit, FaTrash, FaChevronLeft, FaChevronRight, FaSpinner, FaSpider, FaAngleUp, FaCross } from 'react-icons/fa';

const ITEMS_PER_PAGE = 10;

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
              className="text-blue-400 hover:text-blue-600 hover:underline break-all max-w-[160px] sm:max-w-[240px] md:max-w-[320px] lg:max-w-[400px]"
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

const translateStatus = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.APPROVED:
      return 'Aprovado';
    case TaskStatus.REJECTED:
      return 'Rejeitado';
    case TaskStatus.PENDING:
    default:
      return 'Pendente';
  }
};

export default function TaskManagementPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = status === 'authenticated';
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    name: '',
  });

  const fetchTasks = useCallback(async (pageParam: number = currentPage) => {
    try {
      setLoading(true);
      const offset = (pageParam - 1) * ITEMS_PER_PAGE;

      const activeFilters: { [key: string]: string | number } = {};
      (Object.keys(filters) as Array<keyof typeof filters>).forEach((key) => {
        const value = filters[key];
        if (value) {
          activeFilters[key] = value;
        }
      });

      const response = await getTasks({
        limit: ITEMS_PER_PAGE,
        offset,
        ...activeFilters,
      });
      setTasks(response.data);
      setTotalPages(Math.ceil(response.total / ITEMS_PER_PAGE));
      setError(null);
      setCurrentPage(pageParam);
    } catch (err) {
      setError('Falha ao buscar tarefas.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'LEADER')) {
      fetchTasks();
    }
  }, [fetchTasks, isAuthenticated, user]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchTasks(1);
  };

  const handleClearFilters = () => {
    setFilters({ status: '', startDate: '', endDate: '', name: '' });
    setCurrentPage(1);
    // We need to trigger a re-fetch after clearing filters
    fetchTasks(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      // Directly fetch the requested page
      fetchTasks(newPage);
    }
  };

  const handleOpenModal = (task: Task | null = null) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingTask(null);
    setIsModalOpen(false);
  };

  const handleFormSubmit = async (data: { name: string; description: string; taskDate: string }) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, data);
        setSuccessMessage('Tarefa atualizada com sucesso!');
      } else {
        await createTask(data);
        setSuccessMessage('Tarefa criada com sucesso!');
      }
      // Reset filters and show first page with fresh data
      handleClearFilters();
      await fetchTasks(1);
      handleCloseModal();
    } catch (error) {
      console.error('Falha ao salvar tarefa: ', error);
      setError('Não foi possível salvar os detalhes da tarefa.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Você tem certeza de que deseja excluir esta tarefa?')) {
      try {
        await deleteTask(id);
        setSuccessMessage('Tarefa excluída com sucesso!');
        await fetchTasks();
      } catch (error) {
        console.error('Falha ao deletar a tarefa: ', error);
        setError('Não foi possível deletar a tarefa.');
      } finally {
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  };

  const getStatusClass = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.APPROVED:
        return 'bg-green-200 text-green-900 border-0 rounded-md font-semibold duration-75 p-1 shadow-sky-800 shadow-md';
      case TaskStatus.REJECTED:
        return 'bg-red-200 text-red-900 border-0 rounded-md font-semibold duration-75 p-1 shadow-sky-800 shadow-md';
      case TaskStatus.PENDING:
      default:
        return 'bg-yellow-200 text-yellow-900 border-0 rounded-md font-semibold duration-75 p-1 shadow-sky-800 shadow-md';
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'LEADER')) {
    return <FaCross 
              className="animate-bounce delay-75 text-9xl text-blue-200 mx-auto my-40 bg-sky-900 rounded-3xl p-2 border-2 border-cyan-400"
            />
  }

  return (
    <PrivateRoute>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-200">Gerenciar Tarefas</h1>
          <div className="flex space-x-4 flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <button
              onClick={handleBack}
              className="bg-gray-500 hover:bg-gray-700 text-white text-sm w-full justify-center py-2 px-4 rounded flex items-center"
            >
              <FaArrowLeft className="mr-2" /> Voltar
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-500 hover:bg-blue-700 text-white text-sm w-fit justify-center py-2 px-4 rounded flex items-center"
            >
              <FaPlus className="mr-2" /> Criar Tarefa
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-700 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white">Nome da Tarefa</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Buscar por nome..."
                value={filters.name}
                onChange={handleFilterChange}
                className="p-2 border rounded w-full mt-1 bg-gray-800 text-white"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-white">Status</label>
              <select id="status" name="status" value={filters.status} onChange={handleFilterChange} className="p-2 border rounded w-full mt-1 bg-gray-800 text-white">
                <option value="">Todos</option>
                {Object.values(TaskStatus).map(s => (
                  <option key={s} value={s}>{translateStatus(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-white">Criação (Início)</label>
              <input id="startDate" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="p-2 border rounded w-full mt-1 bg-gray-800 text-white" />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-white">Criação (Fim)</label>
              <input id="endDate" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="p-2 border rounded w-full mt-1 bg-gray-800 text-white" />
            </div>
          </div>
          <div className="mt-4 flex space-x-2">
            <button onClick={handleApplyFilters} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded flex items-center">
              <FaSearch className="mr-2" /> Aplicar Filtros
            </button>
            <button onClick={handleClearFilters} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded text-gray-800 flex items-center">
              <FaTimes className="mr-2" /> Limpar Filtros
            </button>
          </div>
        </div>

        {loading && 
          <FaCross 
            className="animate-bounce delay-75 text-9xl text-blue-200 mx-auto my-40 bg-sky-900 rounded-3xl p-2 border-2 border-cyan-400"
          />
        }
        {error && <p className="text-red-500">{error}</p>}
        {successMessage && <p className="text-green-500">{successMessage}</p>}

        {!loading && !error && (
          <>
            <div className="bg-gray-700 shadow-md rounded-lg overflow-x-auto verflow-visible">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr>
                    <th className="px-5 py-3 border-b-2 border-gray-500 bg-gray-800 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider sticky left-0 z-50 w-fit md:w-48">Tarefa</th>
                    <th className="px-5 py-3 border-b-2 border-gray-500 bg-gray-800 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 border-b-2 border-gray-500 bg-gray-800 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Criado por</th>
                    <th className="px-5 py-3 border-b-2 border-gray-500 bg-gray-800 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-5 py-5 border-b border-gray-500 bg-gray-700 text-sm sticky left-0 z-50 w-48 h-24 align-top overflow-hidden">
                        <button onClick={() => handleOpenModal(task)} className="text-left w-full">
                          <p className="text-gray-100 truncate block font-semibold">{task.name}</p>
                          <div className="text-gray-300 mt-1">
                            <DescriptionWithReadMore>
                              <div className="text-sm text-gray-300">{linkify(task.description)}</div>
                            </DescriptionWithReadMore>
                          </div>
                        </button>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-500 bg-gray-700 text-sm">
                        <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${getStatusClass(task.status)}`}>
                          <span aria-hidden className="absolute inset-0 opacity-50 rounded-full"></span>
                          <span className="relative">{translateStatus(task.status)}</span>
                        </span>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-500 bg-gray-700 text-sm">
                        <p className="text-gray-100 whitespace-no-wrap">{task.user?.name || 'Não atribuído'}</p>
                      </td>
                      <td className="px-5 py-24 border-b border-gray-500 bg-gray-700 text-sm">
                        <div className="relative inline-block text-left w-full">
                          <Menu>
                            {() => (
                              <>
                                <MenuButton className="w-full flex justify-center items-center bg-gray-800 text-white rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                  <span className="mr-2"><FaEdit /></span>
                                  <span className="md:inline">Ações</span>
                                  <svg className="ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </MenuButton>
                                <MenuItems className="absolute z-50 left-0 mt-2 w-44 origin-top-right bg-gray-300 border border-gray-400 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none">
                                  <div className="py-1 w-full">
                                    <MenuItem>
                                      {({ active }) => (
                                        <button
                                          onClick={() => handleOpenModal(task)}
                                          className={`w-full flex items-center px-4 py-2 text-sm rounded ${active ? 'bg-indigo-600 text-white' : 'text-indigo-700'} transition-colors`}
                                          title="Editar"
                                        >
                                          <FaEdit className="mr-2" /> Editar
                                        </button>
                                      )}
                                    </MenuItem>
                                    <MenuItem>
                                      {({ active }) => (
                                        <button
                                          onClick={() => handleDelete(task.id)}
                                          disabled={task.status !== TaskStatus.PENDING}
                                          className={`w-full flex items-center px-4 py-2 text-sm rounded ${active ? 'bg-red-600 text-white' : 'text-red-700'} transition-colors ${task.status !== TaskStatus.PENDING ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          title="Deletar"
                                        >
                                          <FaTrash className="mr-2" /> Deletar
                                        </button>
                                      )}
                                    </MenuItem>
                                  </div>
                                </MenuItems>
                              </>
                            )}
                          </Menu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="py-4 flex justify-between items-center text-gray-300">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-600 rounded disabled:opacity-50 text-white flex items-center"
              >
                <FaChevronLeft className="mr-2" /> Anterior
              </button>
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-600 rounded disabled:opacity-50 text-white flex items-center"
              >
                Próximo <FaChevronRight className="ml-2" />
              </button>
            </div>
          </>
        )}

        {isModalOpen && (
          <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTask ? 'Editar tarefa' : 'Criar tarefa'}>
            <TaskForm
              taskToEdit={editingTask}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseModal}
              successMessage={successMessage}
            />
          </Modal>
        )}
      </div>
    </PrivateRoute>
  );
}
