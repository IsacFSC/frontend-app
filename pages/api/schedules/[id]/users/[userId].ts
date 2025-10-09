import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '#lib/prisma'
import withCors from '#lib/withCors'
import withAuth from '#lib/withAuth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const scheduleId = Number(req.query.id)
  const userId = Number(req.query.userId)
  if (isNaN(scheduleId) || isNaN(userId)) return res.status(400).json({ error: 'Invalid ids' })

  if (req.method === 'POST') {
    const { skill } = req.body || {}
    await prisma.usersOnSchedules.create({ data: { scheduleId, userId, skill: skill || 'OUTROS' } })
    return res.status(201).end()
  }

  if (req.method === 'DELETE') {
    await prisma.usersOnSchedules.delete({ where: { userId_scheduleId: { userId, scheduleId } } })
    return res.status(204).end()
  }

  res.status(405).end()
}

export default withCors(withAuth(handler))
