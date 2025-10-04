import { api } from './api';

enum Role {
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
  avatar?: string;
}

export interface GetUsersParams {
  limit?: number;
  offset?: number;
  search?: string;
  active?: string;
  role?: string;
}

export const getUsers = async (params?: GetUsersParams): Promise<User[]> => {
  const { data } = await api.get('/users/All', { params });
  return data?.users || [];
};

export const getUserByEmail = async (email: string): Promise<User> => {
  const { data } = await api.get(`/users/email/${email}`);
  return data;
};

export const createUser = async (userData: Omit<User, 'id' | 'active'>): Promise<User> => {
  const { data } = await api.post('/users', userData);
  return data;
};

export const updateUser = async (id: number, userData: Partial<User>): Promise<User> => {
  const { data } = await api.patch(`/users/${id}`, userData);
  return data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/users/${id}`);
};

export const updateUserByAdmin = async (id: number, userData: Partial<User>): Promise<User> => {
  const { data } = await api.patch(`/users/admin/${id}`, userData);
  return data;
};