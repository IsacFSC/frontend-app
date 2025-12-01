import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// Tipos permitidos e tamanhos máximos
const ALLOWED_FILE_TYPES = {
  schedules: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  messages: ["image/jpeg", "image/png", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  avatars: ["image/jpeg", "image/png", "image/webp"],
} as const;

const MAX_FILE_SIZES = {
  schedules: "16MB",
  messages: "8MB",
  avatars: "2MB",
} as const;

// Middleware de autenticação e autorização
const authMiddleware = async () => {
  const session = await auth();
  if (!session?.user) {
    throw new UploadThingError("Não autorizado - faça login");
  }
  return { userId: Number(session.user.id), userRole: session.user.role };
};

// Validação de nome de arquivo seguro
const sanitizeFileName = (fileName: string): string => {
  // Remove caracteres perigosos e limita o tamanho
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  const extension = fileName.substring(fileName.lastIndexOf('.'));
  
  // Remove caracteres especiais, mantém apenas alfanuméricos, hífens e underscores
  const safeName = nameWithoutExt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 100); // Limite de 100 caracteres
  
  const safeExtension = extension.toLowerCase().replace(/[^a-z.]/g, '');
  
  return `${safeName}${safeExtension}`;
};

// Validação rigorosa de tipo MIME
const validateMimeType = (file: { type: string }, allowedTypes: readonly string[]): boolean => {
  if (!file.type) return false;
  return allowedTypes.includes(file.type);
};

export const ourFileRouter = {
  // Upload de arquivos para escalas (apenas ADMIN e LEADER)
  scheduleFileUploader: f({
    pdf: { maxFileSize: MAX_FILE_SIZES.schedules, maxFileCount: 1 },
    image: { maxFileSize: MAX_FILE_SIZES.schedules, maxFileCount: 1 },
  })
    .middleware(async ({ files }) => {
      const { userId, userRole } = await authMiddleware();
      
      // Apenas ADMIN e LEADER podem fazer upload em escalas
      if (userRole !== 'ADMIN' && userRole !== 'LEADER') {
        throw new UploadThingError("Apenas administradores e líderes podem fazer upload em escalas");
      }

      // Validação de tipo MIME
      const file = files[0];
      if (!validateMimeType(file, ALLOWED_FILE_TYPES.schedules)) {
        throw new UploadThingError(`Tipo de arquivo não permitido. Use: PDF, JPG, PNG ou WebP`);
      }

      // Validação de tamanho (adicional à configuração)
      const maxSizeBytes = 16 * 1024 * 1024; // 16MB
      if (file.size > maxSizeBytes) {
        throw new UploadThingError(`Arquivo muito grande. Tamanho máximo: 16MB`);
      }

      return { userId, uploadedBy: userId, fileType: 'schedule' };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload de arquivo de escala completo:", {
        userId: metadata.userId,
        fileUrl: file.url,
        fileName: file.name,
        fileSize: file.size,
      });

      // Salva referência no banco de dados
      try {
        const dbFile = await prisma.file.create({
          data: {
            fileName: sanitizeFileName(file.name),
            mimeType: file.type || 'application/octet-stream',
            data: Buffer.from(''), // UploadThing hospeda o arquivo, não precisamos dos bytes
            size: file.size,
          },
        });

        // Retorna informações para o cliente
        return {
          uploadedBy: metadata.userId,
          fileUrl: file.url,
          fileKey: file.key,
          fileId: dbFile.id,
          fileName: file.name,
        };
      } catch (error) {
        console.error("Erro ao salvar referência do arquivo no banco:", error);
        throw new UploadThingError("Erro ao processar upload");
      }
    }),

  // Upload de arquivos para mensagens (todos os usuários autenticados)
  messageFileUploader: f({
    pdf: { maxFileSize: MAX_FILE_SIZES.messages, maxFileCount: 1 },
    image: { maxFileSize: MAX_FILE_SIZES.messages, maxFileCount: 1 },
    "application/msword": { maxFileSize: MAX_FILE_SIZES.messages, maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: MAX_FILE_SIZES.messages, maxFileCount: 1 },
  })
    .middleware(async ({ files }) => {
      const { userId } = await authMiddleware();

      // Validação de tipo MIME
      const file = files[0];
      if (!validateMimeType(file, ALLOWED_FILE_TYPES.messages)) {
        throw new UploadThingError(`Tipo de arquivo não permitido. Use: PDF, JPG, PNG, WebP ou DOC/DOCX`);
      }

      // Validação de tamanho
      const maxSizeBytes = 8 * 1024 * 1024; // 8MB
      if (file.size > maxSizeBytes) {
        throw new UploadThingError(`Arquivo muito grande. Tamanho máximo: 8MB`);
      }

      return { userId, uploadedBy: userId, fileType: 'message' };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload de arquivo de mensagem completo:", {
        userId: metadata.userId,
        fileUrl: file.url,
        fileName: file.name,
        fileSize: file.size,
      });

      // Salva referência no banco de dados
      try {
        const dbFile = await prisma.file.create({
          data: {
            fileName: sanitizeFileName(file.name),
            mimeType: file.type || 'application/octet-stream',
            data: Buffer.from(''), // UploadThing hospeda o arquivo
            size: file.size,
          },
        });

        return {
          uploadedBy: metadata.userId,
          fileUrl: file.url,
          fileKey: file.key,
          fileId: dbFile.id,
          fileName: file.name,
        };
      } catch (error) {
        console.error("Erro ao salvar referência do arquivo no banco:", error);
        throw new UploadThingError("Erro ao processar upload");
      }
    }),

  // Upload de avatar (todos os usuários autenticados)
  avatarUploader: f({
    image: { maxFileSize: MAX_FILE_SIZES.avatars, maxFileCount: 1 },
  })
    .middleware(async ({ files }) => {
      const { userId } = await authMiddleware();

      // Validação de tipo MIME (apenas imagens)
      const file = files[0];
      if (!validateMimeType(file, ALLOWED_FILE_TYPES.avatars)) {
        throw new UploadThingError(`Tipo de arquivo não permitido. Use: JPG, PNG ou WebP`);
      }

      // Validação de tamanho
      const maxSizeBytes = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSizeBytes) {
        throw new UploadThingError(`Arquivo muito grande. Tamanho máximo: 2MB`);
      }

      return { userId, uploadedBy: userId, fileType: 'avatar' };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload de avatar completo:", {
        userId: metadata.userId,
        fileUrl: file.url,
        fileName: file.name,
        fileSize: file.size,
      });

      // Salva referência no banco e atualiza o usuário
      try {
        const dbFile = await prisma.file.create({
          data: {
            fileName: sanitizeFileName(file.name),
            mimeType: file.type || 'image/jpeg',
            data: Buffer.from(''), // UploadThing hospeda o arquivo
            size: file.size,
          },
        });

        // Atualiza o usuário com o novo avatar
        await prisma.user.update({
          where: { id: metadata.userId },
          data: { avatarFileId: dbFile.id },
        });

        return {
          uploadedBy: metadata.userId,
          fileUrl: file.url,
          fileKey: file.key,
          fileId: dbFile.id,
          fileName: file.name,
        };
      } catch (error) {
        console.error("Erro ao salvar avatar no banco:", error);
        throw new UploadThingError("Erro ao processar upload");
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
