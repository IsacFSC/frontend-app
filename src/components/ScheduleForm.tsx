'use client';

import { useState, useEffect } from 'react';
import { Schedule } from '../services/scheduleService';
import { FaUpload, FaTimes, FaSave } from 'react-icons/fa';

interface ScheduleFormProps {
  scheduleToEdit?: Schedule | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  successMessage?: string;
  // New prop for file upload
  onFileUpload?: (file: File) => Promise<void> | void;
  isLeader?: boolean;
}

export default function ScheduleForm({ scheduleToEdit, onSubmit, onCancel, successMessage, onFileUpload, isLeader }: ScheduleFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // New state for file

  const isEditing = !!scheduleToEdit;

  // Helper to format date from ISO to yyyy-MM-ddTHH:mm
  const formatDateTimeLocal = (isoDate: string) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    // Adjust for timezone offset
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - timezoneOffset);
    return localDate.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (isEditing && scheduleToEdit) {
      setName(scheduleToEdit.name);
      setDescription(scheduleToEdit.description || '');
      setStartTime(formatDateTimeLocal(scheduleToEdit.startTime));
      setEndTime(formatDateTimeLocal(scheduleToEdit.endTime));
    }
  }, [scheduleToEdit, isEditing]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const isoStart = new Date(startTime).toISOString();
    const isoEnd = new Date(endTime).toISOString();
    const scheduleData = {
      name,
      description,
      startTime: isoStart,
      endTime: isoEnd,
    };
    onSubmit(scheduleData);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (selectedFile && onFileUpload) {
      await onFileUpload(selectedFile);
      setSelectedFile(null); // Clear selected file after upload
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {successMessage && (
        <div className="bg-green-900 border border-green-800 text-green-100 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      <div className="mb-4">
        <label htmlFor="name" className="block text-gray-200 text-sm font-bold mb-2">Nome</label>
        <input
          type="text"
          id="name"
          value={name ?? ''}
          onChange={(e) => setName(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-gray-200 leading-tight focus:outline-none focus:shadow-outline"
          required
          disabled={isLeader}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="description" className="block text-gray-200 text-sm font-bold mb-2">Descrição</label>
        <textarea
          id="description"
          value={description ?? ''}
          onChange={(e) => setDescription(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-gray-200 leading-tight focus:outline-none focus:shadow-outline"
          disabled={isLeader}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="startTime" className="block text-gray-200 text-sm font-bold mb-2">Data/Hora Inicial</label>
        <input
          type="datetime-local"
          id="startTime"
          value={startTime ?? ''}
          onChange={(e) => setStartTime(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-gray-200 leading-tight focus:outline-none focus:shadow-outline"
          required
          disabled={isLeader}
        />
      </div>
      <div className="mb-6">
        <label htmlFor="endTime" className="block text-gray-200 text-sm font-bold mb-2">Data/Hora Final</label>
        <input
          type="datetime-local"
          id="endTime"
          value={endTime ?? ''}
          onChange={(e) => setEndTime(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-gray-200 leading-tight focus:outline-none focus:shadow-outline"
          required
          disabled={isLeader}
        />
      </div>

      {isEditing && onFileUpload && (
        <div className="mb-6">
          <label htmlFor="fileUpload" className="block text-gray-200 text-sm font-bold mb-2">Anexar Arquivo (PDF, Imagem)</label>
          <input
            type="file"
            id="fileUpload"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-gray-300 leading-tight focus:outline-none focus:shadow-outline"
          />
          {selectedFile && (
            <button
              type="button"
              onClick={handleUpload}
              className="mt-2 bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
            >
              <FaUpload className="mr-2" /> Upload Arquivo
            </button>
          )}
          {scheduleToEdit?.file && (
            <p className="text-sm text-gray-400 mt-2">Arquivo atual: {scheduleToEdit.file}</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
        >
          <FaTimes className="mr-2" /> Cancelar
        </button>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
          disabled={isLeader}
        >
          <FaSave className="mr-2" /> {isEditing ? 'Atualizar escala' : 'Criar escala'}
        </button>
      </div>
    </form>
  );
}
