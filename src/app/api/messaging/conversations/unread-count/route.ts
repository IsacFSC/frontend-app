import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(_req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const numericUserId = Number(userId);

  const count = await prisma.message.count({
    where: {
      conversation: {
        participants: {
          some: {
            id: numericUserId,
          },
        },
      },
      authorId: {
        not: numericUserId,
      },
      readBy: {
        none: {
          userId: numericUserId,
        },
      },
    },
  });

  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');

  return NextResponse.json(count, { headers });
}
