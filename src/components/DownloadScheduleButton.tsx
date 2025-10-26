"use client";
import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import SchedulePDFDocument from './SchedulePDFDocument';
import { Schedule as ServiceSchedule } from '@/services/scheduleService';

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
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
    >
      {({ loading }) => (loading ? 'Gerando PDF...' : 'Baixar Escala em PDF')}
    </PDFDownloadLink>
  );
};

export default DownloadScheduleButton;
