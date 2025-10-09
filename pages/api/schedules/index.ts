import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '#lib/prisma'
import withCors from '#lib/withCors'
import withAuth from '#lib/withAuth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const schedules = await prisma.schedule.findMany({
      take: 100,
      orderBy: { startTime: 'desc' },
      include: { users: { include: { user: true } }, tasks: true, file: true },
    })
    return res.json(schedules)
  }

  if (req.method === 'POST') {
    const data = req.body
    const schedule = await prisma.schedule.create({ data })
    return res.status(201).json(schedule)
  }

  res.status(405).end()
}

export default withCors(withAuth(handler))

