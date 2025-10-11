import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '#lib/prisma'
import withCors from '#lib/withCors'
import withAuth from '#lib/withAuth'
import { hasAnyRole } from '#lib/roles'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const userId = Number(id)
  if (isNaN(userId)) return res.status(400).json({ error: 'Invalid id' })

  if (req.method !== 'PATCH') return res.status(405).end()
  if (!hasAnyRole(req, ['ADMIN'])) return res.status(403).json({ error: 'Forbidden' })

  const { active, role } = req.body
  try {
    const updated = await prisma.user.update({ where: { id: userId }, data: { active, role } })
    return res.json(updated)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: 'Failed to update user', details: message })
  }
}

export default withCors(withAuth(handler))
