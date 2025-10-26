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

  const { fileId: fileIdStr } = await params;
  const fileId = Number(fileIdStr);
  if (isNaN(fileId)) {
    return NextResponse.json({ error: 'Invalid file ID' }, { status: 400 });
  }

  const file = await prisma.file.findUnique({ where: { id: fileId } });

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', file.mimeType || 'application/octet-stream');
  headers.set('Content-Disposition', `attachment; filename="${file.fileName}"`);

  return new Response(file.data, { headers });
}
