import { api } from './api';
import { User } from './userService';
import { Task } from './taskService';

// This represents the UsersOnSchedules relation
interface UsersOnSchedules {
  user: User;
  userId: number;
  scheduleId: number;
  assignedAt: string;
  skill: string;
}

export interface Schedule {
  id: number;
  name: string;
  description: string | null;
  startTime: string; // ISO 8601 date string
  endTime: string;   // ISO 8601 date string
  file: string | null; // This will store the uploaded file name
  users: UsersOnSchedules[];
  tasks: Task[];
}

export const getSchedules = async (): Promise<Schedule[]> => {
  const { data } = await api.get('/schedules');
  return Array.isArray(data) ? data : [];
};

export const getTodaySchedule = async (): Promise<Schedule[]> => {
  const { data } = await api.get('/schedules/today');
  return data;
};

export const getMySchedules = async (): Promise<Schedule[]> => {
  const { data } = await api.get('/schedules/my-schedules', {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
  return data;
};

export const downloadScheduleFile = async (scheduleId: number): Promise<void> => {
  const response = await api.get(`/schedules/${scheduleId}/pdf`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  const contentDisposition = response.headers['content-disposition'];
  let fileName = `escala-${scheduleId}.pdf`; // Nome de arquivo padrão
  if (contentDisposition) {
    const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
    if (fileNameMatch && fileNameMatch.length === 2)
      fileName = fileNameMatch[1];
  }
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// New function to upload a file to a schedule
export const uploadScheduleFile = async (scheduleId: number, file: File): Promise<Schedule> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post(`/schedules/${scheduleId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

// New function to download an attached file from a schedule
export const downloadAttachedFile = async (scheduleId: number): Promise<void> => {
  const response = await api.get(`/schedules/${scheduleId}/uploaded-file`, { // A rota já está correta, apenas garantindo.
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  const contentDisposition = response.headers['content-disposition'];
  let fileName = `anexo-${scheduleId}`; // Default filename
  if (contentDisposition) {
    const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
    if (fileNameMatch && fileNameMatch.length === 2)
      fileName = fileNameMatch[1];
  }
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
};


export const createSchedule = async (scheduleData: {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}): Promise<Schedule> => {
  const { data } = await api.post('/schedules', scheduleData);
  return data;
};

export const updateSchedule = async (id: number, scheduleData: Partial<Schedule>): Promise<Schedule> => {
  const { data } = await api.patch(`/schedules/${id}`, scheduleData);
  return data;
};

export const deleteSchedule = async (id: number): Promise<void> => {
  await api.delete(`/schedules/${id}`);
};

export const addUserToSchedule = async (scheduleId: number, userId: number, skill: string): Promise<void> => {
  await api.post(`/schedules/${scheduleId}/users/${userId}`, { skill });
};

export const removeUserFromSchedule = async (scheduleId: number, userId: number): Promise<void> => {
  await api.delete(`/schedules/${scheduleId}/users/${userId}`);
};