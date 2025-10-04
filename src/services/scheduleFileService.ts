
import { api } from './api';

export const uploadScheduleFile = async (scheduleId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`/schedule-file/upload/${scheduleId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const getScheduleFiles = async (scheduleId: number) => {
  const response = await api.get(`/schedule-file/${scheduleId}`);
  return response.data;
};

export const downloadScheduleFile = async (fileId: number) => {
  const response = await api.get(`/schedule-file/download/${fileId}`, {
    responseType: 'blob',
  });
  return response;
};
