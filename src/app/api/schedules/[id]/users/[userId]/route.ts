import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'LEADER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, userId } = await params;
  const scheduleId = Number(id);
  const numericUserId = Number(userId);

  if (isNaN(scheduleId) || isNaN(numericUserId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const { skill } = await req.json();
  if (!skill) {
    return NextResponse.json({ error: 'Missing skill' }, { status: 400 });
  }

  try {
    // Ensure the user exists and is active
    const targetUser = await prisma.user.findUnique({ where: { id: numericUserId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (!targetUser.active) {
      return NextResponse.json({ error: 'User is deactivated and cannot be scheduled' }, { status: 400 });
    }

    const result = await prisma.usersOnSchedules.create({
      data: {
        scheduleId: scheduleId,
        userId: numericUserId,
        skill: skill,
      },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error adding user to schedule:', error);
    return NextResponse.json({ error: 'Could not add user to schedule' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'LEADER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, userId } = await params;
  const scheduleId = Number(id);
  const numericUserId = Number(userId);

  if (isNaN(scheduleId) || isNaN(numericUserId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    await prisma.usersOnSchedules.delete({
      where: {
        userId_scheduleId: {
          userId: numericUserId,
          scheduleId: scheduleId,
        },
      },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error removing user from schedule:', error);
    return NextResponse.json({ error: 'Could not remove user from schedule' }, { status: 500 });
  }
}