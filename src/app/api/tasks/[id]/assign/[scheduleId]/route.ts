import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: { id: string; scheduleId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const taskId = Number(params.id);
  const scheduleId = Number(params.scheduleId);

  if (isNaN(taskId) || isNaN(scheduleId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: { users: true },
  });

  if (!schedule || schedule.users.length === 0) {
    return NextResponse.json({ error: 'Schedule has no assigned user' }, { status: 400 });
  }
  const userId = schedule.users[0].userId;

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { userId, scheduleId: scheduleId, status: 'ASSIGNED' },
  });

  return NextResponse.json(task);
}
