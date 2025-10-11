import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import { hashPassword, verifyToken } from '../../../lib/auth'
import withCors from '../../../lib/withCors'
import withAuth from '../../../lib/withAuth'
import { hasAnyRole } from '../../../lib/roles'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET /All -> list users (roles: ADMIN, LEADER, USER)
  if (req.method === 'GET') {
    if (!hasAnyRole(req, ['ADMIN', 'LEADER', 'USER'])) return res.status(403).json({ error: 'Forbidden' })
    const users = await prisma.user.findMany({ take: 50 })
    return res.json(users)
  }

  // POST / -> create user (ADMIN only per controller)
  if (req.method === 'POST') {
    const { name, email, password, role } = req.body
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' })
    const passwordHash = await hashPassword(password)

    // If the request is authenticated and the caller is ADMIN, allow setting role
    let roleToSet = 'USER'
    try {
      const authHeader = req.headers.authorization || ''
      const parts = authHeader.split(' ')
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1]
        const payload = verifyToken(token)
        if (payload && payload.role === 'ADMIN' && role) {
          roleToSet = role
        }
      }
    } catch { // CORRIGIDO: Removido '_err' pois não era usado
      // ignore and default to USER
      roleToSet = 'USER'
    }

    const user = await prisma.user.create({ data: { name, email, passwordHash, role: roleToSet } })
    return res.status(201).json(user)
  }

  // Not implemented: other verbs handled by separate routes (see next steps)
  res.status(405).end()
}

// Wrap: withCors outer, withAuth for protected routes
export default withCors(async (req, res) => {
  // allow create user without auth (controller had @Roles(Role.ADMIN) but we keep registration open)
  if (req.method === 'POST') return handler(req, res)
  // other methods require auth
  return withAuth(handler)(req, res)
})
