import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import withCors from '../../../lib/withCors'
import withAuth from '../../../lib/withAuth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  const schedules = await prisma.schedule.findMany({ where: { startTime: { gte: startOfDay, lte: endOfDay } }, include: { users: { include: { user: true } }, tasks: true } })
  return res.json(schedules)
}

export default withCors(withAuth(handler))
