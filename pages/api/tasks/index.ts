import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import withCors from '../../../lib/withCors'
import withAuth from '../../../lib/withAuth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const tasks = await prisma.task.findMany({ take: 50 })
    return res.json(tasks)
  }

  if (req.method === 'POST') {
    const { name, description, taskDate } = req.body;
    const data = {
      name,
      description,
      taskDate: taskDate ? new Date(taskDate) : null,
    };
    const task = await prisma.task.create({ data });
    return res.status(201).json(task);
  }

  res.status(405).end()
}

export default withCors(withAuth(handler))

