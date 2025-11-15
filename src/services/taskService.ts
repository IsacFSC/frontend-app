import { TaskStatus } from '@prisma/client';
import { api } from './api';
import { User } from './userService';

export { TaskStatus };

export interface Task {
  id: number;
  name: string;
  description: string;
  completed: boolean;
  createdAt: string | Date;
  // optional fields sometimes returned by the API
  updatedAt?: string | Date | null;
  updatedBy?: { id?: number; email?: string | null; name?: string | null } | null;
  userId: number | null;
  user?: User | null;
  status: TaskStatus;
  scheduleId: number | null;
  taskDate: string | Date | null;
}

export interface TasksResponse {
  data: Task[];
  total: number;
  page: number;
  limit: number;
}

export interface GetTasksParams {
  limit?: number;
  offset?: number;
  userId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  name?: string;
}

export const getTasks = async (params: GetTasksParams): Promise<TasksResponse> => {
  const { data } = await api.get('/tasks/all', { params });
  return {
    ...data,
    data: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || (params && params.limit) || 10,
  };
};

export const createTask = async (taskData: { name: string; description: string; taskDate: string }): Promise<Task> => {
  const { data } = await api.post('/tasks', taskData);
  return data;
};

export const updateTask = async (id: number, taskData: Partial<{ name: string; description: string; taskDate: string }>): Promise<Task> => {
  const { data } = await api.patch(`/tasks/${id}`, taskData);
  return data;
};

export const deleteTask = async (id: number): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

export const assignTaskToSchedule = async (taskId: number, scheduleId: number): Promise<void> => {
  await api.patch(`/tasks/${taskId}/assign/${scheduleId}`);
};

export const unassignTaskFromSchedule = async (taskId: number): Promise<void> => {
  await api.patch(`/tasks/${taskId}/unassign`);
};

export const approveTask = async (id: number): Promise<Task> => {
  const { data } = await api.patch(`/tasks/${id}/approve`);
  return data;
};

export const rejectTask = async (id: number): Promise<Task> => {
  const { data } = await api.patch(`/tasks/${id}/reject`);
  return data;
};