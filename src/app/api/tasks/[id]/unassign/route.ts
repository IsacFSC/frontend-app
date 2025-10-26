import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'LEADER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const taskId = Number(id);
  if (isNaN(taskId)) {
    return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
  }

  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: { userId: null, scheduleId: null, status: 'PENDING' },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error unassigning task:', error);
    return NextResponse.json({ error: 'Could not unassign task' }, { status: 500 });
  }
}