import { NextResponse } from 'next/server';
import { generatePdf } from '@/lib/pdf';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

// Força a rota a ser sempre dinâmica
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const scheduleId = Number(params.id);
    if (isNaN(scheduleId)) {
      return NextResponse.json({ error: 'ID da escala inválido' }, { status: 400 });
    }

    // Busca a escala diretamente do banco de dados em vez de usar a API
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        users: { include: { user: true } },
        tasks: true,
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Escala não encontrada' }, { status: 404 });
    }

    const pdfBuffer = await generatePdf(schedule);

    // Define o nome e o caminho do arquivo para salvar no servidor
    const filename = `escala-${schedule.name.replace(/\s+/g, '_').toLowerCase()}.pdf`;
    const savePath = path.join(process.cwd(), 'public', 'schedules', filename);

    // Garante que o diretório exista
    await fs.mkdir(path.dirname(savePath), { recursive: true });

    // Salva o arquivo PDF no servidor
    await fs.writeFile(savePath, pdfBuffer);

    // Retorna uma resposta de sucesso com o caminho do arquivo salvo
    return NextResponse.json({
      message: 'PDF salvo com sucesso no servidor.',
      filePath: `/schedules/${filename}` // Caminho público para o arquivo
    });
  } catch (error: any) {
    console.error('Erro na geração do PDF:', error);
    // Retorna um erro genérico para o cliente
    return NextResponse.json(
      { error: 'Falha ao gerar o PDF.', details: error.message },
      { status: 500 }
    );
  }
}