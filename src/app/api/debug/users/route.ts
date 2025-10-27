// src/app/api/debug/users/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden in production' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      // Remova a seleção do passwordHash para evitar o erro de compilação
      select: { id: true, name: true, email: true },
    });
    return NextResponse.json(users);
  } catch (err: unknown) {
    console.error('Debug users error:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Internal error', details: errorMessage }, { status: 500 });
  }
}
