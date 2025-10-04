
'use client';
import { Menu } from '@headlessui/react';

import { useEffect, useState, useCallback } from 'react';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  approveTask,
  rejectTask,
  Task,
  TaskStatus,
} from '../../../services/taskService';
import { getUsers, User } from '../../../services/userService';
import Modal from '../../../components/Modal';
import TaskForm from '../../../components/TaskForm';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import PrivateRoute from '@/components/PrivateRoute';
import { FaPlus, FaArrowLeft, FaSearch, FaTimes, FaEdit, FaTrash, FaCheck, FaBan, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

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
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [usersForFilter, setUsersForFilter] = useState<User[]>([]);
  const [filters, setFilters] = useState({
    userId: '',
    status: '',
    startDate: '',
    endDate: '',
    name: '',
  });

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;

      const activeFilters: { [key: string]: any } = {};
      Object.entries(filters).forEach(([key, value]) => {
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
    } catch (err) {
      setError('Falha ao buscar tarefas.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  const fetchUsersForFilter = useCallback(async () => {
    if (user?.role === 'ADMIN') {
      try {
        const fetchedUsers = await getUsers();
        setUsersForFilter(fetchedUsers);
      } catch (err) {
        console.error('Failed to fetch users for filter:', err);
      }
    }
  }, [user?.role]);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'LEADER')) {
      fetchTasks();
      fetchUsersForFilter();
    }
  }, [fetchTasks, fetchUsersForFilter, isAuthenticated, user]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchTasks();
  };

  const handleClearFilters = () => {
    setFilters({ userId: '', status: '', startDate: '', endDate: '', name: '' });
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
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

  const handleFormSubmit = async (data: { name: string; description: string }) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, data);
        setSuccessMessage('Tarefa atualizada com sucesso!');
      } else {
        await createTask(data);
        setSuccessMessage('Tarefa criada com sucesso!');
      }
      handleClearFilters();
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

  const handleApprove = async (id: number) => {
    try {
      await approveTask(id);
      setSuccessMessage('Tarefa aprovada com sucesso!');
      await fetchTasks();
    } catch (error) {
      console.error('Falha ao aprovar a tarefa: ', error);
      setError('Não foi possível aprovar a tarefa.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectTask(id);
      setSuccessMessage('Tarefa rejeitada com sucesso!');
      await fetchTasks();
    } catch (error) {
      console.error('Falha ao rejeitar a tarefa: ', error);
      setError('Não foi possível rejeitar a tarefa.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const getStatusClass = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.APPROVED:
        return 'bg-green-200 text-green-900';
      case TaskStatus.REJECTED:
        return 'bg-red-200 text-red-900';
      case TaskStatus.PENDING:
      default:
        return 'bg-yellow-200 text-yellow-900';
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'LEADER')) {
    return <p>Redirecionando para a página de login...</p>;
  }

  return (
    <PrivateRoute>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-200">Gerenciamento de Tarefas</h1>
          <div className="flex space-x-4">
            <button
              onClick={handleBack}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <FaArrowLeft className="mr-2" /> Voltar
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <FaPlus className="mr-2" /> Criar Tarefa
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-700 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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
            {user?.role === 'ADMIN' && (
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-white">Usuário</label>
                <select id="userId" name="userId" value={filters.userId} onChange={handleFilterChange} className="p-2 border rounded w-full mt-1 bg-gray-800 text-white">
                  <option value="">Todos</option>
                  {usersForFilter.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}
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

        {loading && <p>Carregando tarefas...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {successMessage && <p className="text-green-500">{successMessage}</p>}

        {!loading && !error && (
          <>
            <div className="bg-gray-700 shadow-md rounded-lg overflow-visible">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr>
                    <th className="px-5 py-3 border-b-2 border-gray-500 bg-gray-800 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Tarefa</th>
                    <th className="px-5 py-3 border-b-2 border-gray-500 bg-gray-800 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 border-b-2 border-gray-500 bg-gray-800 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Criado por</th>
                    <th className="px-5 py-3 border-b-2 border-gray-500 bg-gray-800 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-5 py-5 border-b border-gray-500 bg-gray-700 text-sm">
                        <p className="text-gray-100 whitespace-no-wrap font-semibold">{task.name}</p>
                        <div className="text-gray-300 whitespace-no-wrap">{linkify(task.description)}</div>
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
                      <td className="px-5 py-24 border-b border-gray-500 bg-gray-700 text-sm flex flex-wrap gap-2">
                        <div className="relative inline-block text-left w-full">
                          <Menu>
                            {({ open }) => (
                              <>
                                <Menu.Button className="w-full flex justify-center items-center bg-gray-800 text-white rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                  <span className="mr-2"><FaEdit /></span>
                                  <span className="md:inline">Ações</span>
                                  <svg className="ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </Menu.Button>
                                <Menu.Items className="absolute z-50 left-0 mt-2 w-44 origin-top-right bg-gray-300 border border-gray-400 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none">
                                  <div className="py-1 w-full">
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => handleOpenModal(task)}
                                          className={`w-full flex items-center px-4 py-2 text-sm rounded ${active ? 'bg-indigo-600 text-white' : 'text-indigo-700'} transition-colors`}
                                          title="Editar"
                                        >
                                          <FaEdit className="mr-2" /> Editar
                                        </button>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => handleDelete(task.id)}
                                          className={`w-full flex items-center px-4 py-2 text-sm rounded ${active ? 'bg-red-600 text-white' : 'text-red-700'} transition-colors`}
                                          title="Deletar"
                                        >
                                          <FaTrash className="mr-2" /> Deletar
                                        </button>
                                      )}
                                    </Menu.Item>
                                    {task.status === TaskStatus.PENDING && (
                                      <>
                                        <Menu.Item>
                                          {({ active }) => (
                                            <button
                                              onClick={() => handleApprove(task.id)}
                                              className={`w-full flex items-center px-4 py-2 text-sm rounded ${active ? 'bg-green-600 text-white' : 'text-green-700'} transition-colors`}
                                              title="Aprovar"
                                            >
                                              <FaCheck className="mr-2" /> Aprovar
                                            </button>
                                          )}
                                        </Menu.Item>
                                        <Menu.Item>
                                          {({ active }) => (
                                            <button
                                              onClick={() => handleReject(task.id)}
                                              className={`w-full flex items-center px-4 py-2 text-sm rounded ${active ? 'bg-yellow-600 text-white' : 'text-yellow-700'} transition-colors`}
                                              title="Rejeitar"
                                            >
                                              <FaBan className="mr-2" /> Rejeitar
                                            </button>
                                          )}
                                        </Menu.Item>
                                      </>
                                    )}
                                  </div>
                                </Menu.Items>
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
