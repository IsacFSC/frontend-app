import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const scheduleId = Number(params.id);
  const userId = Number(params.userId);

  if (isNaN(scheduleId) || isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  await prisma.scheduleUser.create({ data: { scheduleId, userId } });

  return new NextResponse(null, { status: 201 });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const scheduleId = Number(params.id);
  const userId = Number(params.userId);

  if (isNaN(scheduleId) || isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  await prisma.scheduleUser.delete({
    where: { scheduleId_userId: { scheduleId, userId } },
  });

  return new NextResponse(null, { status: 204 });
}
