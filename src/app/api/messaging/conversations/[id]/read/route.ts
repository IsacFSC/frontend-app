import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const convId = Number(params.id);
  if (isNaN(convId)) {
    return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
  }

  const messagesToMarkAsRead = await prisma.message.findMany({
    where: {
      conversationId: convId,
      authorId: { not: userId },
      readBy: { none: { userId } },
    },
    select: { id: true },
  });

  if (messagesToMarkAsRead.length > 0) {
    await prisma.messageRead.createMany({
      data: messagesToMarkAsRead.map((message) => ({
        messageId: message.id,
        userId: userId,
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ message: 'Messages marked as read' });
}
