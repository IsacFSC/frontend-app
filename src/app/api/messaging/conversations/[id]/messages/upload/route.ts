import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const authorId = session?.user?.id;

  if (!authorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const convId = Number(params.id);
  if (isNaN(convId)) {
    return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const content = formData.get('content') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const createdFile = await prisma.file.create({
      data: {
        fileName: file.name,
        mimeType: file.type,
        data: buffer,
        size: file.size,
      },
    });

    const message = await prisma.message.create({
      data: {
        content,
        authorId,
        conversationId: convId,
        fileId: createdFile.id,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload error' }, { status: 500 });
  }
}
