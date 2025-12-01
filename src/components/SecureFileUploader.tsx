'use client';

import { useUploadThing } from "@/lib/uploadthing";
import { useState } from "react";
import { FaCloudUploadAlt, FaCheckCircle, FaExclamationTriangle, FaSpinner } from "react-icons/fa";

interface SecureFileUploaderProps {
  endpoint: "scheduleFileUploader" | "messageFileUploader" | "avatarUploader";
  onUploadComplete?: (res: { fileUrl: string; fileKey: string; fileId: number; fileName: string }) => void;
  onUploadError?: (error: Error) => void;
  maxFiles?: number;
  className?: string;
  acceptedTypes?: string;
}

export default function SecureFileUploader({
  endpoint,
  onUploadComplete,
  onUploadError,
  maxFiles = 1,
  className = "",
  acceptedTypes,
}: SecureFileUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        setUploadStatus('success');
        setUploadProgress(100);
        if (onUploadComplete) {
          onUploadComplete({
            fileUrl: res[0].url,
            fileKey: res[0].key,
            fileId: (res[0].serverData as { fileId?: number })?.fileId || 0,
            fileName: res[0].name,
          });
        }
        // Reset após 3 segundos
        setTimeout(() => {
          setFiles([]);
          setUploadProgress(0);
          setUploadStatus('idle');
        }, 3000);
      }
    },
    onUploadError: (error: Error) => {
      console.error("Erro no upload:", error);
      setUploadStatus('error');
      setErrorMessage(error.message || 'Erro desconhecido ao fazer upload');
      if (onUploadError) {
        onUploadError(error);
      }
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length === 0) return;
    
    // Validação de quantidade
    if (selectedFiles.length > maxFiles) {
      setUploadStatus('error');
      setErrorMessage(`Máximo de ${maxFiles} arquivo(s) permitido(s)`);
      return;
    }

    // Validação básica de tipo no cliente (complementar à validação do servidor)
    const invalidFiles = selectedFiles.filter(file => {
      if (acceptedTypes) {
        const accepted = acceptedTypes.split(',').map(t => t.trim());
        return !accepted.some(type => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type);
          }
          return file.type.match(type.replace('*', '.*'));
        });
      }
      return false;
    });

    if (invalidFiles.length > 0) {
      setUploadStatus('error');
      setErrorMessage(`Tipo de arquivo não permitido: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setFiles(selectedFiles);
    setUploadStatus('idle');
    setErrorMessage('');
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploadStatus('uploading');
    setUploadProgress(0);
    setErrorMessage('');

    try {
      await startUpload(files);
    } catch (error) {
      console.error("Erro ao iniciar upload:", error);
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao fazer upload');
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <FaSpinner className="animate-spin text-blue-500" />;
      case 'success':
        return <FaCheckCircle className="text-green-500" />;
      case 'error':
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return <FaCloudUploadAlt className="text-gray-400" />;
    }
  };

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case 'uploading':
        return `Enviando... ${uploadProgress}%`;
      case 'success':
        return 'Upload concluído com sucesso!';
      case 'error':
        return errorMessage || 'Erro ao fazer upload';
      default:
        return files.length > 0 ? `${files.length} arquivo(s) selecionado(s)` : 'Nenhum arquivo selecionado';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col gap-3">
        <label className="block">
          <div className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors bg-gray-800">
            <div className="flex flex-col items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm text-gray-300">
                {files.length === 0 ? 'Clique para selecionar arquivo' : files.map(f => f.name).join(', ')}
              </span>
              <span className="text-xs text-gray-500">{acceptedTypes || 'Todos os tipos'}</span>
            </div>
          </div>
          <input
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept={acceptedTypes}
            multiple={maxFiles > 1}
            disabled={isUploading || uploadStatus === 'uploading'}
          />
        </label>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <span className={`${uploadStatus === 'error' ? 'text-red-400' : uploadStatus === 'success' ? 'text-green-400' : 'text-gray-400'}`}>
            {getStatusMessage()}
          </span>
        </div>

        {files.length > 0 && uploadStatus !== 'success' && (
          <button
            onClick={handleUpload}
            disabled={isUploading || uploadStatus === 'uploading'}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <FaSpinner className="animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <FaCloudUploadAlt />
                Fazer Upload
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
