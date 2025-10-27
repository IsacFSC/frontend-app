import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function DELETE(_req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const numericUserId = Number(userId);

  const userRecord = await prisma.user.findUnique({ where: { id: numericUserId } });

  if (!userRecord || !userRecord.avatarFileId) {
    return NextResponse.json({ error: 'User has no avatar' }, { status: 400 });
  }

  try {
    // First, update the user to remove the association
    const updatedUser = await prisma.user.update({
      where: { id: numericUserId },
      data: { avatarFileId: null },
    });

    // Then, delete the file
    await prisma.file.delete({ where: { id: userRecord.avatarFileId } });

    return NextResponse.json({ user: updatedUser });

  } catch (error) {
    console.error("Failed to delete avatar:", error);
    return NextResponse.json({ error: 'Failed to delete avatar' }, { status: 500 });
  }
}
