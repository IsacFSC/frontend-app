'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getUsers,
  createUser,
  deleteUser,
  updateUserByAdmin,
  User,
} from '../../../services/userService';
import Modal from '../../../components/Modal';
import UserForm from '../../../components/UserForm';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../services/api';
import PrivateRoute from '@/components/PrivateRoute';
import { FaPlus, FaArrowLeft, FaSearch, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { Menu } from '@headlessui/react';

export default function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    } else if (parts.length > 1) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return '';
  };

  const fetchUsers = useCallback(async () => {
    try {
      setPageLoading(true);
      const params = {
        search: search || undefined,
        active: statusFilter || undefined,
        role: roleFilter || undefined,
      };
      const fetchedUsers = await getUsers(params);
      setUsers(fetchedUsers);
      setError(null);
    } catch (err) {
      setError('Falha ao buscar usuários. Por favor, tente novamente mais tarde.');
      console.error(err);
    } finally {
      setPageLoading(false);
    }
  }, [search, statusFilter, roleFilter]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [fetchUsers, isAuthenticated, user]);

  const handleOpenModal = (user: User | null = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingUser) {
        await updateUserByAdmin(editingUser.id, data);
        setSuccessMessage('Usuário atualizado com sucesso!');
      } else {
        await createUser(data);
        setSuccessMessage('Usuário criado com sucesso!');
      }
      await fetchUsers(); // Refresh list
      handleCloseModal();
    } catch (error) {
      console.error('Falha ao salvar o usuário: ', error);
      setError('Não foi possível salvar os detalhes do usuário.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 2000);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Você tem certeza de que deseja excluir este usuário?')) {
      try {
        await deleteUser(id);
        setSuccessMessage('Usuário excluído com sucesso!');
        await fetchUsers(); // Refresh list
      } catch (error) {
        console.error('Falha ao deletar o usuário:', error);
        setError('Não foi possível deletar o usuário.');
      } finally {
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }
  };

  const handleToggleActiveStatus = async (id: number, currentStatus: boolean) => {
    try {
      await updateUserByAdmin(id, { active: !currentStatus });
      setSuccessMessage('Status do usuário atualizado com sucesso!');
      await fetchUsers(); // Refresh list
    } catch (error) {
      console.error('Falha ao atualizar status do usuário:', error);
      setError('Não foi possível atualizar o status do usuário.');
    } finally {
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (authLoading || !isAuthenticated || user?.role !== 'ADMIN') {
    return <p>Carregando ou redirecionando...</p>;
  }

  return (
    <PrivateRoute>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-200">Gestão de Usuários</h1>
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
              <FaPlus className="mr-2" /> Criar Usuário
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <input
            type="text"
            placeholder="Buscar por nome ou email"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-4 py-2 rounded border border-gray-400 focus:outline-none focus:ring focus:border-blue-300"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded border border-gray-400 focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="">Todos os Status</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-4 py-2 rounded border border-gray-400 focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="">Todos os Perfis</option>
            <option value="ADMIN">Admin</option>
            <option value="LEADER">Líder</option>
            <option value="USER">Usuário</option>
          </select>
          <button
            onClick={fetchUsers}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <FaSearch className="mr-2" /> Buscar
          </button>
        </div>  

        {pageLoading && <p>Carregando usuários...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        {!pageLoading && !error && (
          <div className="bg-gray-700 shadow-md rounded-lg">
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-400 bg-gray-800 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Usuários
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-400 bg-gray-800 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Perfil
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-400 bg-gray-800 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-400 bg-gray-800 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-5 border-b border-gray-200 bg-gray-600 text-sm">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-blue-500 text-white font-bold text-lg">
                          {user.avatar ? (
                            <img
                              className="w-full h-full object-cover"
                              src={`${api.defaults.baseURL}/files/${user.avatar}`}
                              alt="User avatar"
                            />
                          ) : (
                            getInitials(user.name)
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-gray-100 whitespace-no-wrap">{user.name}</p>
                          <p className="text-gray-200 whitespace-no-wrap">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-gray-600 text-sm">
                      <p className="text-gray-100 whitespace-no-wrap">{user.role}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-gray-600 text-sm">
                      
                      <button
                        onClick={() => handleToggleActiveStatus(user.id, !user.active)}
                        className={`px-2 py-1 text-md font-semibold rounded-full flex items-center ${
                          user.active ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                        }`}
                      >
                        {user.active ? <FaToggleOff className="mr-1" /> : <FaToggleOn className="mr-1" />} {user.active ? 'Inativo' : 'Ativo'}
                      </button>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-gray-600 text-sm">
                      <div className="relative inline-block text-left w-full">
                        <Menu>
                          {({ open }) => (
                            <>
                              <Menu.Button className="w-fit flex justify-center items-center bg-blue-500 hover:bg-blue-700 text-white rounded-3xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <span className="mr-2"><FaEdit /></span>
                                <span className="md:inline">Menu</span>
                                <svg className="ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                              </Menu.Button>
                              <Menu.Items className="absolute z-10 left-0 mt-2 w-40 origin-top-right bg-gray-700 border border-gray-300 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none">
                                <div className="py-1 w-full">
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleOpenModal(user)}
                                        className={`w-full flex items-center px-4 py-2 text-sm rounded ${active ? 'bg-blue-500 text-white' : 'bg-blue-700 text-white'} transition-colors`}
                                        title="Editar"
                                      >
                                        <FaEdit className="mr-2" /> Editar
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleDelete(user.id)}
                                        className={`w-full flex items-center px-4 py-2 text-sm rounded ${active ? 'bg-red-500 text-white' : 'bg-red-700 text-white'} transition-colors`}
                                        title="Deletar"
                                      >
                                        <FaTrash className="mr-2" /> Deletar
                                      </button>
                                    )}
                                  </Menu.Item>
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
        )}

        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title={editingUser ? 'Editar Usuário' : 'Criar Usuário'}
          >
            <UserForm
              userToEdit={editingUser}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseModal}
              successMessage={successMessage ?? undefined}
            />
          </Modal>
        )}
      </div>
    </PrivateRoute>
  );
}
