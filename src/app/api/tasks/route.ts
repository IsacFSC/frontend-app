import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
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
  const task = await prisma.task.create({ data });
  return NextResponse.json(task, { status: 201 });
}
