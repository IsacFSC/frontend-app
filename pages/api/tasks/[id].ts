import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '#lib/prisma'
import withCors from '#lib/withCors'
import withAuth from '#lib/withAuth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id)
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })

  if (req.method === 'GET') {
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task) return res.status(404).json({ error: 'Not found' })
    return res.json(task)
  }

  if (req.method === 'PATCH') {
    const { taskDate, ...data } = req.body;
    if (taskDate !== undefined) {
      data.taskDate = taskDate ? new Date(taskDate) : null;
    }
    const updated = await prisma.task.update({ where: { id }, data });
    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    await prisma.task.delete({ where: { id } })
    return res.status(204).end()
  }

  res.status(405).end()
}

export default withCors(withAuth(handler))
