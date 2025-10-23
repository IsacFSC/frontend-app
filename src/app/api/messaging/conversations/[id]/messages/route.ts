import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const convId = Number(params.id);
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
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const authorId = session?.user?.id;

  if (!authorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const convId = Number(params.id);
  if (isNaN(convId)) {
    return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
  }

  const { content } = await req.json();
  if (!content) {
    return NextResponse.json({ error: 'Missing content' }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: { content, authorId, conversationId: convId },
  });

  return NextResponse.json(message, { status: 201 });
}
