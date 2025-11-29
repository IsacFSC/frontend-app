'use client';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { approveTask, createTask, deleteTask, getTasks, rejectTask, Task, TaskStatus, updateTask } from '@/services/taskService';
import toast, { Toaster } from 'react-hot-toast';
import { getUsers, User } from '@/services/userService';
import { FaArrowLeft, FaBan, FaCheck, FaChevronLeft, FaChevronRight, FaCross, FaEdit, FaEllipsisV, FaPlus, FaSearch, FaTimes, FaTrashAlt } from 'react-icons/fa';
import PrivateRoute from '@/components/PrivateRoute';
import DescriptionWithReadMore from '@/components/DescriptionWithReadMore';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import Modal from '@/components/Modal';
import TaskForm from '@/components/TaskForm';
import { useRouter } from 'next/navigation';

const linkify = (text: string) => {
  if (!text) return null;
  const urlRegex = /(https?:\[^\s]+)/g;
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

const formatDateTime = (d?: string | Date | null) => {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    console.log(e);
    return String(d);
  }
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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);

  const [usersForFilter, setUsersForFilter] = useState<User[]>([]);
  const [filters, setFilters] = useState({
    userId: '',
    status: '',
    startDate: '',
    endDate: '',
    name: '',
  });
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);


  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const limit = itemsPerPage === 'all' ? 'all' : Number(itemsPerPage);
      const offset = (itemsPerPage !== 'all' && (currentPage - 1) * itemsPerPage) || 0;

      const activeFilters: { [key: string]: string | number } = {};
      (Object.keys(filters) as Array<keyof typeof filters>).forEach(key => {
        const value = filters[key];
        if (value) {
          activeFilters[key] = value;
        }
      });

      const response = await getTasks({
        limit,
        offset,
        ...activeFilters,
      });
      setTasks(response.data);
      setTotalTasks(response.total);
    } catch (err) {
      toast.error('Falha ao buscar tarefas.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, itemsPerPage]);

  const fetchUsersForFilter = useCallback(async () => {
    if (user?.role === 'ADMIN') {
      try {
        const { users: fetchedUsers } = await getUsers({limit: 'all'});
        setUsersForFilter(fetchedUsers);
      } catch (err) {
        console.error('Failed to fetch users for filter:', err);
      }
    }
  }, [user?.role]);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'LEADER')) {
      fetchTasks();
      if (user.role === 'ADMIN') {
        fetchUsersForFilter();
      }
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
    fetchTasks();
  };

  const totalPages = useMemo(() => {
    if (itemsPerPage === 'all' || totalTasks === 0) return 1;
    return Math.ceil(totalTasks / Number(itemsPerPage));
  }, [totalTasks, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setItemsPerPage(value === 'all' ? 'all' : Number(value));
    setCurrentPage(1);
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
    const toastId = toast.loading(editingTask ? 'Atualizando tarefa...' : 'Criando tarefa...');
    try {
      if (editingTask) {
        await updateTask(editingTask.id, data);
        toast.success('Tarefa atualizada com sucesso!', { id: toastId });
      } else {
        await createTask(data);
        toast.success('Tarefa criada com sucesso!', { id: toastId });
      }
      handleClearFilters();
      await fetchTasks();
      handleCloseModal();
    } catch (error) {
      console.error('Falha ao salvar tarefa: ', error);
      toast.error('Não foi possível salvar os detalhes da tarefa.', { id: toastId });
    }
  };

  const handleDelete = (id: number) => {
    setItemToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const executeDelete = async () => {
    if (itemToDelete === null) return;
    const toastId = toast.loading('Excluindo tarefa...');
    try {
      await deleteTask(itemToDelete);
      toast.success('Tarefa excluída com sucesso!', { id: toastId });
      await fetchTasks();
    } catch (error) {
      console.error('Falha ao deletar a tarefa: ', error);
      toast.error('Não foi possível deletar a tarefa.', { id: toastId });
    } finally {
      setItemToDelete(null);
    }
  };

  const handleApprove = async (id: number) => {
    const toastId = toast.loading('Aprovando tarefa...');
    try {
      await approveTask(id);
      toast.success('Tarefa aprovada com sucesso!', { id: toastId });
      await fetchTasks();
    } catch (error) {
      console.error('Falha ao aprovar a tarefa: ', error);
      toast.error('Não foi possível aprovar a tarefa.', { id: toastId });
    }
  };

  const handleReject = async (id: number) => {
    const toastId = toast.loading('Rejeitando tarefa...');
    try {
      await rejectTask(id);
      toast.success('Tarefa rejeitada com sucesso!', { id: toastId });
      await fetchTasks();
    } catch (error) {
      console.error('Falha ao rejeitar a tarefa: ', error);
      toast.error('Não foi possível rejeitar a tarefa.', { id: toastId });
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
    return
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
        <FaCross 
          className="animate-bounce delay-75 text-9xl text-blue-200 p-2 rounded-md border-2 border-cyan-400"
        />
      </div>;
  }

  return (
    <PrivateRoute>
      <div className="px-2 sm:px-8 bg-gray-900 py-4 sm:py-8">
        <Toaster position="top-center" reverseOrder={false} />
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-100">Gerenciar Tarefas</h1>
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

        <div className="p-4 bg-gray-800 rounded-lg mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white">Nome da Tarefa</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Buscar por nome..."
                value={filters.name}
                onChange={handleFilterChange}
                className="p-2 border rounded w-full mt-1 bg-gray-800 border-gray-400 text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setShowMoreFilters(s => !s)}
                className="w-full flex bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 border-1,
                rounded-md hover:scale-102 font-semibold duration-75 justify-center"
              >
                {showMoreFilters ? 'Ocultar filtros' : 'Mais filtros'}
              </button>
            </div>
          </div>
          {showMoreFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              {user?.role === 'ADMIN' && (
                <div>
                  <label htmlFor="userId" className="block text-sm font-medium text-white">Usuário</label>
                  <select id="userId" name="userId" value={filters.userId} onChange={handleFilterChange}
                    className="p-2 border rounded w-full mt-1 bg-gray-800 text-white">
                    <option value="">Todos</option>
                    {usersForFilter.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-white">Status</label>
                <select id="status" name="status" value={filters.status} onChange={handleFilterChange}
                  className="p-2 border rounded w-full mt-1 bg-gray-800 text-white">
                  <option value="">Todos</option>
                  {Object.values(TaskStatus).map(s => (
                    <option key={s} value={s}>{translateStatus(s)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-white">Data Inícial</label>
                <input id="startDate" type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="p-2 border rounded w-full mt-1 bg-gray-800 text-white" />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-white">Data Final</label>
                <input id="endDate" type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="p-2 border rounded w-full mt-1 bg-gray-800 text-white" />
              </div>
            </div>
          )}
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
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
            <FaCross 
              className="animate-bounce delay-75 text-9xl text-blue-200 p-2 rounded-md border-2 border-cyan-400"
            />
          </div>
        }

        {!loading && (
          <>
            <div className="bg-gray-700 shadow-md rounded-lg overflow-x-auto overflow-visible">
              <table className="min-w-full leading-normal">
                <thead>
                  <tr>
                    <th className="px-5 py-3 border-b-2 border-gray-500 bg-gray-700 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider sticky left-0 z-10 md:w-40 lg:w-64 xl:w-80">Tarefa</th>
                    <th className="px-5 py-3 border-b-2 border-gray-500 bg-gray-800 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 border-b-2 border-gray-500 bg-gray-800 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Criado por</th>
                    <th className="px-5 py-3 border-b-2 border-gray-500 bg-gray-800 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Criado em</th>
                    <th className="px-5 py-3 border-b-2 border-gray-500 bg-gray-800 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Última atualização</th>
                    <th className="px-5 py-3 border-b-2 border-gray-500 bg-gray-800 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td className="px-5 py-5 border-b border-gray-500 bg-gray-600 text-sm sticky left-0 z-10 w-40 lg:w-64 xl:w-80 h-24 align-top overflow-hidden">
                        <button onClick={() => handleOpenModal(task)} className="text-left w-fit">
                          <p className="text-gray-100 truncate w-full block font-bold lg:text-lg p-1.5 border-t-2 border-blue-900 border-r-2 rounded-md hover:underline">{task.name}</p>
                          <div className="text-gray-300 mt-1">
                            <DescriptionWithReadMore>
                              <div className="text-sm text-gray-300 truncate w-40">{linkify(task.description)}</div>
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
                        <p className="text-gray-100 whitespace-nowrap">{task.user?.name || 'Não atribuído'}</p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-500 bg-gray-700 text-sm">
                        <p className="text-gray-100 whitespace-nowrap">{formatDateTime(task.createdAt)}</p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-500 bg-gray-700 text-sm">
                        <p className="text-gray-100 whitespace-nowrap">
                          {task.updatedAt ? formatDateTime(task.updatedAt) : formatDateTime(task.createdAt)}
                        </p>
                        <p className="text-gray-300 whitespace-nowrap text-xs">
                          {task.updatedBy?.email || task.updatedBy?.name || ''}
                        </p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-500 bg-gray-700 text-sm gap-2">
                        <div className="relative inline-block text-left w-full">
                          <Menu as="div" className="relative inline-block text-left">
                            {() => (
                              <>
                                <MenuButton className="flex items-center p-2 text-gray-200 hover:text-gray-400,
                                rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 ease-in-out,
                                hover:scale-105 font-semibold">
                                  <FaEllipsisV className="h-5 w-5" aria-hidden="true" />
                                </MenuButton>
                                <MenuItems className="absolute right-0 mt-2 w-40 origin-top-right bg-white divide-y divide-gray-100,
                                rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-60">
                                  <div className="py-1">
                                    <MenuItem>
                                      {({ focus}) => (
                                        <button
                                          onClick={() => handleOpenModal(task)}
                                          className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${focus? 'bg-blue-700 text-white' : 'text-gray-700'}`}
                                        >
                                          <FaEdit className="mr-3 h-4 w-4" />
                                          Editar
                                        </button>
                                      )}
                                    </MenuItem>
                                    <MenuItem>
                                      {({ focus}) => (
                                        <button
                                          onClick={() => handleDelete(task.id)}
                                          className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${focus? 'bg-red-600 text-white' : 'text-gray-700'}`}
                                          title="Deletar"
                                        >
                                          <FaTrashAlt className="mr-3 h-4 w-4" />
                                          Deletar
                                        </button>
                                      )}
                                    </MenuItem>
                                    {task.status === TaskStatus.PENDING && (
                                      <>
                                        <MenuItem>
                                          {({ focus}) => (
                                            <button
                                              onClick={() => handleApprove(task.id)}
                                              className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${focus? 'bg-green-600 text-white' : 'text-gray-700'}`}
                                              title="Aprovar"
                                            >
                                              <FaCheck className="mr-3 h-4 w-4" />
                                              Aprovar
                                            </button>
                                          )}
                                        </MenuItem>
                                        <MenuItem>
                                          {({ focus}) => (
                                            <button
                                              onClick={() => handleReject(task.id)}
                                              className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${focus? 'bg-yellow-600 text-white' : 'text-gray-700'}`}
                                              title="Rejeitar"
                                            >
                                              <FaBan className="mr-3 h-4 w-4" />
                                              Rejeitar
                                            </button>
                                          )}
                                        </MenuItem>
                                      </>
                                    )}
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

            <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-gray-800 gap-4 text-gray-300">
               <div className="flex items-center">
                <label htmlFor="itemsPerPage" className="hidden sm:inline mr-2">Itens por página:</label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="px-2 py-1 rounded border text-gray-100 border-gray-400 focus:outline-none focus:ring focus:border-blue-300 bg-gray-700"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="all">Todos</option>
                </select>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded bg-gray-600 text-white disabled:opacity-50 flex items-center"
                >
                  <FaChevronLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>
                <span className="mx-2 sm:mx-4 text-sm sm:text-base">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded bg-gray-600 text-white disabled:opacity-50 flex items-center"
                >
                  <span className="hidden sm:inline">Próximo</span>
                  <FaChevronRight className="h-4 w-4 sm:ml-2" />
                </button>
              </div>
            </div>
          </>
        )}

        {isModalOpen && (
          <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTask ? 'Editar tarefa' : 'Criar tarefa'}>
            <TaskForm
              taskToEdit={editingTask}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseModal}
            />
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