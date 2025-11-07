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

  const { id } = await params;
  const scheduleId = Number(id);
  if (isNaN(scheduleId)) {
    return NextResponse.json({ error: 'Invalid upload ID' }, { status: 400 });
  }

  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: { file: true },
  });

  if (!schedule || !schedule.file) {
    return NextResponse.json({ error: 'No file found for this schedule' }, { status: 404 });
  }

  const { file } = schedule;
  const headers = new Headers();
  headers.set('Content-Type', file.mimeType || 'application/octet-stream');
  headers.set('Content-Disposition', `inline; filename="${file.fileName}"`);

  // Convert the Uint8Array to a Buffer which is accepted by Response
  const buffer = Buffer.from(file.data);
  return new Response(buffer, { headers });
}
