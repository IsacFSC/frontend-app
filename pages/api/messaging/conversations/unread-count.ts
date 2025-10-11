import type { NextApiResponse } from 'next'
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

  const count = await prisma.message.count({
    where: {
      conversation: {
        participants: {
          some: {
            id: userId,
          },
        },
      },
      authorId: {
        not: userId,
      },
      readBy: {
        none: {
          userId: userId,
        },
      },
    },
  })
  return res.status(200).json(count)
}

export default withCors(withAuth(handler))
