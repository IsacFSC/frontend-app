import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(_req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({ take: 50 });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, description, taskDate } = await req.json();
  const data = {
    name,
    description,
    taskDate: taskDate ? new Date(taskDate) : null,
  };
  // associate the created task with the currently authenticated user
  const numericUserId = session.user?.id ? Number(session.user.id) : null;
  if (numericUserId && !isNaN(numericUserId)) {
    // set userId on creation
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    data.userId = numericUserId;
  }

  const task = await prisma.task.create({ data, include: { user: true } });
  return NextResponse.json(task, { status: 201 });
}
