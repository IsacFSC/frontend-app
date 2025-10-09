import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '#lib/prisma'
import withCors from '../../../../lib/withCors'
import withAuth from '../../../../lib/withAuth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const { email } = req.query
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Missing email' })
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(404).json({ error: 'User not found' })
  // return public fields
  return res.json({ id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatarFileId })
}

export default withCors(withAuth(handler))
