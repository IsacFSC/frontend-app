import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const authorId = session?.user?.id;

    if (!authorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const convId = Number(id);
    if (isNaN(convId)) {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const content = formData.get('content') as string || '';

    console.log('Upload de mensagem iniciado:', {
      conversationId: convId,
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
    });

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // ===== VALIDAÇÕES DE SEGURANÇA RIGOROSAS =====
    
    // 1. Validação de tipo MIME - apenas PDF
    const allowedMimeType = 'application/pdf';
    if (file.type !== allowedMimeType) {
      console.error('MIME type inválido:', { received: file.type, expected: allowedMimeType });
      return NextResponse.json({ 
        error: `Tipo de arquivo não permitido. Recebido: ${file.type}. Apenas PDF (application/pdf) é aceito.` 
      }, { status: 400 });
    }

    // 2. Validação de extensão do arquivo
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ 
        error: 'Extensão de arquivo inválida. Apenas arquivos .pdf são permitidos.' 
      }, { status: 400 });
    }

    // 3. Validação de tamanho máximo (8MB)
    const maxSizeBytes = 8 * 1024 * 1024; // 8MB
    if (file.size > maxSizeBytes) {
      return NextResponse.json({ 
        error: 'Arquivo muito grande. Tamanho máximo permitido: 8MB.' 
      }, { status: 400 });
    }

    // 4. Validação de tamanho mínimo (evita arquivos vazios)
    if (file.size < 100) {
      return NextResponse.json({ 
        error: 'Arquivo muito pequeno ou corrompido.' 
      }, { status: 400 });
    }

    // 5. Validação de nome do arquivo
    if (file.name.length > 255) {
      return NextResponse.json({ 
        error: 'Nome do arquivo muito longo. Máximo 255 caracteres.' 
      }, { status: 400 });
    }

    // 6. Validação de caracteres perigosos no nome
    const dangerousChars = /[<>:"|?*\x00-\x1f]/g;
    if (dangerousChars.test(file.name)) {
      return NextResponse.json({ 
        error: 'Nome do arquivo contém caracteres inválidos.' 
      }, { status: 400 });
    }

    console.log('Criando buffer do arquivo...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('Buffer criado:', { bufferSize: buffer.length });

    // 7. Sanitização do nome do arquivo
    const sanitizeFileName = (filename: string): string => {
      // Remove caracteres perigosos e normaliza
      return filename
        .replace(/[<>:"|?*\x00-\x1f]/g, '_')
        .replace(/\.\./g, '_')
        .replace(/\\/g, '_')
        .replace(/\//g, '_')
        .substring(0, 255);
    };

    const sanitizedFileName = sanitizeFileName(file.name);

    const createdFile = await prisma.file.create({
      data: {
        fileName: sanitizedFileName,
        mimeType: file.type,
        data: buffer,
        size: file.size,
      },
    });

    const message = await prisma.message.create({
      data: {
        content,
        authorId: Number(authorId),
        conversationId: convId,
        fileId: createdFile.id,
      },
    });

    console.log('Upload de mensagem completo:', {
      messageId: message.id,
      fileId: createdFile.id,
      fileName: sanitizedFileName,
    });

    return NextResponse.json({ 
      success: true,
      message,
      file: {
        id: createdFile.id,
        fileName: sanitizedFileName,
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar upload',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
