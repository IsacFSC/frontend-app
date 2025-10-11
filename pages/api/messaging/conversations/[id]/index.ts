import type { NextApiResponse } from 'next'
import prisma from '#lib/prisma'
import withCors from '#lib/withCors'
import withAuth, { AuthenticatedRequest } from '#lib/withAuth'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const conversationId = Number(req.query.id)
  if (isNaN(conversationId)) {
    return res.status(400).json({ error: 'Invalid conversation id' })
  }

  const userId = Number(req.user?.id)
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Check if user is a participant of the conversation
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      participants: {
        some: {
          id: userId,
        },
      },
    },
  })

  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found or you are not a participant' })
  }

  if (req.method === 'DELETE') {
    await prisma.conversation.delete({
      where: {
        id: conversationId,
      },
    })
    return res.status(204).end()
  }

  res.status(405).end()
}

export default withCors(withAuth(handler))
