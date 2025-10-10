import type { NextApiRequest, NextApiResponse } from 'next'
import formidable, { File, Fields } from 'formidable'
import fs from 'fs/promises'
import withCors from '#lib/withCors'
import withAuth, { AuthenticatedRequest } from '#lib/withAuth'
import prisma from '#lib/prisma'
import { signToken } from '#lib/auth'

export const config = { api: { bodyParser: false } }

export default withCors(withAuth(async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const form = new formidable.IncomingForm()
  form.parse(req, async (err: Error, _fields: Fields, files: { [key: string]: File | File[] }) => {
    if (err) return res.status(400).json({ error: 'Upload error' })
  const file = Array.isArray(files.file) ? files.file[0] : files.file;
  const filePath = file.filepath || file.filePath || file.path
  if (!filePath) return res.status(400).json({ error: 'Uploaded file not found on server' })
  const buffer = await fs.readFile(filePath)
    const userId = Number(req.user?.id)

    const fileExt = (file.originalFilename || 'bin').split('.').pop() || 'bin'
    const fileName = `${userId}.${fileExt}`

  const createdFile = await prisma.file.create({ data: { fileName, mimeType: file.mimetype || 'application/octet-stream', data: buffer, size: file.size || buffer.length || 0 } })

    const updatedUser = await prisma.user.update({ where: { id: userId }, data: { avatarFileId: createdFile.id }, select: { id: true, name: true, email: true, avatarFileId: true, role: true, createdAt: true, passwordHash: true, active: true } })

    // generate a new token reflecting avatar change (frontend expects token + user sometimes)
    const token = signToken({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role, avatar: updatedUser.avatarFileId })
    return res.json({ user: updatedUser, token })
  })
}))
