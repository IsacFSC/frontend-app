import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(_req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const schedules = await prisma.schedule.findMany({
    take: 100,
    orderBy: { startTime: 'desc' },
    include: { users: { include: { user: true } }, tasks: true, file: true },
  });

  return NextResponse.json(schedules);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const schedule = await prisma.schedule.create({ data });

  return NextResponse.json(schedule, { status: 201 });
}
