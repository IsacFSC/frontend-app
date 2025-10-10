import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import { comparePassword, signToken } from '../../../lib/auth'
import withCors from '../../../lib/withCors'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials (user not found)' })

    if (!user.passwordHash) return res.status(500).json({ error: 'User has no password set' })

    const ok = await comparePassword(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials (wrong password)' })

    const token = signToken({ id: user.id, email: user.email, role: user.role })
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err: unknown) {
    console.error('SignIn error:', err?.message || err)
    return res.status(500).json({ error: 'Internal server error', details: err?.message || String(err) })
  }
}
export default withCors(handler)
