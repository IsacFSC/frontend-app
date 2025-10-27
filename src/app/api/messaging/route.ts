// src/app/api/messaging/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/messaging -> list all conversations (admin-like)
export async function GET(_req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const convs = await prisma.conversation.findMany({
    take: 100,
    orderBy: { updatedAt: 'desc' },
    include: { participants: true, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  return NextResponse.json(convs);
}

// POST /api/messaging -> create a new conversation
export async function POST(req: Request) {
  const session = await auth();
  const authorId = session?.user?.id;

  if (!authorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Converte authorId para number
  const numericAuthorId = Number(authorId);
  if (isNaN(numericAuthorId)) {
      return NextResponse.json({ error: 'Invalid author ID' }, { status: 400 });
  }

  const { subject, participantIds, message, recipientId } = await req.json();

  if (recipientId) {
    // Converter recipientId para number
    const numericRecipientId = Number(recipientId);

    if (isNaN(numericRecipientId)) {
        return NextResponse.json({ error: 'Invalid recipient ID' }, { status: 400 });
    }

    const conv = await prisma.conversation.create({
      data: {
        subject,
        participants: { connect: [{ id: numericAuthorId }, { id: numericRecipientId }] },
      },
      include: { participants: true },
    });

    if (message) {
      await prisma.message.create({ data: { content: message, authorId: numericAuthorId, conversationId: conv.id } });
    }
    const full = await prisma.conversation.findUnique({ where: { id: conv.id }, include: { participants: true, messages: true } });
    return NextResponse.json(full, { status: 201 });
  }

  if (participantIds && Array.isArray(participantIds)) {
    // Aqui também é preciso garantir que os IDs sejam numéricos
    const numericParticipantIds = participantIds.map(id => Number(id));
    if (numericParticipantIds.some(isNaN)) {
        return NextResponse.json({ error: 'Invalid participant ID(s)' }, { status: 400 });
    }
    const conv = await prisma.conversation.create({
      data: {
        subject,
        participants: { connect: numericParticipantIds.map(id => ({ id })) },
      },
      include: { participants: true },
    });
    return NextResponse.json(conv, { status: 201 });
  }

  return NextResponse.json({ error: 'Missing participantIds or recipientId' }, { status: 400 });
}
