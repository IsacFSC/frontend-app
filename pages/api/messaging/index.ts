import type { NextApiResponse } from 'next'
import prisma from '#lib/prisma'
import withCors from '#lib/withCors'
import withAuth, { AuthenticatedRequest } from '#lib/withAuth'

interface MessagingRequest extends AuthenticatedRequest {
  body: {
    subject?: string;
    participantIds?: number[];
    message?: string;
    recipientId?: number;
  };
}

async function handler(req: MessagingRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const convs = await prisma.conversation.findMany({ take: 100, orderBy: { updatedAt: 'desc' }, include: { participants: true, messages: { orderBy: { createdAt: 'desc' }, take: 1 } } })
    // annotate hasUnreadMessages client-side or compute quickly by checking MessageRead but keep simple here
    return res.json(convs)
  }

  if (req.method === 'POST') {
    const { subject, participantIds, message, recipientId } = req.body

    // If recipientId provided, create a conversation between caller and recipient and create initial message
    if (recipientId) {
      const authorId = Number(req.user?.id)
      if (!authorId) return res.status(401).json({ error: 'Unauthorized' })
      // create conversation and connect both participants
      const conv = await prisma.conversation.create({
        data: {
          subject,
          participants: { connect: [{ id: authorId }, { id: Number(recipientId) }] },
        },
        include: { participants: true },
      })

      // create initial message
      if (message) {
        await prisma.message.create({ data: { content: message, authorId, conversationId: conv.id } })
      }
      const full = await prisma.conversation.findUnique({ where: { id: conv.id }, include: { participants: true, messages: true } })
      return res.status(201).json(full)
    }

    // Fallback: allow creating conversation by providing participantIds array
    if (participantIds && Array.isArray(participantIds)) {
      const conv = await prisma.conversation.create({
        data: {
          subject,
          participants: { connect: participantIds.map((id: number) => ({ id })) },
        },
        include: { participants: true },
      })
      return res.status(201).json(conv)
    }

    return res.status(400).json({ error: 'Missing participantIds or recipientId' })
  }

  res.status(405).end()
}

export default withCors(withAuth(handler))
