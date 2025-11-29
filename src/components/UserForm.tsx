
'use client';

import { useState, useEffect } from 'react';
import { User } from '../services/userService';
import { useSession } from 'next-auth/react';
import { api } from '../services/api';

enum Role {
  ADMIN = 'ADMIN',
  LEADER = 'LEADER',
  USER = 'USER',
}

interface UserFormProps {
  userToEdit?: User | null;
  onSubmit: (data: Partial<User> & { password?: string }) => void;
  onCancel: () => void;
  successMessage?: string;
  // Optional callback to notify parent that avatar filename changed after upload
  onAvatarUploaded?: (avatarFilename: string | null) => void;
}

export default function UserForm({ userToEdit, onSubmit, onCancel, successMessage, onAvatarUploaded }: UserFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.USER);
  const [, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const { data: session } = useSession();

  const isEditing = !!userToEdit;

  useEffect(() => {
    if (isEditing) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
      // Password field is kept blank for security
      setPassword('');
      // set current avatar preview if available
      if (userToEdit.avatar) {
        setAvatarPreview(`${api.defaults.baseURL}/files/${userToEdit.avatar}`);
      } else {
        setAvatarPreview(null);
      }
    }
  }, [userToEdit, isEditing]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const formData: Partial<User> & { password?: string } = {
      name,
      email,
      role,
      ...(password ? { password } : {})
    };
    onSubmit(formData);
  };

  // Allowed mime types and max size (assumption: 2MB)
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB

  const canUploadAvatar = !!(isEditing && session?.user && Number(session.user.id) === userToEdit?.id);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarError('Formato inválido. Apenas JPEG/JPG/PNG são permitidos.');
      return;
    }

    if (file.size > MAX_SIZE) {
      setAvatarError('Arquivo muito grande. Máx 2MB.');
      return;
    }

    // preview
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));

    // If user can upload (editing own profile), upload immediately
    if (canUploadAvatar) {
      try {
        setAvatarUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.post('/users/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        // backend returns { user }
        if (res.data?.user && res.data.user.avatar) {
          const uploaded = res.data.user.avatar;
          setAvatarPreview(`${api.defaults.baseURL}/files/${uploaded}`);
          // inform parent (ProfileMenu) so it can update currentUser and re-render avatar
          if (typeof onAvatarUploaded === 'function') onAvatarUploaded(uploaded);
        }
      } catch (_err) {
        setAvatarError('Falha ao enviar avatar. Tente novamente.');
      } finally {
        setAvatarUploading(false);
      }
    } else {
      // not allowed to upload (admin editing other user or creating new user)
      setAvatarError('Upload só permitido para o próprio usuário autenticado.');
    }
  };

  const handleRemoveAvatar = async () => {
    if (!canUploadAvatar) {
      setAvatarError('Remoção só permitida para o próprio usuário.');
      return;
    }
    try {
      setAvatarUploading(true);
      await api.delete('/users/avatar');
      setAvatarPreview(null);
      setAvatarFile(null);
    } catch (_err) {
      setAvatarError('Falha ao remover avatar.');
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {successMessage && (
  <div className="bg-gray-950 border border-gray-950 text-gray-200 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      <div className="mb-4">
        <label htmlFor="name" className="block text-gray-200 text-sm font-bold mb-2">Nome</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-950 text-gray-200 leading-tight focus:outline-none focus:shadow-outline"
          required
        />
      </div>
      {/* Avatar upload / preview */}
      <div className="mb-4">
        <label className="block text-gray-200 text-sm font-bold mb-2">Avatar</label>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center text-white">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="avatar preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm">Sem</span>
            )}
          </div>
          <div className="flex flex-col">
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleAvatarChange}
              className="text-sm text-gray-200"
            />
            {avatarUploading && <span className="text-xs text-gray-400">Enviando...</span>}
            {avatarError && <span className="text-xs text-red-400">{avatarError}</span>}
            <div className="mt-2">
              <button type="button" onClick={handleRemoveAvatar} className="text-xs text-red-400 hover:underline" disabled={avatarUploading}>
                Remover avatar
              </button>
            </div>
            {!canUploadAvatar && (
              <span className="text-xs text-gray-400 mt-1">Upload só disponível para seu próprio perfil.</span>
            )}
          </div>
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="email" className="block text-gray-200 text-sm font-bold mb-2">E-mail</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-950 text-gray-200 leading-tight focus:outline-none focus:shadow-outline"
          required
          disabled={isEditing} // Prevent email change on edit
        />
      </div>
      <div className="mb-4">
        <label htmlFor="password"
               className="block text-gray-200 text-sm font-bold mb-2">
          Senha {isEditing ? '(deixe em branco para manter a senha atual)' : ''}
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-950 text-gray-200 leading-tight focus:outline-none focus:shadow-outline"
          required={!isEditing}
        />
      </div>
      <div className="mb-6">
        <label htmlFor="role" className="block text-gray-200 text-sm font-bold mb-2">Perfil</label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-950 text-gray-200 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value={Role.USER}>Usuário</option>
          <option value={Role.LEADER}>Líder</option>
          <option value={Role.ADMIN}>Administrador</option>
        </select>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-end md:space-x-4 space-y-2 md:space-y-0">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {isEditing ? 'Atualizar Perfil' : 'Criar Usuário'}
        </button>
      </div>
    </form>
  );
}
