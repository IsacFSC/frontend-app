import PDFDocument from 'pdfkit'

interface PdfTask {
  name: string;
  description?: string;
}

interface PdfUserOnSchedule {
  user: { name: string };
  skill: string;
}

interface PdfSchedule {
  name: string;
  startTime: string | Date;
  endTime: string | Date;
  tasks: PdfTask[];
  users: PdfUserOnSchedule[];
}

export function generateSchedulePDF(schedule: PdfSchedule): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });

    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(schedule.name, { align: 'center' });
    doc.moveDown();

    const date = new Date(schedule.startTime).toLocaleDateString('pt-BR');
    const time = `${new Date(schedule.startTime).toLocaleTimeString('pt-BR')} - ${new Date(schedule.endTime).toLocaleTimeString('pt-BR')}`;
    doc.fontSize(12).font('Helvetica').text(`Data: ${date}`, { align: 'center' });
    doc.text(`Horário: ${time}`, { align: 'center' });
    doc.moveDown(2);

    if (schedule.tasks && schedule.tasks.length > 0) {
      doc.fontSize(16).font('Helvetica-Bold').text('Músicas', { underline: true });
      doc.moveDown();
      schedule.tasks.forEach((task: PdfTask) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`- ${task.name}`);
        if (task.description) {
          doc.font('Helvetica').text(task.description, { indent: 20 });
        }
        doc.moveDown(0.5);
      });
      doc.moveDown();
    }

    doc.fontSize(16).font('Helvetica-Bold').text('Ministros', { underline: true });
    doc.moveDown();
    schedule.users.forEach((userOnSchedule: PdfUserOnSchedule) => {
      doc.fontSize(12).font('Helvetica').text(`- ${userOnSchedule.user.name} (${userOnSchedule.skill})`);
    });

    doc.end();
  });
}
