// import { hashPassword } from '@/lib/auth';
import { api } from './api';

export enum Role {
  ADMIN = 'ADMIN',
  LEADER = 'LEADER',
  USER = 'USER',
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  // avatar holds the file id (number) or filename in some places; allow both
  avatar?: number | string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData extends Omit<User, 'id' | 'active'> {
  password: string;
}

export interface GetUsersParams {
  page?: number;
  limit?: number | string;
  search?: string;
  active?: string;
  role?: string;
}

export const getUsers = async (params?: GetUsersParams): Promise<{ users: User[]; total: number }> => {
  const { data } = await api.get('/users/all', { params });
  if (!data) return { users: [], total: 0 };
  // normalize users to ensure `avatar` contains the file id when available
  type RawUser = { avatarFileId?: number; avatar?: { id?: number; fileName?: string } } & Record<string, unknown>;
  const users: User[] = (data.users || []).map((u: RawUser) => ({
    ...(u as unknown as User),
    avatar: u.avatarFileId ?? (u.avatar && (u.avatar.id ?? u.avatar.fileName)) ?? null,
  }));
  return { users, total: data.total ?? 0 };
};

export const getUserByEmail = async (email: string): Promise<User> => {
  const { data } = await api.get(`/users/email/${email}`);
  if (!data) throw new Error('User not found');
  return {
    ...data,
    avatar: (data.avatarFileId ?? (data.avatar && (data.avatar.id ?? data.avatar.fileName))) ?? null,
  };
};

export const getUserById = async (id: number): Promise<User> => {
  const { data } = await api.get(`/users/${id}`);
  if (!data) throw new Error('User not found');
  return {
    ...data,
    avatar: data.avatarFileId ?? (data.avatar && (data.avatar.id ?? data.avatar.fileName)) ?? null,
  };
};

// export const createUser = async (userData: CreateUserData): Promise<User> => {
//   try {
//     const { data } = await api.post('/users', userData);
//     return data;
//   } catch (error: unknown) {
//     if (error.response?.status === 400) {
//       throw new Error(error.response.data.error || 'Missing required fields');
//     }
//     if (error.response?.status === 409) {
//       throw new Error('User with this email already exists');
//     }
//     throw new Error('Failed to create user');
//   }
// };
function isAxiosError(error: unknown): error is { response: { status: number, data: { error: string } } } {
  return typeof error === 'object' && error !== null && 'response' in error;
}

export const createUser = async (userData: CreateUserData): Promise<User> => {
  try {
    const { data } = await api.post('/users', userData);
    return {
      ...data,
      avatar: data.avatarFileId ?? (data.avatar && (data.avatar.id ?? data.avatar.fileName)) ?? null,
    };
  } catch (error: unknown) {
    // Usamos a função de verificação antes de acessar error.response
    if (isAxiosError(error)) {
      if (error.response.status === 400) {
        throw new Error(error.response.data.error || 'Missing required fields');
      }
      if (error.response.status === 409) {
        throw new Error('User with this email already exists');
      }
    }
    
    // Para qualquer outro tipo de erro ou erro não-Axios
    throw new Error('Failed to create user');
  }
};

export const updateUser = async (id: number, userData: Partial<User>): Promise<User> => {
  const { data } = await api.put(`/users/${id}`, userData);
  return {
    ...data,
    avatar: data.avatarFileId ?? (data.avatar && (data.avatar.id ?? data.avatar.fileName)) ?? null,
  };
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/users/${id}`);
};

export const updateUserByAdmin = async (id: number, userData: Partial<User>): Promise<User> => {
  const { data } = await api.patch(`/users/admin/${id}`, userData);
  return data;
};