import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

import { TaskStatus } from '@prisma/client';

// Define the interface for task update data
interface TaskUpdateData {
  name?: string;
  description?: string;
  status?: TaskStatus;
  userId?: number | null;
  taskDate?: Date | null;
}

export async function GET(
  _req: Request, // Parâmetro não utilizado
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const taskId = Number(id);
  if (isNaN(taskId)) {
    return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { user: true },
  });

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json(task);
}

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

  const body = await req.json();
  const { name, description, status, userId, taskDate } = body;

  const data: TaskUpdateData = {};
  if (name) data.name = name;
  if (description) data.description = description;
  if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
    data.status = status as TaskStatus;
  }
  if (userId !== undefined) data.userId = userId;
  if (taskDate !== undefined) data.taskDate = taskDate ? new Date(taskDate) : null;

  try {
    const task = await prisma.task.update({ where: { id: taskId }, data });
    return NextResponse.json(task);
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request, // Parâmetro não utilizado
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
    await prisma.task.delete({ where: { id: taskId } });
    return new NextResponse(null, { status: 204 });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
