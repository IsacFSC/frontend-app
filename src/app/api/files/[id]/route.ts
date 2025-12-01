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
    let uint8: Uint8Array | null = null;
    if (file.data instanceof Uint8Array) {
      uint8 = file.data;
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(file.data)) {
      uint8 = new Uint8Array(file.data as Buffer);
    } else {
      // Fallback: try to convert to Uint8Array
      try {
        uint8 = new Uint8Array(file.data as ArrayBufferLike);
      } catch (e) {
        console.error('Failed to convert file.data to Uint8Array', e);
      }
    }

    if (!uint8) {
      console.error('Unsupported file.data type for file id', fileId);
      return NextResponse.json({ error: 'Unsupported file data type' }, { status: 500 });
    }

  headers.set('Content-Length', String(uint8.byteLength));
  // Convert Uint8Array to ArrayBuffer for Response body
  const arrayBuffer = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength) as ArrayBuffer;
  return new Response(arrayBuffer, { headers });
  } catch (error) {
    console.error("Error retrieving file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
