import type { NextApiResponse } from 'next'
import prisma from '#lib/prisma'
import withCors from '#lib/withCors'
import withAuth, { AuthenticatedRequest } from '#lib/withAuth'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const conversationId = Number(req.query.id)
  if (isNaN(conversationId)) return res.status(400).json({ error: 'Invalid conversation id' })

  if (req.method === 'GET') {
    const messages = await prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' }, include: { author: true, file: true } })
    // Normalize file fields for easier client consumption
    const normalized = messages.map(m => ({
      ...m,
      file: m.file ? m.file.id : null,
      fileMimeType: m.file ? m.file.mimeType : undefined,
    }))
    return res.json(normalized)
  }

  if (req.method === 'POST') {
    const { content } = req.body
    const authorId = Number(req.user?.id)
    if (!authorId) return res.status(401).json({ error: 'Unauthorized' })
    const message = await prisma.message.create({ data: { content: content || '', authorId, conversationId }, include: { author: true } })
    return res.status(201).json(message)
  }

  res.status(405).end()
}

export default withCors(withAuth(handler))