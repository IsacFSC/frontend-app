import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path'; // Importação corrigida
import { Schedule } from '@/services/scheduleService';
import { Role } from '@/services/userService';
import ReactPDF from '@react-pdf/renderer';
import SchedulePDFDocument from '@/components/SchedulePDFDocument';

// Força a rota a ser sempre dinâmica
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const scheduleId = Number(id);
    if (isNaN(scheduleId)) {
      return NextResponse.json({ error: 'ID da escala inválido' }, { status: 400 });
    }

    // Busca a escala diretamente do banco de dados em vez de usar a API
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        users: { include: { user: true } },
        tasks: true,
        file: true,
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Escala não encontrada' }, { status: 404 });
    }

    // Adapta o objeto para o tipo esperado por `generatePdf`
    const scheduleForPdf: Schedule = {
      ...schedule,
      description: schedule.description ?? null,
      startTime: schedule.startTime.toISOString(),
      endTime: schedule.endTime.toISOString(),
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
      file: schedule.file ? schedule.file.fileName : null,
      users: schedule.users.map(u => ({
        ...u,
        assignedAt: u.assignedAt.toISOString(),
        user: {
          ...u.user,
          name: u.user.name ?? '',
          email: u.user.email ?? '',
          image: u.user.image ?? null,
          createdAt: u.user.createdAt?.toISOString() ?? new Date().toISOString(),
          role: u.user.role as Role,
        },
      })),
    };

    const pdfBuffer = await ReactPDF.renderToBuffer(<SchedulePDFDocument schedule={scheduleForPdf} />);

    const filename = `escala-${schedule.name.replace(/\s+/g, '_').toLowerCase()}.pdf`;
    const savePath = path.join(process.cwd(), 'public', 'schedules', filename);

    await fs.mkdir(path.dirname(savePath), { recursive: true });
    await fs.writeFile(savePath, pdfBuffer);

    return NextResponse.json({
      message: 'PDF salvo com sucesso no servidor.',
      filePath: `/schedules/${filename}`,
    });
  } catch (error: unknown) {
    console.error('Erro na geração do PDF:', error);

    let errorMessage = 'Falha desconhecida ao gerar o PDF.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return NextResponse.json(
      { error: 'Falha ao gerar o PDF.', details: errorMessage },
      { status: 500 }
    );
  }
}
