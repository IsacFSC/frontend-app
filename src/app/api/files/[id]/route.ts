import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fileId = Number(id);
    if (isNaN(fileId)) {
      return NextResponse.json({ error: 'Invalid file ID' }, { status: 400 });
    }

    const file = await prisma.file.findFirst({ where: { id: fileId } });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const headers = new Headers();
    const contentType = file.mimeType || 'application/octet-stream';
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `inline; filename="${file.fileName}"`);

    // Ensure we return the raw binary body. Prisma `Bytes` is typically returned
    // as a Uint8Array or Buffer. Normalize to Uint8Array and return an ArrayBuffer.
    const rawData = file.data as unknown;
    let uint8: Uint8Array | null = null;
    if (rawData instanceof Uint8Array) {
      uint8 = rawData;
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(rawData as Buffer)) {
      uint8 = new Uint8Array(rawData as Buffer);
    } else if (rawData instanceof ArrayBuffer) {
      uint8 = new Uint8Array(rawData as ArrayBuffer);
    }

    if (!uint8) {
      console.error('Unsupported file.data type for file id', fileId);
      return NextResponse.json({ error: 'Unsupported file data type' }, { status: 500 });
    }

  headers.set('Content-Length', String(uint8.byteLength));
  // Uint8Array is accepted as BodyInit (BufferSource) by the Response constructor
  return new Response(uint8 as unknown as BodyInit, { headers });
  } catch (error) {
    console.error("Error retrieving file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
