import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import withCors from '../../../lib/withCors'
import withAuth from '../../../lib/withAuth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const userId = Number((req as any).user?.id)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const schedules = await prisma.schedule.findMany({ where: { users: { some: { userId } } }, include: { users: { include: { user: true } }, tasks: true } })
  return res.json(schedules)
}

export default withCors(withAuth(handler))
