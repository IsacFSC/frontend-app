import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ email: string }> }
) {
  const { email } = await params;
  
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email }, include: { avatar: true } });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Return only non-sensitive data, include avatarFileId when present
  const { id, name, email: userEmail, avatarFileId } = user;
  return NextResponse.json({ id, name, email: userEmail, avatarFileId });
}
