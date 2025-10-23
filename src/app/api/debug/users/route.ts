import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden in production' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, passwordHash: true },
    });
    return NextResponse.json(users);
  } catch (err: any) {
    console.error('Debug users error:', err);
    return NextResponse.json({ error: 'Internal error', details: err?.message || String(err) }, { status: 500 });
  }
}
