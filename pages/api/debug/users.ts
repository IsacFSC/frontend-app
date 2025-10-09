import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import withCors from '../../../lib/withCors'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Forbidden in production' })
  }

  if (req.method !== 'GET') return res.status(405).end()

  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, passwordHash: true } })
    return res.json(users)
  } catch (err: any) {
    console.error('Debug users error:', err)
    return res.status(500).json({ error: 'Internal error', details: err?.message || String(err) })
  }
}
export default withCors(handler)
