import PDFDocument from 'pdfkit'; // Importa a biblioteca pdfkit
import { Schedule } from '@/services/scheduleService';

// A função agora é mais simples e usa as fontes padrão do PDFKit.
export async function generatePdf(schedule: Schedule): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });

    // Cabeçalho
    doc
      .fontSize(20)
      .font('LiberationSans-Bold')
      .text(`Escala: ${schedule.name}`, { align: 'center' });
    doc.moveDown();

    // Data e Hora
    const date = new Date(schedule.startTime).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    const startTime = new Date(schedule.startTime).toLocaleTimeString('pt-BR', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(schedule.endTime).toLocaleTimeString('pt-BR', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });
    doc.fontSize(12).font('LiberationSans-Regular').text(`Data: ${date}`, { align: 'center' });
    doc.text(`Horário: ${startTime} - ${endTime}`, { align: 'center' });
    doc.moveDown(2);

    // Descrição
    if (schedule.description) {
      doc.fontSize(16).font('LiberationSans-Bold').text('Descrição:', { underline: true });
      doc.fontSize(12).font('LiberationSans-Regular').text(schedule.description);
      doc.moveDown();
    }

    // Músicas/Tarefas
    if (schedule.tasks && schedule.tasks.length > 0) {
      doc.fontSize(16).font('LiberationSans-Bold').text('Músicas:', { underline: true });
      schedule.tasks.forEach(task => {
        doc.fontSize(12).font('LiberationSans-Bold').text(`- ${task.name}`);
        if (task.description) {
          doc.font('LiberationSans-Regular').text(task.description, { indent: 20 });
        }
        doc.moveDown(0.5);
      });
      doc.moveDown();
    }

    // Ministros/Usuários
    doc.fontSize(16).font('LiberationSans-Bold').text('Ministros:', { underline: true });
    schedule.users.forEach(userOnSchedule => {
      doc.fontSize(12).font('LiberationSans-Regular').text(`- ${userOnSchedule.user.name} (${userOnSchedule.skill.replace(/_/g, ' ')})`);
    });

    doc.end();
  });
}
