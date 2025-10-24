import PDFDocument from 'pdfkit';
import { Schedule } from '@/services/scheduleService'; // Adjust this import path if needed

export function generatePdf(schedule: Schedule): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', (err) => {
      reject(err);
    });

    // Title
    doc.fontSize(25).text(`Escala: ${schedule.name}`, { align: 'center' });
    doc.moveDown();

    // Description
    if (schedule.description) {
      doc.fontSize(16).text('Descrição:', { underline: true });
      doc.fontSize(12).text(schedule.description);
      doc.moveDown();
    }

    // Dates
    doc.fontSize(16).text('Período:', { underline: true });
    doc.fontSize(12).text(`Início: ${new Date(schedule.startTime).toLocaleString('pt-BR')}`);
    doc.fontSize(12).text(`Fim: ${new Date(schedule.endTime).toLocaleString('pt-BR')}`);
    doc.moveDown();

    // Users
    if (schedule.users && schedule.users.length > 0) {
      doc.fontSize(16).text('Participantes:', { underline: true });
      schedule.users.forEach(userOnSchedule => {
        doc.fontSize(12).text(`- ${userOnSchedule.user.name} (${userOnSchedule.skill})`);
      });
      doc.moveDown();
    }

    // Tasks
    if (schedule.tasks && schedule.tasks.length > 0) {
      doc.fontSize(16).text('Tarefas:', { underline: true });
      schedule.tasks.forEach(task => {
        doc.fontSize(12).text(`- ${task.name}`);
        if (task.description) {
          doc.fontSize(10).text(task.description, { indent: 20 });
        }
      });
      doc.moveDown();
    }

    doc.end();
  });
}
