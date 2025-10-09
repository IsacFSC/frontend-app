import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '#lib/prisma'
import withCors from '#lib/withCors'
import withAuth from '#lib/withAuth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).end()
  const taskId = Number(req.query.id)
  const scheduleId = Number(req.query.scheduleId)
  if (isNaN(taskId) || isNaN(scheduleId)) return res.status(400).json({ error: 'Invalid ids' })

  const updated = await prisma.task.update({ where: { id: taskId }, data: { userId: null, scheduleId } })
  return res.json(updated)
}

export default withCors(withAuth(handler))
