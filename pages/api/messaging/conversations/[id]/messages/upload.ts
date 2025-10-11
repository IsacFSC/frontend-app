import type { NextApiResponse } from 'next'
import withCors from '#lib/withCors'
import withAuth, { AuthenticatedRequest } from '#lib/withAuth'
import prisma from '#lib/prisma'
import formidable, { File, Fields, Files } from 'formidable'
import fs from 'fs/promises'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const conversationId = Number(req.query.id)

  const form = new formidable.IncomingForm()
  form.parse(req, async (err: Error, fields: Fields, files: Files) => {
    if (err) {
      console.error('Formidable error:', err)
      return res.status(400).json({ error: 'Upload error' })
    }

    const uploadedFile = files.file
    if (!uploadedFile || Array.isArray(uploadedFile)) {
      return res.status(400).json({ error: 'Please upload a single file named "file".' })
    }
    const file: File = uploadedFile

    const filePath = file.filepath
    if (!filePath) return res.status(400).json({ error: 'Uploaded file not found on server' })

    try {
      const buffer = await fs.readFile(filePath)
      const created = await prisma.file.create({
        data: {
          fileName: file.originalFilename || 'upload',
          mimeType: file.mimetype || 'application/octet-stream',
          data: buffer,
          size: file.size,
        },
      })

      const content = Array.isArray(fields.content) ? fields.content[0] : fields.content
      const message = await prisma.message.create({
        data: {
          content: content || '',
          authorId: Number(req.user?.id),
          conversationId: conversationId,
          fileId: created.id,
        },
        include: { author: true, file: true },
      })

      // Normalize response so client gets easy-to-use fields
      const response = {
        ...message,
        // `file` expected by client to be an identifier usable in the download URL (id or filename)
        file: message.file ? message.file.id : null,
        fileMimeType: message.file ? message.file.mimeType : undefined,
      }

      res.json(response)
    } catch (error) {
      console.error('Error processing file or creating message:', error)
      res.status(500).json({ error: 'Internal server error' })
    } finally {
      // Clean up the temporary file
      if (filePath) {
        fs.unlink(filePath).catch(console.error)
      }
    }
  })
}

export default withCors(withAuth(handler))