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
  
  const conv = await prisma.conversation.findUnique({
    where: { id: convId },
    include: {
      participants: true,
      messages: { include: { author: true, file: true }, orderBy: { createdAt: 'asc' } },
    },
  });

  if (!conv) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  return NextResponse.json(conv);
}

export async function DELETE(
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

  // Get the conversation to check if it exists and if the user is a participant
  const conversation = await prisma.conversation.findUnique({
    where: { id: convId },
    include: { participants: true }
  });

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  // Check if the user is a participant in the conversation
  const isParticipant = conversation.participants.some(p => p.id === Number(session.user.id));
  if (!isParticipant && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Delete the conversation and all related messages (cascade delete will handle this)
    await prisma.conversation.delete({
      where: { id: convId }
    });

    return NextResponse.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}