'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getScheduleFiles } from '../services/scheduleFileService';
import SecureFileUploader from './SecureFileUploader';
import { api } from '../services/api';
import { FaDownload, FaFileAlt, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface ScheduleFile {
  id: number;
  filename: string;
  uploadthingUrl?: string;
  uploadthingKey?: string;
}

interface ScheduleFileManagementProps {
  scheduleId: number;
  onFileUpload?: (file: File) => void;
}

const ScheduleFileManagement: React.FC<ScheduleFileManagementProps> = ({ scheduleId }) => {
  const { data: session } = useSession();
  const user = session?.user;
  const [files, setFiles] = useState<ScheduleFile[]>([]);

  const fetchFiles = useCallback(async () => {
    try {
      const fetchedFiles = await getScheduleFiles(scheduleId);
      setFiles(fetchedFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  }, [scheduleId]);

  useEffect(() => {
    if (user && scheduleId) {
      fetchFiles();
    }
  }, [user, scheduleId, fetchFiles]);

  const handleUploadComplete = async (res: { fileUrl: string; fileKey: string; fileId: number }) => {
    try {
      // Atualiza a escala com o arquivo
      await api.patch(`/schedules/${scheduleId}`, {
        fileId: res.fileId,
      });
      
      toast.success('Arquivo enviado com sucesso!');
      fetchFiles();
      
      // Dispara evento para criar conversa (se necessário)
      window.dispatchEvent(new CustomEvent('messaging:conversationCreated', { 
        detail: { scheduleId, fileId: res.fileId } 
      }));
    } catch (error) {
      console.error('Error updating schedule with file:', error);
      toast.error('Erro ao vincular arquivo à escala');
    }
  };

  const handleDownload = (file: ScheduleFile) => {
    if (file.uploadthingUrl) {
      // Se o arquivo está no UploadThing, abre diretamente
      window.open(file.uploadthingUrl, '_blank');
    } else {
      // Fallback para arquivos antigos
      window.open(`${api.defaults.baseURL}/files/${file.id}`, '_blank');
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!window.confirm('Tem certeza que deseja remover este arquivo?')) return;
    
    try {
      await api.delete(`/files/${fileId}`);
      toast.success('Arquivo removido com sucesso!');
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Erro ao remover arquivo');
    }
  };

  const canUpload = user && (user.role === 'LEADER' || user.role === 'ADMIN');

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-lg text-gray-200">Arquivos da Escala</h4>
      
      {canUpload && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-400 mb-3">
            Anexar arquivo PDF à escala (máximo 8MB)
          </p>
          <SecureFileUploader
            endpoint="scheduleFileUploader"
            acceptedTypes=".pdf"
            onUploadComplete={handleUploadComplete}
            onUploadError={(error) => {
              toast.error(error.message || 'Erro ao fazer upload');
            }}
          />
        </div>
      )}

      <div className="space-y-2">
        {files.length > 0 ? (
          files.map((file) => (
            <div key={file.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-md">
              <div className="flex items-center gap-2">
                <FaFileAlt className="text-blue-400" />
                <span className="text-gray-200">{file.filename}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(file)}
                  className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 flex items-center gap-1"
                  title="Baixar arquivo"
                >
                  <FaDownload /> Download
                </button>
                {canUpload && (
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="text-xs bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600 flex items-center gap-1"
                    title="Remover arquivo"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum arquivo anexado</p>
        )}
      </div>
    </div>
  );
};

export default ScheduleFileManagement;
