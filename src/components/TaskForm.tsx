'use client';

import { useState, useEffect } from 'react';
import { Task } from '../services/taskService';
import { FaTimes, FaSave } from 'react-icons/fa';

interface TaskFormProps {
  taskToEdit?: Task | null;
  onSubmit: (data: { name: string; description: string }) => void;
  onCancel: () => void;
  successMessage?: string;
}

export default function TaskForm({ taskToEdit, onSubmit, onCancel, successMessage }: TaskFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const isEditing = !!taskToEdit;

  useEffect(() => {
    if (isEditing && taskToEdit) {
      setName(taskToEdit.name);
      setDescription(taskToEdit.description);
    }
  }, [taskToEdit, isEditing]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({ name, description });
  };

  return (
    <form onSubmit={handleSubmit}>
      {successMessage && (
  <div className="bg-gray-950 border border-gray-950 text-gray-200 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      <div className="mb-4">
        <label htmlFor="name" className="block text-gray-200 text-sm font-bold mb-2">Nome da Tarefa</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="shadow appearance-none border-gr rounded w-full py-2 px-3 bg-gray-700 text-gray-200 leading-tight focus:outline-none focus:shadow-outline"
          required
        />
      </div>
      <div className="mb-6">
        <label htmlFor="description" className="block text-gray-100 text-sm font-bold mb-2">Descrição</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="shadow appearance-none border-gray-700 rounded w-full py-2 px-3 bg-gray-600 text-gray-200 leading-tight focus:outline-none focus:shadow-outline"
          required
        />
      </div>
      <div className="flex items-center justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-500 hover:bg-gray-600 text-gray-050 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
        >
          <FaTimes className="mr-2" /> Cancelar
        </button>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-gray-200 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
        >
          <FaSave className="mr-2" /> {isEditing ? 'Atualizar tarefa' : 'Criar tarefa'}
        </button>
      </div>
    </form>
  );
}