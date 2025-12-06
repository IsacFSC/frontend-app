import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { fileId: fileIdStr } = await params;
    const fileId = Number(fileIdStr);
    if (isNaN(fileId)) {
      return NextResponse.json({ error: 'Invalid file ID' }, { status: 400 });
    }

    const file = await prisma.file.findUnique({ where: { id: fileId } });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Verifica se o arquivo tem dados
    if (!file.data || file.data.length === 0) {
      console.error(`Arquivo ${fileId} não tem dados no banco (buffer vazio)`);
      return NextResponse.json({ 
        error: 'Arquivo sem dados. Este arquivo pode ter sido enviado por um sistema antigo.' 
      }, { status: 500 });
    }

    // Codifica o nome do arquivo para evitar problemas com caracteres especiais UTF-8
    const encodedFileName = encodeURIComponent(file.fileName);
    
    const headers = new Headers();
    headers.set('Content-Type', file.mimeType || 'application/octet-stream');
    // Usa RFC 5987 para suportar caracteres UTF-8 no filename
    headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);

    // Cria um ReadableStream a partir do Buffer do arquivo
    const fileStream = new ReadableStream({
      start(controller) {
        controller.enqueue(file.data);
        controller.close();
      },
    });

    return new Response(fileStream, { headers });
  } catch (error) {
    console.error("Error retrieving file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
