import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const userId = Number(id);
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });

  const isOwner = Number(session.user.id) === userId;
  const isAdmin = session.user.role === 'ADMIN';
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const { fileUrl, fileName, mimeType, size } = body;
    if (!fileUrl) return NextResponse.json({ error: 'fileUrl is required' }, { status: 400 });

    // fetch the file bytes from the provided URL
    const res = await fetch(fileUrl);
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch file' }, { status: 502 });
    const buffer = Buffer.from(await res.arrayBuffer());

    const createdFile = await prisma.file.create({
      data: {
        fileName: fileName ?? 'upload',
        mimeType: mimeType ?? (res.headers.get('content-type') ?? 'application/octet-stream'),
        data: buffer,
        size: size ? Number(size) : buffer.length,
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarFileId: createdFile.id },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error saving avatar from URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
