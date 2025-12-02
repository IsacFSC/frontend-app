import { api } from './api';

// Uploads a file and attaches it to a specific schedule.
export const uploadScheduleFile = async (scheduleId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  // Corrected URL to match the backend route
  const response = await api.post(`/schedules/${scheduleId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Gets the file metadata for a given schedule.
// A schedule has only one file, so we fetch the schedule and return the file info in an array.
export const getScheduleFiles = async (scheduleId: number) => {
  try {
    const response = await api.get(`/schedules/${scheduleId}`);
    const schedule = response.data;
    if (schedule && schedule.file) {
      // The component expects an array of files with id, filename, uploadthingUrl and uploadthingKey
      return [{
        id: schedule.file.id,
        filename: schedule.file.fileName,
        uploadthingUrl: schedule.file.uploadthingUrl,
        uploadthingKey: schedule.file.uploadthingKey,
      }];
    }
    return [];
  } catch (error) {
    console.error("Error fetching schedule file info:", error);
    return [];
  }
};

// Downloads a file using the generic file download endpoint.
export const downloadScheduleFile = async (fileId: number) => {
  // Corrected URL to use the generic /api/files/:id endpoint
  const response = await api.get(`/files/${fileId}`, {
    responseType: 'blob',
  });
  return response;
};