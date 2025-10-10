import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '#lib/prisma'
import withCors from '#lib/withCors'
import withAuth, { AuthenticatedRequest } from '#lib/withAuth'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const userId = Number(req.user?.id)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  // prevent caching / conditional requests which may yield 304 responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')

  // Count messages where the user is a participant in the conversation,
  // there is no MessageRead entry for this user, and the user is not the author.
  const totalUnread = await prisma.$queryRaw`
    SELECT COUNT(m.id)
    FROM "Message" m
    JOIN "_ConversationToUser" ctu ON m."conversationId" = ctu."A"
    WHERE ctu."B" = ${userId}
      AND m."authorId" != ${userId}
      AND NOT EXISTS (
        SELECT 1 FROM "MessageRead" mr WHERE mr."messageId" = m.id AND mr."userId" = ${userId}
      )`
  // prisma.$queryRaw returns array with object containing bigint
  const count = Array.isArray(totalUnread) && totalUnread[0] ? Number((totalUnread[0] as { count: bigint }).count || 0) : 0
  // return as a JSON number
  return res.status(200).json(count)
}

export default withCors(withAuth(handler))
