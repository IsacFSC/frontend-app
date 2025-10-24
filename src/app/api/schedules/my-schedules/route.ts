import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const numericUserId = Number(userId);

  const schedules = await prisma.schedule.findMany({
    where: { users: { some: { userId: numericUserId } } },
    include: { users: { include: { user: true } }, tasks: true },
  });

  return NextResponse.json(schedules);
}
