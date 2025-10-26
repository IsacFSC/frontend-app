import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'LEADER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, scheduleId: scheduleIdStr } = await params;
  const taskId = Number(id);
  const scheduleId = Number(scheduleIdStr);

  if (isNaN(taskId) || isNaN(scheduleId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: { scheduleId: scheduleId }, // Only associate the task with the schedule
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error assigning task to schedule:', error);
    return NextResponse.json({ error: 'Could not assign task to schedule' }, { status: 500 });
  }
}