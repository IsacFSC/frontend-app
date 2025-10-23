import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/messaging/conversations -> list conversations for current user
export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const convs = await prisma.conversation.findMany({
    where: { participants: { some: { id: userId } } },
    take: 100,
    orderBy: { updatedAt: 'desc' },
    include: {
      participants: true,
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  const unreadMessages = await prisma.message.findMany({
    where: {
      conversation: { participants: { some: { id: userId } } },
      authorId: { not: userId },
      readBy: { none: { userId: userId } },
    },
    select: {
      conversationId: true,
    },
  });

  const unreadConversationIds = new Set(unreadMessages.map((m) => m.conversationId));

  const convsWithUnread = convs.map((conv) => ({
    ...conv,
    hasUnreadMessages: unreadConversationIds.has(conv.id),
  }));

  return NextResponse.json(convsWithUnread);
}

// POST /api/messaging/conversations -> create a new conversation
export async function POST(req: Request) {
  const session = await auth();
  const authorId = session?.user?.id;

  if (!authorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { subject, participantIds, message, recipientId } = await req.json();

  if (recipientId) {
    const conv = await prisma.conversation.create({
      data: {
        subject,
        participants: { connect: [{ id: authorId }, { id: Number(recipientId) }] },
      },
      include: { participants: true },
    });

    if (message) {
      await prisma.message.create({ data: { content: message, authorId, conversationId: conv.id } });
    }
    const full = await prisma.conversation.findUnique({ where: { id: conv.id }, include: { participants: true, messages: true } });
    return NextResponse.json(full, { status: 201 });
  }

  if (participantIds && Array.isArray(participantIds)) {
    const conv = await prisma.conversation.create({
      data: {
        subject,
        participants: { connect: participantIds.map((id: number) => ({ id })) },
      },
      include: { participants: true },
    });
    return NextResponse.json(conv, { status: 201 });
  }

  return NextResponse.json({ error: 'Missing participantIds or recipientId' }, { status: 400 });
}
