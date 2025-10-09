import type { NextApiRequest, NextApiResponse } from 'next'
import withCors from '#lib/withCors'
import withAuth from '#lib/withAuth'
import prisma from '#lib/prisma'
import formidable from 'formidable'
import fs from 'fs/promises'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const conversationId = Number(req.query.id)

  const form = new formidable.IncomingForm()
  form.parse(req as any, async (err: any, fields: any, files: any) => {
    if (err) return res.status(400).json({ error: 'Upload error' })
    const file = (files.file as any)
    // formidable provides a temporary filepath (file.filepath or file.path) depending on version
    const filePath = file.filepath || file.filePath || file.path
    if (!filePath) return res.status(400).json({ error: 'Uploaded file not found on server' })
    const buffer = await fs.readFile(filePath)
    const created = await prisma.file.create({ data: {
      fileName: file.originalFilename || file.name || 'upload',
      mimeType: file.mimetype || file.type || 'application/octet-stream',
      data: buffer,
      size: file.size || buffer.length || 0,
    }})

    const message = await prisma.message.create({ data: {
      content: fields.content || '',
      authorId: Number((req as any).user?.id),
      conversationId: conversationId,
      fileId: created.id,
    }, include: { author: true, file: true }})

    // Normalize response so client gets easy-to-use fields
    const response = {
      ...message,
      // `file` expected by client to be an identifier usable in the download URL (id or filename)
      file: message.file ? message.file.id : null,
      fileMimeType: message.file ? message.file.mimeType : undefined,
    }

    res.json(response)
  })
}

export default withCors(withAuth(handler))
