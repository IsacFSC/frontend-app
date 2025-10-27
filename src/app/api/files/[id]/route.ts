import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const fileId = Number(id);
    if (isNaN(fileId)) {
      return NextResponse.json({ error: 'Invalid file ID' }, { status: 400 });
    }

    const file = await prisma.file.findFirst({ where: { id: fileId } });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', file.mimeType || 'application/octet-stream');
    headers.set('Content-Disposition', `inline; filename="${file.fileName}"`);

    // Criar um ReadableStream a partir do Buffer do arquivo
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
