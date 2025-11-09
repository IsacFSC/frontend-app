"use client";
import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import SchedulePDFDocument from './SchedulePDFDocument';
import { Schedule as ServiceSchedule } from '@/services/scheduleService';
import { FaDownload } from 'react-icons/fa';

interface DownloadScheduleButtonProps {
  schedule: ServiceSchedule;
}

const DownloadScheduleButton: React.FC<DownloadScheduleButtonProps> = ({ schedule }) => {
  if (!schedule) {
    return <button className="px-4 py-2 bg-gray-500 text-white rounded-md cursor-not-allowed" disabled>Carregando...</button>;
  }

  return (
    <PDFDownloadLink
      document={<SchedulePDFDocument schedule={schedule} />}
      fileName={`escala-${schedule.name.replace(/\s+/g, '-').toLowerCase()}.pdf`}
      className="text-sm text-white bg-gray-600 hover:bg-gray-700 border rounded-3xl p-1 flex items-center" title="Baixar Escala"
    >
      {({ loading }) => (loading ? 'Gerando PDF...' : (
          <span className="flex items-center">
            <FaDownload className="mr-1 ml-1 hidden sm:block w-3 h-3" />
            Baixar Escala
          </span>
        ))}
    </PDFDownloadLink>
  );
};

export default DownloadScheduleButton;
