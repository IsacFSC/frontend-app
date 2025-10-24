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
  const convId = Number(id);
  if (isNaN(convId)) {
    return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: convId },
    include: { author: true, file: true },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(messages);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const authorId = session?.user?.id;

  if (!authorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const numericAuthorId = Number(authorId);

  const { id } = await params;
  const conversationId = Number(id);
  if (isNaN(conversationId)) {
    return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
  }

  const { content } = await req.json();
  if (!content) {
    return NextResponse.json({ error: 'Missing message content' }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      content,
      authorId: numericAuthorId,
      conversationId,
    },
  });

  return NextResponse.json(message, { status: 201 });
}
