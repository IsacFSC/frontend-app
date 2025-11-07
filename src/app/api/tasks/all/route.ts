import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prisma, TaskStatus } from '@prisma/client';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = searchParams.get('limit') || '10';
  const offset = searchParams.get('offset') || '0';
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');
  const name = searchParams.get('name');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const take = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const skip = Math.max(0, parseInt(offset, 10) || 0);

  const where: Prisma.TaskWhereInput = {};
  if (userId) {
    where.userId = Number(userId);
  }
  if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
    where.status = status as TaskStatus;
  }
  if (name) {
    where.name = { contains: name, mode: 'insensitive' };
  }
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      const sd = new Date(startDate);
      if (!isNaN(sd.getTime())) where.createdAt.gte = sd;
    }
    if (endDate) {
      const ed = new Date(endDate);
      if (!isNaN(ed.getTime())) {
        ed.setHours(23, 59, 59, 999);
        where.createdAt.lte = ed;
      }
    }
  }

  try {
    const total = await prisma.task.count({ where });
    const tasks = await prisma.task.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const page = Math.floor(skip / take) + 1;
    return NextResponse.json({ data: tasks, total, page, limit: take });
  } catch (err: unknown) {
    console.error('Failed to fetch tasks', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Internal error', details: errorMessage }, { status: 500 });
  }
}
