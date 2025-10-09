import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '#lib/prisma'
import withCors from '#lib/withCors'
import withAuth from '#lib/withAuth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const userId = Number((req as any).user?.id)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  // prevent caching / conditional requests which may yield 304 responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')

  // Count messages where there is no MessageRead entry for this user
  const totalUnread = await prisma.$queryRaw`SELECT COUNT(*) FROM "Message" m WHERE NOT EXISTS (SELECT 1 FROM "MessageRead" mr WHERE mr."messageId" = m.id AND mr."userId" = ${userId}) AND m."authorId" != ${userId}`
  // prisma.$queryRaw returns bigint or row; coerce
  const count = Array.isArray(totalUnread) && totalUnread[0] ? Number((totalUnread as any)[0].count || 0) : 0
  // return as a JSON number
  return res.status(200).json(count)
}

export default withCors(withAuth(handler))
