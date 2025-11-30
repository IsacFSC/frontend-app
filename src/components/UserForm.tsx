
'use client';

import { useState, useEffect, useRef } from 'react';
import type { AxiosProgressEvent } from 'axios';
import { User } from '../services/userService';
import { useSession } from 'next-auth/react';
import { api } from '../services/api';
// UploadThing React SDK
// NOTE: UploadThing client was causing a loading/hang in this environment.
// For now we use the legacy backend upload endpoint. Remove UploadThing
// dynamic import to avoid unused import warnings.

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
  // Optional callback to notify parent that avatar file id changed after upload
  onAvatarUploaded?: (avatarFileId: number | null) => void;
  // If false, form fields will be disabled and submit hidden
  canEdit?: boolean;
}

export default function UserForm({ userToEdit, onSubmit, onCancel, successMessage, onAvatarUploaded, canEdit = true }: UserFormProps) {
  const canEditProp = canEdit;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.USER);
  const [, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: session } = useSession();

  const isEditing = !!userToEdit;
  const isSelf = !!(session?.user && Number(session.user.id) === userToEdit?.id);

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
    // If the editor has full edit rights (admin), send all editable fields.
    // If the user is editing their own profile but is not admin, only send password (if provided).
    const base: Partial<User> & { password?: string } = {};
    if (canEditProp) {
      base.name = name;
      base.email = email;
      base.role = role;
    }
    if (password) base.password = password;
    onSubmit(base);
  };

  // Allowed mime types and max size (assumption: 2MB)
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB

  // Allow avatar upload when editing and either the parent allows editing (admin) or the user is editing their own profile
  const canUploadAvatar = !!(isEditing && (canEditProp || isSelf));

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

    // If the authenticated user is editing their own profile, upload immediately
    if (canUploadAvatar) {
      try {
        setAvatarUploading(true);
        setUploadProgress(0);
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.post('/users/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent?: AxiosProgressEvent) => {
              const loaded = progressEvent?.loaded ?? 0;
              const total = progressEvent?.total ?? 0;
              if (total) {
                const percent = Math.round((loaded * 100) / total);
                setUploadProgress(percent);
              }
            },
        });
        // Try to extract file id from possible response shapes
        const fileId = res.data?.user?.avatarFileId ?? res.data?.fileId ?? res.data?.user?.avatar ?? res.data?.file?.id ?? null;
        if (fileId) {
          setAvatarPreview(`${api.defaults.baseURL}/files/${fileId}`);
          if (typeof onAvatarUploaded === 'function') onAvatarUploaded(Number(fileId));
        }
      } catch (err) {
        console.error('avatar upload failed', err);
        setAvatarError('Falha ao enviar avatar. Tente novamente.');
      } finally {
        setAvatarUploading(false);
        setTimeout(() => setUploadProgress(null), 300);
      }
    } else {
      setAvatarError('Upload só permitido para o próprio usuário autenticado.');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    if (file) {
      // reuse same validation path
      const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleAvatarChange(fakeEvent);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };


  const handleRemoveAvatar = async () => {
    if (!canUploadAvatar) {
      setAvatarError('Remoção só permitida para o próprio usuário ou administradores.');
      return;
    }

    try {
      setAvatarUploading(true);
      // If the authenticated user is removing their own avatar, call the dedicated endpoint
      if (session?.user && Number(session.user.id) === userToEdit?.id) {
        await api.delete('/users/avatar');
      } else if (canEditProp && isEditing && userToEdit?.id) {
        // Admin removing another user's avatar: patch the user to clear avatarFileId
        await api.patch(`/users/admin/${userToEdit.id}`, { avatarFileId: null });
      }
      setAvatarPreview(null);
      setAvatarFile(null);
      if (typeof onAvatarUploaded === 'function') onAvatarUploaded(null);
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
          disabled={!canEditProp}
        />
      </div>
      {/* Avatar upload / preview */}
      <div className="mb-4">
        <label className="block text-gray-200 text-sm font-bold mb-2">Avatar</label>
        <div className="flex items-center gap-4">
            <div className="flex flex-col">
              {/* Show file input if admin or the user editing their own profile */}
              {(canEditProp || (isEditing && isSelf)) ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`mt-2 flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors border-2 ${dragActive ? 'border-blue-400 bg-gray-800' : 'border-dashed border-gray-600 bg-gray-900'} hover:border-blue-400`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                      {avatarPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarPreview} alt="avatar preview" className="w-full h-full object-cover" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.578 0 4.97.67 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm text-gray-200 font-medium">Arraste e solte ou clique para enviar</div>
                      <div className="text-xs text-gray-400">Apenas JPG/PNG — Máx 2MB</div>
                      {uploadProgress !== null && (
                        <div className="w-full h-2 bg-gray-800 rounded mt-2 overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                      >
                        Selecionar
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-xs text-gray-400">Somente administradores ou você podem alterar o avatar.</div>
              )}
              {avatarUploading && <div className="text-sm text-gray-500">Enviando...</div>}
              {avatarError && <div className="text-sm text-red-500">{avatarError}</div>}
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
          disabled={isEditing || !canEditProp} // Prevent email change on edit and when read-only
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
          required={!isEditing && canEditProp}
          disabled={!(canEditProp || isSelf)}
        />
      </div>
      <div className="mb-6">
        <label htmlFor="role" className="block text-gray-200 text-sm font-bold mb-2">Perfil</label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-950 text-gray-200 leading-tight focus:outline-none focus:shadow-outline"
          disabled={!canEditProp}
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
        {(canEditProp || isSelf) && (
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {isEditing ? 'Atualizar Perfil' : 'Criar Usuário'}
          </button>
        )}
      </div>
    </form>
  );
}
