import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== 'ADMIN' && session.user.role !== 'LEADER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const scheduleId = Number(id);
  if (isNaN(scheduleId)) {
    return NextResponse.json({ error: 'Invalid schedule ID' }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 1. Create the File record
    const buffer = Buffer.from(await file.arrayBuffer());
    const createdFile = await prisma.file.create({
      data: {
        fileName: file.name,
        mimeType: file.type,
        data: buffer,
        size: file.size,
      },
    });

    // 2. Associate file with schedule
    const schedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: { fileId: createdFile.id },
      include: { users: { include: { user: true } } },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // 3. Create a group conversation
    const participantIds = schedule.users.map(u => u.userId);
    const authorId = Number(session.user.id);
    if (!participantIds.includes(authorId)) {
      participantIds.push(authorId);
    }

    if (participantIds.length === 0) {
        return NextResponse.json({ schedule, conversationId: null });
    }

    const conversation = await prisma.conversation.create({
      data: {
        subject: `Arquivo da Escala: ${schedule.name}`,
        participants: { connect: participantIds.map(id => ({ id })) },
      },
    });

    // 4. Create a message with the file in the new conversation
    await prisma.message.create({
      data: {
        content: `Arquivo anexado: ${file.name}`,
        authorId: authorId,
        conversationId: conversation.id,
        fileId: createdFile.id,
      },
    });

    return NextResponse.json({ schedule, conversationId: conversation.id });

  } catch (error) {
    console.error('Upload error and conversation creation failed:', error);
    return NextResponse.json({ error: 'Upload error' }, { status: 500 });
  }
}