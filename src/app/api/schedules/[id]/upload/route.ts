import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const scheduleId = Number(params.id);
  if (isNaN(scheduleId)) {
    return NextResponse.json({ error: 'Invalid schedule ID' }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

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

    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { fileId: createdFile.id },
    });

    return NextResponse.json({ fileId: createdFile.id });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload error' }, { status: 500 });
  }
}
