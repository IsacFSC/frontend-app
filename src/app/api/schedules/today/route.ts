import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const schedules = await prisma.schedule.findMany({
    where: { startTime: { gte: startOfDay, lte: endOfDay } },
    include: { users: { include: { user: true } }, tasks: true },
  });

  return NextResponse.json(schedules);
}
