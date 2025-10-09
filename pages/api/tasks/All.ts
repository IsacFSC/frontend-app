import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '#lib/prisma'
import withCors from '#lib/withCors'
import withAuth from '#lib/withAuth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const {
    limit = '10',
    offset = '0',
    userId,
    status,
    name,
    startDate,
    endDate,
  } = req.query as any;

  const take = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const skip = Math.max(0, parseInt(offset, 10) || 0);

  const where: any = {};
  if (typeof userId !== 'undefined' && userId !== '') {
    where.userId = Number(userId);
  }
  if (typeof status !== 'undefined' && status !== '') {
    where.status = status;
  }
  if (typeof name !== 'undefined' && name !== '') {
    where.name = { contains: String(name), mode: 'insensitive' };
  }
  if (startDate || endDate) {
    where.createdAt = {} as any;
    if (startDate) {
      const sd = new Date(String(startDate));
      if (!isNaN(sd.getTime())) where.createdAt.gte = sd;
    }
    if (endDate) {
      const ed = new Date(String(endDate));
      if (!isNaN(ed.getTime())) {
        // include whole day by setting to end of day
        ed.setHours(23, 59, 59, 999);
        where.createdAt.lte = ed;
      }
    }
  }

  try {
    const total = await prisma.task.count({ where });
    const tasks = await prisma.task.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const page = Math.floor(skip / take) + 1;
    return res.json({ data: tasks, total, page, limit: take });
  } catch (err: any) {
    console.error('Failed to fetch tasks', err);
    return res.status(500).json({ error: 'Internal error', details: err?.message || String(err) });
  }
}

export default withCors(withAuth(handler))
