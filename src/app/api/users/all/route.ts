import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = searchParams.get('limit') || '10';
  const offset = searchParams.get('offset') || '0';
  const search = searchParams.get('search');
  const active = searchParams.get('active');
  const role = searchParams.get('role');

  const take = Number(limit) || 10;
  const skip = Number(offset) || 0;

  const filters: Prisma.UserWhereInput[] = [];
  if (search && String(search).trim() !== '') {
    filters.push({ OR: [{ name: { contains: String(search), mode: 'insensitive' } }, { email: { contains: String(search), mode: 'insensitive' } }] });
  }
  if (typeof active !== 'undefined' && active !== null && active !== 'all') {
    filters.push({ active: active === 'true' });
  }
  if (typeof role !== 'undefined' && role !== null && role !== 'all' && ['ADMIN', 'LEADER', 'USER'].includes(String(role))) {
    filters.push({ role: String(role) as any });
  }

  let whereClause: Prisma.UserWhereInput = {};
  if (filters.length === 1) {
    whereClause = filters[0];
  } else if (filters.length > 1) {
    whereClause = { AND: filters };
  }

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({ where: whereClause, take, skip, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where: whereClause }),
  ]);

  return NextResponse.json({ users, total });
}
