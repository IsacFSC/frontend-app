import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Role, Prisma } from '@prisma/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limitParam = searchParams.get('limit');
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';
  const activeParam = searchParams.get('active');

  let take: number | undefined;
  if (limitParam === 'all') {
    take = undefined;
  } else if (limitParam) {
    take = parseInt(limitParam, 10);
  } else {
    take = 10;
  }

  const skip = take ? (page - 1) * take : 0;

  const where: Prisma.UserWhereInput = {
    OR: [
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        email: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ],
  };

  if (role && Object.values(Role).includes(role as Role)) {
    where.role = role as Role;
  }

  if (activeParam && activeParam !== 'all') {
    where.active = activeParam === 'true';
  }

  try {
    const users = await prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.user.count({ where });

    return NextResponse.json({ users, total });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}