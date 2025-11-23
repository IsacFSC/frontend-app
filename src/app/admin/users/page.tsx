'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getUsers,
  createUser,
  deleteUser,
  updateUserByAdmin,
  User,
  CreateUserData,
} from '../../../services/userService';
import Modal from '../../../components/Modal';
import UserForm from '../../../components/UserForm';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { api } from '../../../services/api';
import PrivateRoute from '@/components/PrivateRoute';
import { FaPlus, FaArrowLeft, FaSearch,
  FaEdit, FaToggleOn, FaToggleOff,
  FaCross, FaTrashAlt, FaEllipsisV } 
from 'react-icons/fa';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import Image from 'next/image';
import ConfirmationModal from '../../../components/ConfirmationModal';
import toast, { Toaster } from 'react-hot-toast';

export default function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = status === 'authenticated';
  const authLoading = status === 'loading';
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUserIds, setLoadingUserIds] = useState<number[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

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
    } catch (err) {
      toast.error('Falha ao buscar usuários. Por favor, tente novamente mais tarde.');
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

  const handleFormSubmit = async (data: Partial<User> & { password?: string }) => {
    const toastId = toast.loading(editingUser ? 'Atualizando usuário...' : 'Criando usuário...');
    try {
      if (editingUser) {
        await updateUserByAdmin(editingUser.id, data);
        toast.success('Usuário atualizado com sucesso!', { id: toastId });
      } else {
        if (!data.name || !data.email || !data.role || !data.password) {
          toast.error("Nome, email, senha e perfil são obrigatórios.", { id: toastId });
          return;
        }
        const newUser: CreateUserData = {
          name: data.name,
          email: data.email,
          role: data.role,
          avatar: data.avatar,
          password: data.password
        };
        await createUser(newUser);
        toast.success('Usuário criado com sucesso!', { id: toastId });
      }
      await fetchUsers(); // Refresh list
      handleCloseModal();
    } catch (error: unknown) {
      console.error('Falha ao salvar o usuário: ', error);
      toast.error('Não foi possível salvar os detalhes do usuário.', { id: toastId });
    }
  };

  const handleDelete = (id: number) => {
    setItemToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const executeDelete = async () => {
    if (itemToDelete === null) return;
    const toastId = toast.loading('Excluindo usuário...');
    try {
      await deleteUser(itemToDelete);
      toast.success('Usuário excluído com sucesso!', { id: toastId });
      await fetchUsers(); // Refresh list
    } catch (error) {
      console.error('Falha ao deletar o usuário:', error);
      toast.error('Não foi possível deletar o usuário.', { id: toastId });
    } finally {
      setItemToDelete(null);
    }
  };

  const handleToggleActiveStatus = async (id: number, currentStatus: boolean) => {
    const toastId = toast.loading('Atualizando status...');
    try {
      setLoadingUserIds((prev) => [...prev, id]);
      await updateUserByAdmin(id, { active: !currentStatus });
      toast.success('Status do usuário atualizado com sucesso!', { id: toastId });
      await fetchUsers(); // Refresh list
    } catch (error) {
      console.error('Falha ao atualizar status do usuário:', error);
      toast.error('Não foi possível atualizar o status do usuário.', { id: toastId });
    } finally {
      setLoadingUserIds((prev) => prev.filter((uid) => uid !== id));
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (authLoading || !isAuthenticated || user?.role !== 'ADMIN') {
    return
    // Container principal: fixed, tela cheia, bg preto com opacidade 75%
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
      {/* Ícone de Loading: centralizado, sem background próprio */}
      <FaCross 
        className="animate-bounce delay-75 text-9xl text-blue-200 p-2 rounded-md border-2 border-cyan-400"
      />
    </div>
  }

  return (
    <PrivateRoute>
      <div className="min-h-screenpx-2 sm:px-8 py-4 bg-gray-900 sm:py-8">
        <Toaster position="top-center" reverseOrder={false} />
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-200">Gerenciar Usuários</h1>
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
              <FaPlus className="mr-2" /> Criar Usuário
            </button>
          </div>
        </div>

        <div className="p-4 mb-4 flex flex-col md:flex-row gap-4 bg-gray-800 rounded-lg">
          <input
            type="text"
            placeholder="Buscar por nome ou email"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded border text-gray-100 border-gray-400 focus:outline-none focus:ring focus:border-blue-300"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="flex w-full px-4 py-2 rounded border text-gray-100 border-gray-400 focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="">Todos os Status</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="flex w-full px-4 py-2 rounded border text-gray-100 border-gray-400 focus:outline-none focus:ring focus:border-blue-300"
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

        {pageLoading && 
          // Container principal: fixed, tela cheia, bg preto com opacidade 75%
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
            {/* Ícone de Loading: centralizado, sem background próprio */}
            <FaCross 
              className="animate-bounce delay-75 text-9xl text-blue-200 p-2 rounded-md border-2 border-cyan-400"
            />
          </div>
        }
        
        {/* CÓDIGO PARA TESTE AQUI INICIO*/}
        {!pageLoading && (
          // Container que permite a rolagem horizontal
          <div className="bg-gray-700 shadow-md rounded-lg overflow-x-auto overflow-visible">
            {/* Removi o bg-gray-700 daqui para evitar conflitos de z-index com sticky backgrounds */}
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  {/* --- COLUNA FIXA (STICKY) --- */}
                  <th className="px-5 py-3 border-b-2 border-gray-400 bg-gray-700 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider sticky left-0 z-10 w-52">
                    Usuários
                  </th>
                  {/* --- FIM COLUNA FIXA --- */}
                  <th className="px-5 py-3 border-b-2 border-gray-400 bg-gray-800 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Perfil
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-400 bg-gray-800 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-400 bg-gray-800 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Última atualização
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
                    {/* --- CÉLULA FIXA (STICKY) --- */}
                    <td className="px-0 py-5 border-b border-gray-200 bg-gray-700 text-sm sticky left-0 z-0">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 ml-2 rounded-full overflow-hidden flex items-center justify-center bg-blue-500 text-white font-bold text-lg">
                          {user.avatar ? (
                            <Image
                              className="w-full h-full object-cover"
                              src={`${api.defaults.baseURL}/files/${user.avatar}`}
                              alt="User avatar"
                            />
                          ) : (
                            getInitials(user.name)
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-gray-100 whitespace-nowrap">{user.name}</p>
                          <p className="text-gray-200 truncate w-28 sm:w-32 md:w-auto text-sm font-extralight">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* --- FIM CÉLULA FIXA --- */}

                    <td className="px-5 py-5 border-b border-gray-200 bg-gray-600 text-sm">
                        <p className="text-gray-100 whitespace-nowrap">{user.role}</p>
                    </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-gray-600 text-sm">
                        <p className="text-gray-100 whitespace-nowrap">{user.createdAt ? new Date(user.createdAt).toLocaleString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                      </td>
                      <td className="px-5 py-5 border-b border-gray-200 bg-gray-600 text-sm">
                        <p className="text-gray-300 whitespace-nowrap text-sm">{user.updatedAt ? new Date(user.updatedAt).toLocaleString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                      </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-gray-600 text-sm">
                      <button
                        onClick={() => handleToggleActiveStatus(user.id, user.active)}
                        className={`px-2 py-1 text-md font-semibold rounded-full flex items-center ${
                          user.active ? 'bg-red-500 text-white border-0 rounded-md hover:scale-105 font-semibold duration-75 p-1 shadow-sky-800 shadow-md' : 'bg-green-500 text-white border-0 rounded-md hover:scale-105 font-semibold duration-75 p-1 shadow-sky-800 shadow-md'
                        } ${loadingUserIds.includes(user.id) ? 'opacity-60 cursor-not-allowed' : ''}`}
                        disabled={loadingUserIds.includes(user.id)}
                      >
                        {loadingUserIds.includes(user.id) ? (
                          <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                            ><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                        ) : (
                          user.active ? <FaToggleOff className="mr-1" /> : <FaToggleOn className="mr-1" />
                        )} {user.active ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-gray-600 text-sm">
                      {/* Seu Menu dropdown complexo permanece o mesmo, mas a largura pode precisar de ajustes */}
                      <div className="relative inline-block text-left w-full">
                        <Menu as="div" className="relative inline-block text-left">
                          {({ open: _open }) => ( // Use o estado 'open' para rotacionar o ícone, se quiser
                            <>
                              <MenuButton className="flex items-center p-2 text-gray-200 hover:text-gray-300,
                              rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 ease-in-out,
                              hover:scale-105 font-semibold">
                                {/* Botão de ícone limpo para a coluna de ações */}
                                <FaEllipsisV className="h-5 w-5" aria-hidden="true" />
                              </MenuButton>

                              {/* Painel do Dropdown */}
                              <MenuItems className="absolute right-0 mt-2 w-40 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                <div className="py-1">
                                  
                                  {/* Opção EDITAR */}
                                  <MenuItem>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleOpenModal(user)}
                                        className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                                          active ? 'bg-indigo-600 text-white' : 'text-gray-700'
                                        }`}
                                      >
                                        <FaEdit className="mr-3 h-4 w-4" />
                                        Editar
                                      </button>
                                    )}
                                  </MenuItem>

                                  {/* Opção DELETAR */}
                                  <MenuItem>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleDelete(user.id)}
                                        className={`flex items-center w-full px-4 py-2 text-sm transition-colors ${
                                          active ? 'bg-red-600 text-white' : 'text-gray-700'
                                        }`}
                                      >
                                        <FaTrashAlt className="mr-3 h-4 w-4" />
                                        Deletar
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
        )}
        {/* CÓDIGO PARA TESTE AQUI FIM*/}
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
            />
          </Modal>
        )}
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={executeDelete}
          title="Confirmar Exclusão"
          message="Você tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
        />
      </div>
    </PrivateRoute>
  );
}
