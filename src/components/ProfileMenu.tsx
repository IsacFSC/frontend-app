 'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Menu } from '@headlessui/react';
import { useSession, signOut } from 'next-auth/react';
import UserForm from './UserForm';
import { getUserById, updateUser, User } from '../services/userService';
import { api } from '../services/api';
import MessageIcon from './MessageIcon';

export default function ProfileMenu() {
  const { data: session, status } = useSession();
  const [openProfile, setOpenProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (status !== 'authenticated' || !session?.user?.id) return;
      setLoading(true);
      try {
        const u = await getUserById(Number(session.user.id));
        setCurrentUser(u);
      } catch (_err) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session, status]);

  const handleUpdate = async (data: Partial<User> & { password?: string }) => {
    if (!currentUser) return;
    try {
      setLoading(true);
      await updateUser(currentUser.id, data);
      const u = await getUserById(currentUser.id);
      setCurrentUser(u);
      // bump avatarVersion to bust cache if avatar changed on server
      setAvatarVersion((v) => v + 1);
      setMessage('Perfil atualizado com sucesso');
      toast.success('Perfil atualizado com sucesso');
      // close modal after successful update
      setOpenProfile(false);
    } catch (_err) {
      setMessage('Falha ao atualizar perfil');
      toast.error('Falha ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const open = () => setOpenProfile(true);
  const close = () => setOpenProfile(false);

  const handleAvatarUploaded = (avatarFileId: number | null) => {
    if (!avatarFileId) return;
    // Refresh user from server to ensure any related fields are updated
    (async () => {
      try {
        const u = await getUserById(Number(session?.user?.id));
        setCurrentUser(u);
      } catch {
        // fallback: update avatar id locally
        setCurrentUser((prev) => (prev ? { ...prev, avatar: avatarFileId } : prev));
      } finally {
        // bump to force image reload
        setAvatarVersion((v) => v + 1);
      }
    })();
  };

  // Don't render header on public pages or while loading session
  if (status === 'loading') return null;
  if (status !== 'authenticated') return null;

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between">
            {/* Left: avatar (visible on all sizes) */}
            <div className="flex items-center gap-3">
              <button onClick={open} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500">
                {currentUser?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${api.defaults.baseURL}/files/${currentUser.avatar}?v=${avatarVersion}`} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-sm">{currentUser ? currentUser.name?.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </button>
            </div>

            {/* center placeholder (can be used for title) */}
            <div className="flex-1 flex items-center justify-center sm:justify-start">
              {/* empty for now */}
            </div>

            {/* Right: messages, perfil and sair (responsive) */}
            <div className="flex items-center gap-3">
              {/* Messages icon (same for all roles) */}
              <div>
                <MessageIcon />
              </div>

              {/* Perfil button visible on md+ */}
              <button onClick={open} className="hidden md:inline-flex items-center px-3 py-2 rounded bg-gray-800 text-gray-200 hover:bg-gray-700">Perfil</button>

              {/* Sair button visible on md+ */}
              <button onClick={() => signOut()} className="hidden md:inline-flex items-center px-3 py-2 rounded bg-gray-800 text-gray-200 hover:bg-gray-700">Sair</button>

              {/* Hamburger menu visible only on small screens; contains Perfil + Sair */}
              <Menu as="div" className="relative inline-block text-left md:hidden">
                <Menu.Button className="inline-flex justify-center w-full rounded-md bg-transparent px-2 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Menu.Button>
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={open}
                          className={`w-full text-left px-4 py-2 text-sm text-gray-200 ${active ? 'bg-gray-700' : ''}`}
                        >
                          Perfil
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => signOut()}
                          className={`w-full text-left px-4 py-2 text-sm text-gray-200 ${active ? 'bg-gray-700' : ''}`}
                        >
                          Sair
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Menu>
            </div>
          </div>
        </div>
      </header>

      {/* Profile modal/panel */}
      {openProfile && (
        <div className="fixed inset-0 z-60 flex items-start justify-center pt-20 sm:pt-28">
          <div className="absolute inset-0 bg-black opacity-50" onClick={close}></div>
          <div className="relative z-70 w-full max-w-2xl bg-gray-900 rounded-md p-6 mx-4 sm:mx-0 sm:mt-0 sm:rounded-md">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                {currentUser?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${api.defaults.baseURL}/files/${currentUser.avatar}?v=${avatarVersion}`} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white">Sem</span>
                )}
              </div>
              <div className="flex-1 w-full">
                <h3 className="text-lg font-semibold text-gray-200">Meu Perfil</h3>
                {message && <div className="text-sm text-green-400">{message}</div>}
                {!loading && currentUser ? (
                  <div className="mt-4 max-h-[60vh] overflow-y-auto">
                    <UserForm
                      userToEdit={currentUser}
                      onSubmit={handleUpdate}
                      onCancel={close}
                      successMessage={message || undefined}
                      onAvatarUploaded={handleAvatarUploaded}
                    />
                    <div className="mt-3">
                      <p className="text-xs text-gray-400">Para alterar avatar use o campo no formulário (somente JPG/PNG até 2MB).</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-gray-400">Carregando...</div>
                )}
              </div>
            </div>
            {/* Footer removed — UserForm already exposes Cancelar and Atualizar Perfil buttons */}
          </div>
        </div>
      )}
    </>
  );
}
