
import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getScheduleFiles, uploadScheduleFile, downloadScheduleFile } from '../services/scheduleFileService';

interface ScheduleFile {
  id: number;
  filename: string;
}

interface ScheduleFileManagementProps {
  scheduleId: number;
  onFileUpload?: (file: File) => void;
}

interface UploadResponse {
  conversationId?: number;
}

const ScheduleFileManagement: React.FC<ScheduleFileManagementProps> = ({ scheduleId, onFileUpload }) => {
  const { data: session } = useSession();
  const user = session?.user;
  const [files, setFiles] = useState<ScheduleFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (selectedFile && scheduleId) {
      try {
        const result: UploadResponse = await uploadScheduleFile(scheduleId, selectedFile);
        setSelectedFile(null); // Clear selected file after upload
        fetchFiles();
        if (onFileUpload) onFileUpload(selectedFile);
        const convoId = result?.conversationId;
        if (convoId) {
          window.dispatchEvent(new CustomEvent('messaging:conversationCreated', { detail: { id: convoId } }));
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };

  const handleDownload = async (fileId: number, filename: string) => {
    try {
      const response = await downloadScheduleFile(fileId);
      const blobData = response instanceof Blob ? response : (response?.data || response);
      const url = window.URL.createObjectURL(new Blob([blobData] as BlobPart[]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <div>
      {user && user.role === 'LEADER' && (
        <div>
          <input type="file" onChange={handleFileChange} />
          <button onClick={handleUpload}>Upload</button>
        </div>
      )}
      <ul>
        {files.map((file) => (
          <li key={file.id}>
            {file.filename} - <button onClick={() => handleDownload(file.id, file.filename)}>Download</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ScheduleFileManagement;
