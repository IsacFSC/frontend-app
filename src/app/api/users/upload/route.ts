import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const mimeType = file.type;
    const size = file.size;

    const createdFile = await prisma.file.create({
      data: {
        fileName,
        mimeType,
        data: buffer,
        size,
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: { avatarFileId: createdFile.id },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload error' }, { status: 500 });
  }
}
