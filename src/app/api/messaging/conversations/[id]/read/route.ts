import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const numericUserId = Number(userId);

  const { id } = await params;
  const conversationId = Number(id);
  if (isNaN(conversationId)) {
    return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
  }

  // Find all messages in the conversation that the user has not read yet
  const unreadMessages = await prisma.message.findMany({
    where: {
      conversationId,
      authorId: { not: numericUserId },
      readBy: {
        none: {
          userId: numericUserId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  // Create MessageRead entries for each unread message
  if (unreadMessages.length > 0) {
    await prisma.messageRead.createMany({
      data: unreadMessages.map((message) => ({
        messageId: message.id,
        userId: numericUserId,
      })),
      skipDuplicates: true, // In case a race condition or something similar happens
    });
  }

  return NextResponse.json({ message: 'Messages marked as read' });
}
