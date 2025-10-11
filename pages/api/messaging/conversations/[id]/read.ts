import type { NextApiResponse } from 'next'
import prisma from '#lib/prisma'
import withCors from '#lib/withCors'
import withAuth, { AuthenticatedRequest } from '#lib/withAuth'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const conversationId = Number(req.query.id)
  if (isNaN(conversationId)) return res.status(400).json({ error: 'Invalid conversation id' })
  const userId = Number(req.user?.id)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  // find unread messages in conversation not authored by current user
  const unread = await prisma.message.findMany({ where: { conversationId, authorId: { not: userId }, NOT: { readBy: { some: { userId } } } } })

  // create MessageRead entries for each
  const createOps = unread.map(m => prisma.messageRead.create({ data: { messageId: m.id, userId } }))
  await prisma.$transaction(createOps)

  return res.json({ marked: unread.length })
}

export default withCors(withAuth(handler))