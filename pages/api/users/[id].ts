import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '#lib/prisma'
import withCors from '#lib/withCors'
import withAuth from '#lib/withAuth'
import { hasAnyRole } from '#lib/roles'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const userId = Number(id)

  if (req.method === 'GET') {
    if (!hasAnyRole(req, ['ADMIN'])) return res.status(403).json({ error: 'Forbidden' })
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'Not found' })
    return res.json(user)
  }

  if (req.method === 'PATCH') {
    if (!hasAnyRole(req, ['ADMIN','LEADER','USER'])) return res.status(403).json({ error: 'Forbidden' })
    const data = req.body
    const updated = await prisma.user.update({ where: { id: userId }, data })
    return res.json(updated)
  }

  if (req.method === 'DELETE') {
    if (!hasAnyRole(req, ['ADMIN'])) return res.status(403).json({ error: 'Forbidden' })
    await prisma.user.delete({ where: { id: userId } })
    return res.status(204).end()
  }

  res.status(405).end()
}

export default withCors(withAuth(handler))
